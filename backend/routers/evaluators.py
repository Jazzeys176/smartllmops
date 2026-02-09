from datetime import datetime
from fastapi import APIRouter, HTTPException
from azure.cosmos.exceptions import CosmosResourceExistsError

from utils.cosmos import evaluators_container
from azure_functions.utils.audit import audit_log

router = APIRouter()


# ---------------------------------------------------------
# GET ALL EVALUATORS
# ---------------------------------------------------------
@router.get("")
def get_evaluators():
    try:
        items = list(
            evaluators_container.query_items(
                query="SELECT * FROM c ORDER BY c.created_at DESC",
                enable_cross_partition_query=True,
            )
        )
        return {"evaluators": items}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# CREATE EVALUATOR
# ---------------------------------------------------------
@router.post("")
def create_evaluator(payload: dict):
    try:
        name = payload.get("score_name")
        template = payload.get("template")
        target = payload.get("target", "trace")
        status = payload.get("status", "active")
        execution = payload.get("execution", {})

        if not name:
            raise HTTPException(400, "score_name is required")
        if not template or not template.get("id"):
            raise HTTPException(400, "template.id is required")

        evaluator_id = payload.get("id") or name.lower().replace(" ", "_")

        doc = {
            "id": evaluator_id,
            "score_name": name,
            "template": template,   # { id, name, version }
            "target": target,
            "status": status,
            "execution": execution,
            "created_at": datetime.utcnow().isoformat(),
        }

        # ✅ CREATE EVALUATOR
        evaluators_container.create_item(doc)

        # ✅ AUDIT LOG (AFTER SUCCESS)
        audit_log(
            action="Evaluator Created",
            type="evaluator",
            user="system",  # replace later with current_user.email
            details=(
                f"Created evaluator '{name}' "
                f"using template '{template.get('id')}'"
            ),
        )

        return {"status": "ok", "evaluator": doc}

    except CosmosResourceExistsError:
        raise HTTPException(
            status_code=409,
            detail="Evaluator with this name already exists",
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# UPDATE EVALUATOR STATUS (optional but common)
# ---------------------------------------------------------
@router.patch("/{evaluator_id}/status")
def update_evaluator_status(evaluator_id: str, payload: dict):
    try:
        status = payload.get("status")
        if status not in {"e", "disabled"}:
            raise HTTPException(400, "status must be enabled or disabled")

        evaluator = evaluators_container.read_item(
            item=evaluator_id,
            partition_key=evaluator_id,
        )

        evaluator["status"] = status
        evaluator["updated_at"] = datetime.utcnow().isoformat()

        evaluators_container.replace_item(evaluator_id, evaluator)

        return {"status": "ok", "evaluator": evaluator}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
