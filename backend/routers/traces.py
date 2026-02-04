from fastapi import APIRouter, HTTPException
from collections import defaultdict
from utils.blob_reader import read_jsonl_from_blob
import math

router = APIRouter()

CONTAINER_NAME = "llmops-data"
TRACES_BLOB_PATH = "traces/traces.jsonl"
EVALS_BLOB_PATH = "evaluations/evaluations.jsonl"


# -------------------------------
# Helpers
# -------------------------------

def scrub(obj):
    """
    Ensure no NaN / Inf values leak to UI
    """
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: scrub(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [scrub(i) for i in obj]
    return obj


# -------------------------------
# GET /api/traces
# -------------------------------

@router.get("")
def get_all_traces():
    """
    Returns all traces with aggregated evaluation scores
    """

    # Load traces from blob
    traces = read_jsonl_from_blob(
        container_name=CONTAINER_NAME,
        blob_path=TRACES_BLOB_PATH
    )

    if not traces:
        return []

    # Load evaluations from blob
    evals = read_jsonl_from_blob(
        container_name=CONTAINER_NAME,
        blob_path=EVALS_BLOB_PATH
    )

    # Build trace_id -> {evaluator_name: score}
    scores_map = defaultdict(dict)
    for e in evals:
        score = e.get("score")
        if score is None:
            continue
        scores_map[e["trace_id"]][e["evaluator_name"]] = score

    # Inject scores into traces
    for t in traces:
        t["scores"] = scores_map.get(t["trace_id"], {})

    return scrub(traces)


# -------------------------------
# GET /api/traces/{trace_id}
# -------------------------------

@router.get("/{trace_id}")
def get_trace(trace_id: str):
    """
    Returns a single trace with its evaluation scores
    """

    traces = read_jsonl_from_blob(
        container_name=CONTAINER_NAME,
        blob_path=TRACES_BLOB_PATH
    )

    trace = next((t for t in traces if t["trace_id"] == trace_id), None)
    if not trace:
        raise HTTPException(404, "Trace not found")

    evals = read_jsonl_from_blob(
        container_name=CONTAINER_NAME,
        blob_path=EVALS_BLOB_PATH
    )

    trace["scores"] = {}
    for e in evals:
        if e["trace_id"] == trace_id and e.get("score") is not None:
            trace["scores"][e["evaluator_name"]] = e["score"]

    return scrub(trace)
