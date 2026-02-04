from fastapi import APIRouter
from pathlib import Path
import json
import os

router = APIRouter()
TEMPLATE_FILE = Path(__file__).resolve().parents[2] / "data" / "templates.json"

@router.get("")
def get_templates():
    if not TEMPLATE_FILE.exists():
        return []

    with open(TEMPLATE_FILE, "r") as f:
        templates = json.load(f)

    last_modified = os.path.getmtime(TEMPLATE_FILE)
    
    return {
        "updated_at": last_modified,
        "templates": templates
    }
