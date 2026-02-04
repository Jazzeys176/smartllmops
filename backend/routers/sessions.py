from fastapi import APIRouter
from azure.storage.blob import BlobServiceClient
import json
from collections import defaultdict
from datetime import datetime
import os

router = APIRouter()

# -----------------------------
# Utility: Load all sessions
# -----------------------------
def get_sessions():
    blob_service = BlobServiceClient.from_connection_string(
        os.environ["AzureWebJobsStorage"]
    )
    container = blob_service.get_container_client(os.environ["CONTAINER_NAME"])

    trace_blob = container.get_blob_client("traces/traces.jsonl")

    if not trace_blob.exists():
        return []

    lines = trace_blob.download_blob().readall().decode().splitlines()

    sessions = defaultdict(lambda: {
        "session_id": None,
        "user_id": None,
        "trace_count": 0,
        "total_tokens": 0,
        "total_cost": 0.0,
        "created": None
    })

    for line in lines:
        t = json.loads(line)
        sid = t["session_id"]

        s = sessions[sid]
        s["session_id"] = sid
        s["user_id"] = t.get("user_id", "unknown")
        s["trace_count"] += 1
        s["total_tokens"] += t.get("tokens", 0)
        s["total_cost"] += t.get("cost", 0.0)

        ts = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
        if s["created"] is None or ts < s["created"]:
            s["created"] = ts

    # Convert datetimes to ISO strings
    for s in sessions.values():
        if isinstance(s["created"], datetime):
            s["created"] = s["created"].isoformat()

    return list(sessions.values())

# -----------------------------
# API Route
# -----------------------------
@router.get("/")
def list_sessions():
    return get_sessions()
