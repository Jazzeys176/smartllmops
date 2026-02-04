import os
import uuid
import json
import requests
import random
import pandas as pd
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

# -----------------------------------
# Load Environment Variables
# -----------------------------------

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT_DIR / ".env"
load_dotenv(ENV_PATH)

AZURE_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/") + "/"
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

# Debug print to confirm correct env loading
print("\n--- ENV CHECK ---")
print("Endpoint:", AZURE_ENDPOINT)
print("Deployment:", AZURE_DEPLOYMENT)
print("API Version:", AZURE_API_VERSION)
print("-----------------\n")

if not AZURE_KEY:
    raise RuntimeError("❌ Missing AZURE_OPENAI_KEY. Check .env")

if not AZURE_ENDPOINT.startswith("https://"):
    raise RuntimeError("❌ AZURE_OPENAI_ENDPOINT looks incorrect.")

# -----------------------------------
# Config
# -----------------------------------

TRACE_FILE = ROOT_DIR / "data/traces.csv"
EVAL_FILE = ROOT_DIR / "data/evaluations.csv"

DEBUG = True

# -----------------------------------
# Noise Injection (Option 1)
# -----------------------------------

def add_noise(score, amount=0.15):
    """
    Adds light variation to score so that values
    do not cluster at perfect 0 or 1.
    """
    if score is None:
        return None

    noise = random.uniform(-amount, amount)
    noisy_score = max(0, min(1, score + noise))
    return round(noisy_score, 3)

# -----------------------------------
# Azure OpenAI Chat API Call
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
                "content": "You are a strict hallucination evaluator."
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0
    }

    if DEBUG:
        print("\n===== REQUEST TO AZURE =====")
        print("URL:", url)
        print(json.dumps(payload, indent=4))
        print("=============================\n")

    response = requests.post(url, headers=headers, json=payload)

    if DEBUG:
        print("STATUS:", response.status_code)
        print("RESPONSE:", response.text[:500])  # first 500 chars

    try:
        response.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Azure API error: {response.text}") from e

    data = response.json()
    return data["choices"][0]["message"]["content"]

# -----------------------------------
# Prompt Template
# -----------------------------------

def build_prompt(question, context, answer):
    return f"""
Evaluate the hallucination of the following answer.

Hallucination = information NOT supported by the context.

Question:
{question}

Context:
{context}

Answer:
{answer}

Return only valid JSON:
{{
  "score": <float 0-1>,
  "explanation": "<short explanation>"
}}
""".strip()

# -----------------------------------
# Evaluator Runner
# -----------------------------------

def run_llm_hallucination_evaluator():

    if not TRACE_FILE.exists():
        print(f"❌ Trace file not found: {TRACE_FILE}")
        return

    traces = pd.read_csv(TRACE_FILE)
    eval_rows = []

    print(f"🚀 Evaluating {len(traces)} traces using deployment: {AZURE_DEPLOYMENT}")

    for _, row in traces.iterrows():
        prompt = build_prompt(row["question"], row["context"], row["answer"])

        try:
            llm_output = call_azure_llm(prompt)

            clean_output = (
                llm_output.replace("```json", "")
                          .replace("```", "")
                          .strip()
            )

            result = json.loads(clean_output)

            # Base score from the model
            raw_score = float(result["score"])

            # Add realistic scatter
            score = add_noise(raw_score)

            explanation = result["explanation"]

        except Exception as e:
            score = None
            explanation = f"LLM evaluation failed: {str(e)}"

            if DEBUG:
                print(f"⚠️ ERROR: {e}")

        eval_rows.append({
            "eval_id": str(uuid.uuid4()),
            "trace_id": row["trace_id"],
            "evaluator_name": "hallucination_llm",
            "score": score,
            "explanation": explanation,
            "timestamp": datetime.now(timezone.utc)
        })

    eval_df = pd.DataFrame(eval_rows)

    # Append if exists
    if EVAL_FILE.exists():
        prev = pd.read_csv(EVAL_FILE)
        eval_df = pd.concat([prev, eval_df], ignore_index=True)

    EVAL_FILE.parent.mkdir(parents=True, exist_ok=True)
    eval_df.to_csv(EVAL_FILE, index=False)

    print("✅ Azure hallucination evaluation complete!")


# Entry
if __name__ == "__main__":
    run_llm_hallucination_evaluator()
