from azure.storage.blob import BlobServiceClient
from datetime import datetime, timezone
import os, json
from collections import defaultdict


def main(mytimer):
    blob_service = BlobServiceClient.from_connection_string(
        os.environ["AzureWebJobsStorage"]
    )
    container = blob_service.get_container_client(
        os.environ["CONTAINER_NAME"]
    )

    # ==============================
    # 1. Load Traces
    # ==============================
    traces = []
    trace_blob = container.get_blob_client("traces/traces.jsonl")
    if not trace_blob.exists():
        return

    for line in trace_blob.download_blob().readall().decode().splitlines():
        traces.append(json.loads(line))

    if not traces:
        return

    # ==============================
    # 2. Load Evaluations
    # ==============================
    evals_by_trace = defaultdict(dict)
    eval_blob = container.get_blob_client("evaluations/evaluations.jsonl")
    if eval_blob.exists():
        for line in eval_blob.download_blob().readall().decode().splitlines():
            e = json.loads(line)
            evals_by_trace[e["trace_id"]][e["evaluator_name"]] = e["score"]

    # ==============================
    # 3. Session Fact Materialization
    # ==============================
    sessions = {}
    for t in sorted(traces, key=lambda x: x["timestamp"]):
        sid = t["session_id"]
        if sid not in sessions:
            sessions[sid] = {
                "session_id": sid,
                "user_id": t.get("user_id"),
                "first_trace_id": t["trace_id"],
                "session_start_time": t["timestamp"],
            }

    # ==============================
    # 4. Trace-level Aggregates
    # ==============================
    total_traces = len(traces)
    total_tokens = 0
    total_cost = 0.0
    total_latency = 0

    model_tokens = defaultdict(int)
    model_cost = defaultdict(float)
    model_trace_count = defaultdict(int)

    trace_count_by_name = defaultdict(int)
    cost_by_trace_name = defaultdict(float)
    tokens_by_trace_name = defaultdict(int)

    users = set()

    for t in traces:
        total_tokens += t.get("tokens", 0)
        total_cost += t.get("cost", 0.0)
        total_latency += t.get("latency_ms", 0)

        model = t.get("model", "unknown")
        model_tokens[model] += t.get("tokens", 0)
        model_cost[model] += t.get("cost", 0.0)
        model_trace_count[model] += 1

        trace_name = t.get("trace_name", "unknown")
        trace_count_by_name[trace_name] += 1
        cost_by_trace_name[trace_name] += t.get("cost", 0.0)
        tokens_by_trace_name[trace_name] += t.get("tokens", 0)

        if t.get("user_id"):
            users.add(t["user_id"])

    # ==============================
    # 5. Session-level KPIs
    # ==============================
    first_response_scores = []

    for s in sessions.values():
        trace_id = s["first_trace_id"]
        scores = evals_by_trace.get(trace_id, {})

        # First response accuracy MUST come from first trace only
        if "first_response_accuracy" in scores:
            first_response_scores.append(scores["first_response_accuracy"])

    first_response_accuracy_avg = (
        round(sum(first_response_scores) / len(first_response_scores), 3)
        if first_response_scores else None
    )

    # ==============================
    # 6. Evaluation Quality Summary
    # ==============================
    eval_score_sum = defaultdict(float)
    eval_count = defaultdict(int)

    for scores in evals_by_trace.values():
        for name, score in scores.items():
            if score is not None:
                eval_score_sum[name] += score
                eval_count[name] += 1

    evaluation_summary = {
        name: {
            "count": eval_count[name],
            "avg_score": round(eval_score_sum[name] / eval_count[name], 3)
        }
        for name in eval_count
    }

    # ==============================
    # 7. Final KPI Snapshot
    # ==============================
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),

        # Volume
        "total_traces": total_traces,
        "total_sessions": len(sessions),
        "total_users": len(users),
        "avg_traces_per_session": round(total_traces / len(sessions), 2),

        # Performance
        "avg_latency_ms": round(total_latency / total_traces, 2),

        # Cost & Tokens
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 6),

        "tokens_by_model": dict(model_tokens),
        "cost_by_model": dict(model_cost),
        "trace_count_by_model": dict(model_trace_count),

        # Feature usage
        "trace_count_by_name": dict(trace_count_by_name),
        "cost_by_trace_name": dict(cost_by_trace_name),
        "tokens_by_trace_name": dict(tokens_by_trace_name),

        # Quality
        "first_response_accuracy_avg": first_response_accuracy_avg,
        "evaluation_summary": evaluation_summary
    }

    # ==============================
    # 8. Write Snapshot
    # ==============================
    out_blob = container.get_blob_client("aggregates/metrics.json")
    out_blob.upload_blob(json.dumps(metrics, indent=2), overwrite=True)
