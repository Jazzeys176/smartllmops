import os
import json
import random
import requests
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
    raise RuntimeError("❌ Missing AZURE_OPENAI_KEY")

if not AZURE_ENDPOINT.startswith("https://"):
    raise RuntimeError("❌ AZURE_OPENAI_ENDPOINT looks incorrect")

# -----------------------------------
# Optional Noise Injection (KEEPED BY DESIGN)
# -----------------------------------

def add_noise(score: float, amount: float = 0.15) -> float:
    """
    Adds light variation to score so values don't cluster at 0 or 1.
    """
    if score is None:
        return None

    noise = random.uniform(-amount, amount)
    return round(max(0.0, min(1.0, score + noise)), 3)

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
                    "You are a strict hallucination evaluator. "
                    "Hallucination means information NOT supported by the provided context. "
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
Evaluate the hallucination of the following answer.

Definition:
Hallucination = information NOT supported by the context.

Question:
{question}

Context:
{context}

Answer:
{answer}

Return ONLY valid JSON:
{{
  "score": <float between 0 and 1>,
  "explanation": "<short explanation>"
}}
""".strip()

# =====================================================
# ✅ REQUIRED BY EVALUATOR REGISTRY (PRODUCTION ONLY)
# =====================================================

def hallucination_llm(trace: dict) -> dict:
    """
    Per-trace hallucination evaluator.
    Called by EvaluatorRunner inside Azure Functions.
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

        raw_score = float(result["score"])
        score = add_noise(raw_score)

        return {
            "score": score,
            "explanation": result["explanation"]
        }

    except Exception as e:
        return {
            "score": None,
            "explanation": f"Hallucination evaluation failed: {str(e)}"
        }
