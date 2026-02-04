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

if not AZURE_KEY:
    raise RuntimeError("❌ Missing AZURE_OPENAI_KEY in .env")

# -----------------------------------
# Local-only config (OPTIONAL)
# -----------------------------------

TRACE_FILE = ROOT_DIR / "data/traces.csv"
EVAL_FILE = ROOT_DIR / "data/evaluations.csv"
DEBUG = False   # set True only for local debugging

# -----------------------------------
# Azure OpenAI Chat API Call
# -----------------------------------

def call_azure_llm(prompt: str) -> str:
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
                    "You are a conciseness evaluator. "
                    "Judge if the answer is verbose, padded, repetitive, or unnecessarily long. "
                    "Return ONLY valid JSON."
                )
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"]

# -----------------------------------
# Prompt Template
# -----------------------------------

def build_prompt(question: str, context: str, answer: str) -> str:
    return f"""
Evaluate the conciseness of the AI answer.

Definition:
Conciseness = how short, clear, and to-the-point the answer is.

Question:
{question}

Context:
{context}

Answer:
{answer}

Return ONLY valid JSON:
{{
  "score": <float between 0 and 1>,
  "explanation": "<short reason>"
}}

Scoring Guide:
0.0 = extremely concise
0.5 = reasonably concise
1.0 = very verbose / padded
""".strip()

# =====================================================
# ✅ REQUIRED BY EVALUATOR REGISTRY (PRODUCTION PATH)
# =====================================================

def conciseness_llm(trace: dict) -> dict:
    """
    Per-trace conciseness evaluator.
    This function is called by EvaluatorRunner in Azure.
    """

    prompt = build_prompt(
        trace.get("question", ""),
        trace.get("context", ""),
        trace.get("answer", "")
    )

    try:
        llm_output = call_azure_llm(prompt)

        cleaned = (
            llm_output.replace("```json", "")
                      .replace("```", "")
                      .strip()
        )

        result = json.loads(cleaned)

        return {
            "score": float(result["score"]),
            "explanation": result["explanation"]
        }

    except Exception as e:
        return {
            "score": None,
            "explanation": f"Conciseness evaluation failed: {str(e)}"
        }

# =====================================================
# OPTIONAL: LOCAL CSV BATCH RUNNER (DEV ONLY)
# =====================================================

def run_llm_conciseness_evaluator():
    """
    Optional local batch runner (CSV → CSV).
    NOT used in production.
    Safe to ignore or delete.
    """

    if not TRACE_FILE.exists():
        print(f"❌ Trace file missing: {TRACE_FILE}")
        return

    traces = pd.read_csv(TRACE_FILE)
    eval_rows = []

    for _, row in traces.iterrows():
        trace = {
            "trace_id": row["trace_id"],
            "question": row["question"],
            "context": row["context"],
            "answer": row["answer"]
        }

        result = conciseness_llm(trace)

        eval_rows.append({
            "eval_id": str(uuid.uuid4()),
            "trace_id": trace["trace_id"],
            "evaluator_name": "conciseness_llm",
            "score": result["score"],
            "explanation": result["explanation"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    eval_df = pd.DataFrame(eval_rows)

    if EVAL_FILE.exists():
        prev = pd.read_csv(EVAL_FILE)
        eval_df = pd.concat([prev, eval_df], ignore_index=True)

    EVAL_FILE.parent.mkdir(parents=True, exist_ok=True)
    eval_df.to_csv(EVAL_FILE, index=False)

    print("✅ Conciseness evaluation completed (CSV mode)")

# -----------------------------------
# Local entry point only
# -----------------------------------

if __name__ == "__main__":
    run_llm_conciseness_evaluator()
