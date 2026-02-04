import os
import json
import uuid
import random
from datetime import datetime, timezone
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceExistsError

# -----------------------------------
# Quality ratios
# -----------------------------------

GOOD_RATIO = 0.8
BAD_CONTEXT_RATIO = 0.1
BAD_ANSWER_RATIO = 0.1

USERS = [f"user-{str(i).zfill(2)}" for i in range(1, 21)]
# user-01, user-02, ..., user-20

TRACE_NAMES = [
    "simple-qa",
    "multi-hop-reasoning",
    "tool-use-flow"
]

# -----------------------------------
# Data bank
# -----------------------------------

DATA = [
    {
        "question": "Explain valve shutdown procedure",
        "context": "Standard operating procedure for valve shutdown safety steps including isolation and lockout",
        "answer": "The valve shutdown procedure includes isolation, lockout, and safety steps"
    },
    {
        "question": "What caused temperature spike?",
        "context": "Emergency protocol for temperature spike mitigation and cooling system checks",
        "answer": "Temperature spikes are mitigated by cooling system checks and emergency protocols"
    },
    {
        "question": "Why did machine stop?",
        "context": "Machine maintenance and failure diagnostics guide for conveyor belts and motors",
        "answer": "Machine stoppage can occur due to motor failure or power issues"
    },
    {
        "question": "Explain emergency response for power failure",
        "context": "Electrical safety manual covering power failure and emergency shutdown",
        "answer": "Emergency shutdown requires following electrical safety and isolation procedures"
    },
    {
        "question": "How to handle overheating in reactor systems?",
        "context": "Pressure control guidelines for reactors and pipelines in manufacturing units",
        "answer": "Overheating can happen if cooling systems are not working properly"
    },
]

BAD_ANSWERS = [
    "This answer is unrelated to the procedure",
    "The issue was caused by network latency",
    "Software bugs are the main reason for mechanical failures",
    "User authentication problems caused the shutdown",
]

CONTEXTS = [d["context"] for d in DATA]

# -----------------------------------
# Trace builder
# -----------------------------------

def make_trace(session_id, user_id, trace_name, question, context, answer):
    """
    CHANGE:
    - Added user_id
    - Added trace_name
    """

    tokens_in = random.randint(200, 800)
    tokens_out = random.randint(50, 300)
    tokens = tokens_in + tokens_out

    return {
        "trace_id": f"trace-{random.randint(1, 7)}",
        "session_id": session_id,
        "user_id": user_id,           
        "trace_name": trace_name,     
        "timestamp": datetime.now(timezone.utc).isoformat(),

        "question": question,
        "context": context,
        "answer": answer,

        "latency_ms": random.randint(300, 2000),
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "tokens": tokens,
        "cost": round(tokens * random.uniform(0.00005, 0.0002), 5),

        "model": random.choice(["gpt-4o", "gpt-4o-mini", "llama-3.3-70b"]),
        "environment": random.choice(["dev", "stage", "prod"])
    }

# -----------------------------------
# Azure Function entry
# -----------------------------------

def main(mytimer):

    blob_service = BlobServiceClient.from_connection_string(
        os.environ["AzureWebJobsStorage"]
    )

    container = blob_service.get_container_client("llmops-data")
    try:
        container.create_container()
    except ResourceExistsError:
        pass
    blob = container.get_blob_client("traces/traces.jsonl")

    # ---- FIX: create append blob ONLY if it doesn't exist ----
    if not blob.exists():
        blob.create_append_blob()

    # 🔁 Generate MULTIPLE traces per run
    traces_per_run = random.randint(2, 6)

    for _ in range(traces_per_run):

        user_id = random.choice(USERS)
        session_id = f"session-{random.randint(1, 7)}"

        trace_name = random.choice(TRACE_NAMES)

        base = random.choice(DATA)
        question = base["question"]
        context = base["context"]
        answer = base["answer"]

        r = random.random()

        if r < GOOD_RATIO:
            pass
        elif r < GOOD_RATIO + BAD_CONTEXT_RATIO:
            context = random.choice([c for c in CONTEXTS if c != context])
        else:
            answer = random.choice(BAD_ANSWERS)

        trace = make_trace(
            session_id=session_id,
            user_id=user_id,
            trace_name=trace_name,
            question=question,
            context=context,
            answer=answer
        )

        blob.append_block(json.dumps(trace) + "\n")
