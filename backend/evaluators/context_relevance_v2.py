import os
import uuid
import json
import requests
import pandas as pd
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

# -----------------------------------
# Load environment variables
# -----------------------------------

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT_DIR / ".env"
load_dotenv(ENV_PATH)

AZURE_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/") + "/"
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

print("\n--- ENV CHECK ---")
print("Endpoint:", AZURE_ENDPOINT)
print("Deployment:", AZURE_DEPLOYMENT)
print("API Version:", AZURE_API_VERSION)
print("------------------\n")

if not AZURE_KEY:
    raise RuntimeError("❌ Missing AZURE_OPENAI_KEY in .env")

# -----------------------------------
# Config
# -----------------------------------

TRACE_FILE = ROOT_DIR / "data/traces.csv"
EVAL_FILE = ROOT_DIR / "data/evaluations.csv"

DEBUG = True


# -----------------------------------
# Azure Chat Completions Call
# -----------------------------------

def call_azure_llm(prompt):
    url = (
        f"{AZURE_ENDPOINT}"
        f"openai/deployments/{AZURE_DEPLOYMENT}/chat/completions"
        f"?api-version={AZURE_API_VERSION}"
    )

    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_KEY
    }

    payload = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a strict RAG evaluator. "
                    "You must determine how relevant the retrieved context is "
                    "to the user's question."
                )
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0
    }

    if DEBUG:
        print("\n===== REQUEST TO AZURE =====")
        print("URL:", url)
        print(json.dumps(payload, indent=4))
        print("============================\n")

    response = requests.post(url, headers=headers, json=payload)

    if DEBUG:
        print("STATUS:", response.status_code)
        print("RAW BODY:", response.text[:500])

    response.raise_for_status()

    output = response.json()
    return output["choices"][0]["message"]["content"]


# -----------------------------------
# Prompt template
# -----------------------------------

def build_prompt(question, context):
    return f"""
Evaluate the Context Relevance of the retrieved RAG context.

Definition:
Context Relevance = How much the retrieved context helps answer the question.
- Score 0: Completely irrelevant.
- Score 1: Fully contains the needed information.

Question:
{question}

Retrieved Context:
{context}

Return ONLY valid JSON:
{{
  "score": <float between 0 and 1>,
  "explanation": "<short explanation>"
}}
""".strip()


# -----------------------------------
# Evaluator runner
# -----------------------------------

def run_context_relevance_evaluator():

    if not TRACE_FILE.exists():
        print(f"❌ Trace file missing: {TRACE_FILE}")
        return

    traces = pd.read_csv(TRACE_FILE)
    eval_rows = []

    print(f"🚀 Running Context Relevance evaluator on {len(traces)} traces using model: {AZURE_DEPLOYMENT}")

    for _, row in traces.iterrows():

        prompt = build_prompt(row["question"], row["context"])

        try:
            llm_output = call_azure_llm(prompt)

            if DEBUG:
                print("\n===== RAW LLM OUTPUT =====")
                print(llm_output)
                print("==========================\n")

            cleaned = (
                llm_output.replace("```json", "")
                          .replace("```", "")
                          .strip()
            )

            result = json.loads(cleaned)

            score = float(result["score"])
            explanation = result["explanation"]

        except Exception as e:
            score = None
            explanation = f"LLM evaluation failed: {e}"

            if DEBUG:
                print(f"⚠️ Error:", e)

        eval_rows.append({
            "eval_id": str(uuid.uuid4()),
            "trace_id": row["trace_id"],
            "evaluator_name": "context_relevance_llm",
            "score": score,
            "explanation": explanation,
            "timestamp": datetime.now(timezone.utc)
        })

    eval_df = pd.DataFrame(eval_rows)

    # Append to previous evaluation file if exists
    if EVAL_FILE.exists():
        prev = pd.read_csv(EVAL_FILE)
        eval_df = pd.concat([prev, eval_df], ignore_index=True)

    EVAL_FILE.parent.mkdir(parents=True, exist_ok=True)
    eval_df.to_csv(EVAL_FILE, index=False)

    print("✅ Context Relevance evaluation completed!")


# -----------------------------------
# Entry point
# -----------------------------------

if __name__ == "__main__":
    run_context_relevance_evaluator()
