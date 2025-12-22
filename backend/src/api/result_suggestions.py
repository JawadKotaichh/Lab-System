import re
from typing import Any, Dict, List, Optional
from beanie import SortDirection
from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from ..models import Result_suggestions as DBResult_suggestions
from ..schemas.schema_result_suggestions import (
    Result_suggestions,
    update_result_suggestions,
)

router = APIRouter(prefix="/result_suggestions", tags=["result_suggestions"])


def normalize(s: str) -> str:
    return " ".join(s.strip().lower().split())


@router.get("/by_test/{lab_test_type_id}", response_model=List[Result_suggestions])
async def get_result_suggestions(
    lab_test_type_id: str,
    prefix: Optional[str] = Query(None),
) -> List[Result_suggestions]:
    mongo_filter: Dict[str, Any] = {"lab_test_type_id": lab_test_type_id}

    if prefix:
        normalized_prefix = normalize(prefix)
        mongo_filter["value"] = {"$regex": f"^{re.escape(normalized_prefix)}"}

    cursor = (
        DBResult_suggestions.find(mongo_filter)
        .sort([("use_count", SortDirection.DESCENDING)])
        .limit(10)
    )

    result_suggestions: List[Result_suggestions] = []
    async for r in cursor:
        current_result_suggestion = Result_suggestions(
            lab_test_type_id=str(r.lab_test_type_id),
            value=r.value,
            use_count=r.use_count,
        )
        result_suggestions.append(current_result_suggestion)

    return result_suggestions


@router.post(
    "/use/{lab_test_type_id}",
    status_code=status.HTTP_200_OK,
    summary="Increment suggestion use_count (create if new)",
)
async def use_result_suggestion(
    lab_test_type_id: str = Query(...),
    value: str = Query(...),
) -> Dict[str, Any]:
    n = normalize(value)
    existing = await DBResult_suggestions.find_one(
        DBResult_suggestions.lab_test_type_id == lab_test_type_id,
        DBResult_suggestions.value == n,
    )

    if existing:
        existing.use_count = (existing.use_count or 0) + 1
        await existing.replace()
        return existing

    doci = DBResult_suggestions(
        lab_test_type_id=lab_test_type_id,
        value=n,
        use_count=1,
    )

    doc = await doci.insert()
    if not doc:
        raise HTTPException(status_code=404, detail="result_suggestion was not created")
    return doc


@router.post(
    "/",
    response_model=DBResult_suggestions,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new result_suggestion (manual)",
)
async def create_result_suggestion(data: Result_suggestions) -> DBResult_suggestions:
    normalized_value = normalize(data.value)

    db_result_suggestion = DBResult_suggestions(
        lab_test_type_id=data.lab_test_type_id,
        value=normalized_value,
        use_count=data.use_count if data.use_count is not None else 0,
    )

    try:
        new_result_suggestion = await db_result_suggestion.insert()
    except Exception as e:
        raise HTTPException(
            status_code=409, detail="Result suggestion already exists"
        ) from e

    return new_result_suggestion


@router.get("/{result_suggestion_id}", response_model=Dict[str, Any])
async def get_result_suggestion(result_suggestion_id: str) -> Dict[str, Any]:
    if not PydanticObjectId.is_valid(result_suggestion_id):
        raise HTTPException(400, "Invalid result_suggestion ID")

    result_suggestion = await DBResult_suggestions.get(
        PydanticObjectId(result_suggestion_id)
    )
    if not result_suggestion:
        raise HTTPException(404, f"result_suggestion {result_suggestion_id} not found")

    return {
        "result_suggestion_id": str(result_suggestion.id),
        "lab_test_type_id": str(result_suggestion.lab_test_type_id),
        "value": result_suggestion.value,
        "use_count": result_suggestion.use_count,
    }


@router.put("/{result_suggestion_id}", response_model=DBResult_suggestions)
async def update_result_suggestion(
    result_suggestion_id: str,
    update_data: update_result_suggestions,
) -> DBResult_suggestions:
    if not PydanticObjectId.is_valid(result_suggestion_id):
        raise HTTPException(400, "Invalid result_suggestion ID")

    existing = await DBResult_suggestions.get(PydanticObjectId(result_suggestion_id))
    if not existing:
        raise HTTPException(404, f"result_suggestion {result_suggestion_id} not found")

    if update_data.value is not None:
        existing.value = normalize(update_data.value)
    if update_data.use_count is not None:
        existing.use_count = update_data.use_count

    await existing.replace()
    return existing


@router.delete("/{result_suggestion_id}", response_class=Response)
async def delete_result_suggestion(result_suggestion_id: str) -> Response:
    if not PydanticObjectId.is_valid(result_suggestion_id):
        raise HTTPException(400, "Invalid result_suggestion ID")

    existing = await DBResult_suggestions.get(PydanticObjectId(result_suggestion_id))
    if not existing:
        raise HTTPException(404, f"result_suggestion {result_suggestion_id} not found")

    await existing.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
