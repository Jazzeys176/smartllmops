from fastapi import APIRouter, HTTPException, Query
from utils.blob_reader import read_jsonl_from_blob
import math

router = APIRouter()

CONTAINER_NAME = "llmops-data"
EVALS_BLOB_PATH = "evaluations/evaluations.jsonl"

# -------------------------------
# Helpers
# -------------------------------

def scrub(obj):
    """
    Deep clean any leftover NaN or Inf values to ensure JSON safety
    """
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: scrub(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [scrub(i) for i in obj]
    return obj

# -------------------------------
# GET /api/evaluations
# -------------------------------

@router.get("")
def get_all_evaluations(
    evaluator: str = Query(None),
    trace_id: str = Query(None),
    limit: int = 200
):
    """
    Returns filtered evaluation logs from blob storage
    """

    # 1. Load data from blob
    evals = read_jsonl_from_blob(
        container_name=CONTAINER_NAME,
        blob_path=EVALS_BLOB_PATH
    )

    if not evals:
        return []

    # 2. Filtering logic
    filtered_evals = evals
    
    if evaluator:
        filtered_evals = [e for e in filtered_evals if e.get("evaluator_name") == evaluator]

    if trace_id:
        filtered_evals = [e for e in filtered_evals if e.get("trace_id") == trace_id]

    # 3. Sorting (Descending by timestamp)
    # Assumes timestamp is in a sortable string format (ISO 8601) or numeric
    filtered_evals.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    # 4. Limit results
    results = filtered_evals[:limit]

    # 5. Scrub and return
    return scrub(results)