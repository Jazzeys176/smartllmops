from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceExistsError
from datetime import datetime, timezone
import os, json, uuid
from evaluators.registry import EVALUATORS
from collections import defaultdict

# Normalized names for UI
DISPLAY_NAME = {
    "hallucination_llm": "hallucination_score",
    "context_match_llm": "context_score",
    "answer_quality_llm": "answer_quality_score",
}

def main(mytimer):
    blob_service = BlobServiceClient.from_connection_string(
        os.environ["AzureWebJobsStorage"]
    )
    container = blob_service.get_container_client(os.environ["CONTAINER_NAME"])

    # ---- Ensure evaluation blob exists ----
    eval_blob = container.get_blob_client("evaluations/evaluations.jsonl")
    try:
        eval_blob.create_append_blob()
    except ResourceExistsError:
        pass

    # ---- Load ALL traces ----
    trace_blob = container.get_blob_client("traces/traces.jsonl")
    if not trace_blob.exists():
        return

    traces = [
        json.loads(line)
        for line in trace_blob.download_blob().readall().decode().splitlines()
    ]

    # ---- Load EXISTING evaluations ----
    already_done = defaultdict(set)

    if eval_blob.exists():
        for line in eval_blob.download_blob().readall().decode().splitlines():
            e = json.loads(line)
            already_done[e["trace_id"]].add(e["evaluator_name"])

    # ---- Evaluate ONLY missing items ----
    for trace in traces:
        for evaluator_name, evaluator_fn in EVALUATORS.items():

            clean_name = DISPLAY_NAME.get(evaluator_name, evaluator_name)

            # 🚫 Skip if already evaluated
            if clean_name in already_done[trace["trace_id"]]:
                continue

            # 🟢 Perform evaluation
            try:
                # Make LLM deterministic inside evaluator_fn (YOU add this)
                result = evaluator_fn(trace)

                evaluation = {
                    "eval_id": str(uuid.uuid4()),
                    "trace_id": trace["trace_id"],
                    "evaluator_name": clean_name,
                    "score": float(result.get("score")) if result.get("score") is not None else None,
                    "explanation": result.get("explanation", ""),
                    "status": result.get("status", "completed"),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            except Exception as e:
                evaluation = {
                    "eval_id": str(uuid.uuid4()),
                    "trace_id": trace["trace_id"],
                    "evaluator_name": clean_name,
                    "score": None,
                    "explanation": f"Evaluator failed: {str(e)}",
                    "status": "error",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            # Append only NEW result
            eval_blob.append_block(json.dumps(evaluation) + "\n")
