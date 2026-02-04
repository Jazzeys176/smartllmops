from fastapi import APIRouter, HTTPException, BackgroundTasks
import json
import os
import uuid
import pandas as pd
import requests
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

router = APIRouter()

ROOT_DIR = Path(__file__).resolve().parents[2]
DATASETS_DIR = ROOT_DIR / "datasets"
EVAL_RESULTS_FILE = ROOT_DIR / "data" / "dataset_evaluations.csv"
ENV_PATH = ROOT_DIR / ".env"

load_dotenv(ENV_PATH)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

@router.get("")
def list_datasets():
    if not DATASETS_DIR.exists():
        return []
    
    datasets = []
    for file in DATASETS_DIR.glob("*.json"):
        datasets.append({
            "name": file.stem,
            "path": str(file.relative_to(ROOT_DIR))
        })
    return datasets

@router.get("/{dataset_name}")
def get_dataset(dataset_name: str):
    file_path = DATASETS_DIR / f"{dataset_name}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_name}/results")
def get_dataset_results(dataset_name: str):
    if not EVAL_RESULTS_FILE.exists():
        return []
    
    try:
        df = pd.read_csv(EVAL_RESULTS_FILE)
        df_filtered = df[df["dataset_name"] == dataset_name]
        return df_filtered.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def call_groq(system_prompt, user_prompt):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0
    }
    response = requests.post(GROQ_URL, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def run_evaluations_background(dataset_name: str, file_path: Path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    eval_rows = []
    
    # Define system prompts for different evaluators
    evaluators = {
        "hallucination": {
            "system": "You are a strict hallucination evaluator. Given question, context, and answer, return hallucination score. Return ONLY valid JSON: {\"score\": <float 0-1>, \"explanation\": \"<string>\"}",
            "template": "Evaluate hallucination:\nQuestion: {question}\nContext: {context}\nAnswer: {answer}"
        },
        "conciseness": {
            "system": "You are a conciseness evaluator. Judge if the answer is overly long or verbose. Return ONLY valid JSON: {\"score\": <float 0-1>, \"explanation\": \"<string>\"}",
            "template": "Evaluate conciseness:\nQuestion: {question}\nContext: {context}\nAnswer: {answer}"
        },
        "context_relevance": {
            "system": "You are a strict RAG evaluator. Determine if the retrieved context is relevant to the user question. Return ONLY valid JSON: {\"score\": <float 0-1>, \"explanation\": \"<string>\"}",
            "template": "Evaluate relevance:\nQuestion: {question}\nContext: {context}"
        }
    }

    for item in data:
        question = item["input"]["question"]
        context = item["input"]["context"]
        answer = item["expected_output"]["answer"]
        item_id = item["id"]

        for eval_name, config in evaluators.items():
            user_prompt = config["template"].format(question=question, context=context, answer=answer)
            try:
                output = call_groq(config["system"], user_prompt)
                clean_output = output.replace("```json", "").replace("```", "").strip()
                result = json.loads(clean_output)
                
                eval_rows.append({
                    "eval_id": str(uuid.uuid4()),
                    "dataset_name": dataset_name,
                    "item_id": item_id,
                    "evaluator_name": eval_name,
                    "score": float(result.get("score", 0)),
                    "explanation": result.get("explanation", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            except Exception as e:
                print(f"Error evaluating {item_id} with {eval_name}: {e}")

    if eval_rows:
        eval_df = pd.DataFrame(eval_rows)
        if EVAL_RESULTS_FILE.exists():
            existing_df = pd.read_csv(EVAL_RESULTS_FILE)
            eval_df = pd.concat([existing_df, eval_df], ignore_index=True)
        
        EVAL_RESULTS_FILE.parent.mkdir(exist_ok=True)
        eval_df.to_csv(EVAL_RESULTS_FILE, index=False)
        print(f"✅ Evaluation for {dataset_name} completed.")

@router.post("/{dataset_name}/run")
def run_dataset_evaluation(dataset_name: str, background_tasks: BackgroundTasks):
    file_path = DATASETS_DIR / f"{dataset_name}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    background_tasks.add_task(run_evaluations_background, dataset_name, file_path)
    return {"message": f"Evaluation for {dataset_name} started in background"}
