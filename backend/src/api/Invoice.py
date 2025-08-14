from fastapi import APIRouter, HTTPException, status

from ..schemas.schema_Lab_Test_Type import Lab_test_type
from ..models import Invoice as DBInvoice
from ..schemas.schema_Invoice import Invoice, invoiceData, update_invoice
from ..schemas.schema_Patient import Patient
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from typing import List
from math import ceil
from fastapi import Query
from beanie import PydanticObjectId
from ..models import Visit as DBVisit
from ..models import Patient as DBPatient
from ..models import insurance_company as DBInsurance_company
from ..models import lab_test_category as DBlab_test_category


router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post(
    "/{visit_id}/create_empty_invoice",
    response_model=DBInvoice,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new empty invoice",
)
async def create_invoice(visit_id: str):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid Visit ID")
    db_visit = await DBVisit.find_one(DBVisit.id == PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(
            status_code=400, detail=f"Visit with id: ${visit_id} not found!"
        )
    db_invoice = DBInvoice(
        visit_id=PydanticObjectId(visit_id),
        list_of_tests=[],
        list_of_lab_panels=[],
        visit_date=db_visit.visit_date,
        discount_percentage=0.0,
        # total_price_with_insurance=0.0,
        # total_without_insurance=0.0,
    )
    new_invoice = await db_invoice.insert()
    if not new_invoice:
        raise HTTPException(status_code=404, detail="Invoice was not created")
    return new_invoice


@router.put("/{visit_id}/update_invoice", response_model=DBInvoice)
async def update_current_invoice(visit_id: str, update_data: update_invoice):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid visit ID")
    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(
            status_code=400, detail=f"Visit of Id:{visit_id} not found!"
        )
    existing_invoice = await DBInvoice.find_one(DBInvoice.visit_id == db_visit.id)

    if not existing_invoice:
        await create_invoice(visit_id=visit_id)
    existing_invoice = await DBInvoice.find_one(DBInvoice.visit_id == db_visit.id)
    if not existing_invoice:
        raise HTTPException(404, f"Invoice with visit id: {db_visit.id} not found")

    if update_data.discount_percentage is not None:
        existing_invoice.discount_percentage = update_data.discount_percentage
    if update_data.visit_date is not None:
        existing_invoice.visit_date = update_data.visit_date
    if update_data.list_of_tests is not None:
        list_of_test_types: List[Lab_test_type] = []
        for test in update_data.list_of_tests:
            db_category = await DBlab_test_category.find_one(
                DBlab_test_category.id == PydanticObjectId(test.lab_test_category_id)
            )
            if db_category is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Lab Test category {test.lab_test_category_id} not found",
                )
            lab_test = Lab_test_type(
                lab_test_id=test.lab_test_id,
                lab_test_category_name=db_category.lab_test_category_name,
                nssf_id=test.nssf_id,
                lab_test_category_id=str(test.lab_test_category_id),
                name=test.name,
                unit=test.unit,
                price=test.price,
                normal_value_list=test.normal_value_list,
            )
            list_of_test_types.append(lab_test)
        existing_invoice.list_of_tests = list_of_test_types

    if update_data.list_of_lab_panels is not None:
        existing_invoice.list_of_lab_panels = update_data.list_of_lab_panels
    await existing_invoice.replace()

    return existing_invoice


@router.get("/{visit_id}/fetch_invoice", response_model=invoiceData)
async def get_invoice(visit_id: str):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid visit ID")
    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(
            status_code=400, detail=f"Visit of Id:{visit_id} not found!"
        )
    db_invoice = await DBInvoice.find_one(DBInvoice.visit_id == db_visit.id)
    if not db_invoice:
        raise HTTPException(
            status_code=400, detail=f"Invoice with visit id:{db_visit.id} not found!"
        )
    db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=400,
            detail=f"Patient of ID: {db_visit.patient_id} not found!",
        )

    db_insurance_company = await DBInsurance_company.find_one(
        DBInsurance_company.id == db_patient.insurance_company_id
    )
    if not db_insurance_company:
        raise HTTPException(
            status_code=400,
            detail=f"Insurance Company of ID: {db_patient.insurance_company_id} not found!",
        )
    patient_insurance_company_rate = db_insurance_company.rate
    currentPatient = Patient(
        insurance_company_name=db_insurance_company.insurance_company_name,
        DOB=db_patient.DOB,
        patient_id=str(db_patient.id),
        name=db_patient.name,
        gender=db_patient.gender,
        phone_number=db_patient.phone_number,
        insurance_company_id=str(db_patient.insurance_company_id),
    )
    list_of_lab_test: List[Lab_test_type] = []
    for test in db_invoice.list_of_tests:
        db_category = await DBlab_test_category.find_one(
            DBlab_test_category.id == test.lab_test_category_id
        )
        if db_category is None:
            raise HTTPException(
                status_code=404,
                detail=f"Lab Test Category with id: {test.lab_test_category_id} not found",
            )
        lab_test = Lab_test_type(
            lab_test_id=str(test.id),
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=test.nssf_id,
            lab_test_category_id=str(test.lab_test_category_id),
            name=test.name,
            unit=test.unit,
            price=test.price,
            normal_value_list=test.normal_value_list,
        )
        list_of_lab_test.append(lab_test)
    currentInvoice = Invoice(
        discount_percentage=db_invoice.discount_percentage,
        visit_id=str(db_invoice.visit_id),
        list_of_tests=list_of_lab_test,
        list_of_lab_panels=db_invoice.list_of_lab_panels,
        visit_date=db_invoice.visit_date,
        patient_insurance_company_rate=patient_insurance_company_rate,
        # total_price_with_insurance=db_invoice.total_price_with_insurance,
        # total_without_insurance=db_invoice.total_without_insurance,
    )
    output_invoice_data = invoiceData(
        patient=currentPatient,
        invoice_data=currentInvoice,
    )
    return output_invoice_data


@router.get("/page/{page_size}/{page_number}", response_model=List[Invoice])
async def get_invoices_with_page_size(
    page_number: int,
    page_size: int,
    insurance_company_name: str | None = Query(None),
    rate: float | None = Query(None),
):
    offset = (page_number - 1) * page_size
    # mongo_filter: dict[str, Any] = {}
    # if insurance_company_name:
    #     mongo_filter["insurance_company_name"] = {
    #         "$regex": insurance_company_name,
    #         "$options": "i",
    #     }

    # if rate:
    #     expr = {
    #         "$expr": {
    #             "$regexMatch": {
    #                 "input": {"$toString": "$price"},
    #                 "regex": str(rate),
    #             }
    #         }
    #     }
    #     mongo_filter = {"$and": [mongo_filter, expr]}
    # total_number_of_insurance_companies = await DBInvoice.find(mongo_filter).count()

    total_number_of_invoices = await DBInvoice.find().count()
    cursor = DBInvoice.find().skip(offset).limit(page_size)
    allInvoices: List[Invoice] = []
    async for invoice in cursor:
        db_visit = await DBVisit.find_one(DBVisit.id == invoice.visit_id)
        if not db_visit:
            raise HTTPException(
                status_code=400,
                detail=f"Visit of ID: {invoice.visit_id} not found!",
            )
        db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
        if not db_patient:
            raise HTTPException(
                status_code=400,
                detail=f"Patient of ID: {db_visit.patient_id} not found!",
            )

        db_insurance_company = await DBInsurance_company.find_one(
            DBInsurance_company.id == db_patient.insurance_company_id
        )
        if not db_insurance_company:
            raise HTTPException(
                status_code=400,
                detail=f"Insurance Company of ID: {db_patient.insurance_company_id} not found!",
            )
        patient_insurance_company_rate = db_insurance_company.rate
        currentInvoice = Invoice(
            discount_percentage=invoice.discount_percentage,
            list_of_lab_panels=invoice.list_of_lab_panels,
            list_of_tests=invoice.list_of_tests,
            visit_id=invoice.visit_id,
            visit_date=invoice.visit_date,
            patient_insurance_company_rate=patient_insurance_company_rate,
            # total_price_with_insurance=invoice.total_price_with_insurance,
            # total_without_insurance=invoice.total_without_insurance,
        )
        allInvoices.append(currentInvoice)

    total_pages = ceil(total_number_of_invoices / page_size)
    result = {
        "TotalNumberOfInvoices": total_number_of_invoices,
        "total_pages": total_pages,
        "invoices": allInvoices,
    }
    return result


@router.get("/", response_model=Page[DBInvoice])
async def get_all_invoices():
    all_items = DBInvoice.find()
    return await apaginate(all_items)


@router.delete("/{invoice_id}", response_class=Response)
async def delete_invoice(invoice_id: str):
    if not PydanticObjectId.is_valid(invoice_id):
        raise HTTPException(400, "Invalid invoice ID")
    invoice_to_be_deleted = await DBInvoice.find_one(
        DBInvoice.id == PydanticObjectId(invoice_id)
    )
    if invoice_to_be_deleted is None:
        raise HTTPException(404, f"insurance_company {invoice_id} not found")
    await invoice_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
