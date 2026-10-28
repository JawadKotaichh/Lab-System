from asyncio import gather
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from pymongo import UpdateOne
from pymongo.errors import PyMongoError
from ..models import lab_test_result as DBResult
from ..models import Visit, Invoice as DBInvoice
from ..schemas.schema_Invoice import invoiceData
from ..schemas.schema_Lab_Test_Result import resultListData
from ..visit_read import load_visit_context
from .deps import require_admin, require_visit_access
from .Invoice import _invoice_from_results
from .lab_test_results import build_result_list


class VisitEditorData(BaseModel):
    results: resultListData
    invoice: invoiceData


router = APIRouter(prefix="/visits", tags=["visits"], dependencies=[Depends(require_admin)])


@router.get("/{visit_id}/editor", response_model=VisitEditorData)
async def get_visit_editor(visit_id: str, db_visit: Visit = Depends(require_visit_access)):
    context, invoice = await gather(
        load_visit_context(db_visit),
        DBInvoice.find_one(DBInvoice.visit_id == db_visit.id),
    )
    if invoice is None:
        raise HTTPException(404, "Invoice not found")
    results, invoice_data = await gather(
        build_result_list(visit_id, db_visit, True, context=context),
        _invoice_from_results(
            visit_id, db_visit, invoice, preserve_snapshot=True,
            orders=context.results, db_patient=context.patient,
            db_insurance_company=context.insurance, context=context,
        ),
    )
    return VisitEditorData(results=results, invoice=invoice_data)


class ResultEdit(BaseModel):
    result_id: PydanticObjectId
    test_id: PydanticObjectId
    panel_id: PydanticObjectId | None = None
    expected: str
    value: str


class ResultBatch(BaseModel):
    updates: list[ResultEdit] = Field(min_length=1, max_length=5000)


@router.put("/{visit_id}/results")
async def save_result_batch(visit_id: str, data: ResultBatch, db_visit: Visit = Depends(require_visit_access)):
    ids = [item.result_id for item in data.updates]
    if len(set(ids)) != len(ids):
        raise HTTPException(422, "A result appears more than once in this save")
    current = await DBResult.find({"visit_id": db_visit.id, "_id": {"$in": ids}}).to_list()
    by_id = {row.id: row for row in current}
    for item in data.updates:
        row = by_id.get(item.result_id)
        if row is None or row.lab_test_type_id != item.test_id or row.lab_panel_id != item.panel_id:
            raise HTTPException(409, "A test changed or was removed. Reload the visit before saving.")
        if row.result != item.expected:
            raise HTTPException(409, "A result changed since you loaded it. Your edits are kept; reload and review before saving.")
    operations = [UpdateOne({"_id": item.result_id, "visit_id": db_visit.id,
                            "lab_test_type_id": item.test_id, "lab_panel_id": item.panel_id,
                            "result": item.expected}, {"$set": {"result": item.value}})
                  for item in data.updates]
    try:
        result = await DBResult.get_motor_collection().bulk_write(operations, ordered=True)
    except PyMongoError as error:
        raise HTTPException(503, "Could not confirm every result. Some may be saved; reload saved values before retrying.") from error
    if result.matched_count != len(operations):
        raise HTTPException(409, "Results changed during saving. Some updates may already be saved; reload and review before retrying.")
    return {"updated": result.matched_count}
