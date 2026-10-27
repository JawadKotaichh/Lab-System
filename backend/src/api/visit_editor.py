from asyncio import gather
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
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
