from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter()

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "evaluator_config.json"


@router.get("")
def get_evaluators():
    if not DATA_PATH.exists():
        return []

    with open(DATA_PATH, "r") as f:
        return json.load(f)
