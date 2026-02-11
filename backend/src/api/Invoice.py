from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from ..models import Invoice as DBInvoice
from ..models import Financial_transaction as DBFinancial_transaction
from ..schemas.schema_Invoice import (
    Invoice,
    LabTestChanged,
    invoiceData,
    update_invoice,
)
from pymongo import ReturnDocument
from ..schemas.schema_Patient import Patient
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from typing import Dict, List
from math import ceil
from fastapi import Query
from beanie import PydanticObjectId
from ..models import Visit as DBVisit
from ..models import Patient as DBPatient
from ..models import insurance_company as DBInsurance_company
from ..models import lab_test_category as DBlab_test_category
from ..models import lab_test_result as DBLab_test_result
from ..models import lab_panel as DBLab_panel
from ..schemas.schema_Lab_Panel import LabPanelResponse
from ..schemas.schema_Lab_Test_Result import Lab_test_result
from ..models import lab_test_category as DBLab_test_category
from ..models import lab_test_type as DBLab_test_type


async def get_next_sequence(name: str) -> int:
    db = DBInvoice.get_motor_collection().database
    counter = await db["counters"].find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        return_document=ReturnDocument.AFTER,
        upsert=True,
    )
    return counter["seq"]


router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.get(
    "/{insurance_company_id}/get_monthly_summary", response_model=List[invoiceData]
)
async def get_monthly_summary_invoice(
    insurance_company_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
):
    if not PydanticObjectId.is_valid(insurance_company_id):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid insurance company ID: {insurance_company_id}",
        )
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    filters = {
        "insurance_company_id": PydanticObjectId(insurance_company_id),
        "visit_date": {"$gte": start_date, "$lte": end_date},
    }
    all_invoices = DBInvoice.find(filters)
    print(all_invoices)
    listOfInvoices: List[invoiceData] = []
    async for invoice in all_invoices:
        print("\n current invoice is: ", invoice)
        db_visit = await DBVisit.get(invoice.visit_id)
        if not db_visit:
            raise HTTPException(
                status_code=400, detail=f"Visit Id:{invoice.visit_id} not found!"
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
        list_of_test_types: List[Lab_test_type] = []
        for test in invoice.list_of_tests:
            db_category = await DBlab_test_category.find_one(
                DBlab_test_category.id == PydanticObjectId(test.lab_test_category_id)
            )
            if db_category is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Lab Test category {test.lab_test_category_id} not found",
                )
            lab_test = Lab_test_type(
                lab_test_id=str(test.lab_test_id),
                lab_test_category_name=db_category.lab_test_category_name,
                nssf_id=test.nssf_id,
                lab_test_category_id=str(test.lab_test_category_id),
                name=test.name,
                unit=test.unit,
                price=test.price,
                normal_value_list=test.normal_value_list,
            )
            list_of_test_types.append(lab_test)
        current_invoice = Invoice(
            adjustment_minor=invoice.adjustment_minor,
            insurance_company_id=str(invoice.insurance_company_id),
            list_of_tests=list_of_test_types,
            list_of_lab_panels=invoice.list_of_lab_panels,
            visit_date=invoice.visit_date,
            patient_insurance_company_rate=patient_insurance_company_rate,
            visit_id=str(db_visit.id),
            invoice_number=invoice.invoice_number,
            total_paid=invoice.total_paid,
            list_of_lab_tests_ids_changed=invoice.list_of_lab_tests_ids_changed,
            list_of_lab_panels_ids_changed=invoice.list_of_lab_panels_ids_changed,
        )
        current_invoice_data = invoiceData(
            patient=currentPatient,
            invoice_data=current_invoice,
            currency=db_insurance_company.currency,
        )
        listOfInvoices.append(current_invoice_data)
    return listOfInvoices


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
        raise HTTPException(404, f"Invoice with visit id: {db_visit.id} not found")
    if update_data.list_of_lab_tests_ids_changed is not None:
        existing_invoice.list_of_lab_tests_ids_changed = (
            update_data.list_of_lab_tests_ids_changed
        )
    if update_data.list_of_lab_panels_ids_changed is not None:
        existing_invoice.list_of_lab_panels_ids_changed = (
            update_data.list_of_lab_panels_ids_changed
        )

    if update_data.adjustment_minor is not None:
        existing_invoice.adjustment_minor = update_data.adjustment_minor
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
    if update_data.insurance_company_id is not None:
        existing_invoice.insurance_company_id = update_data.insurance_company_id
    if update_data.total_paid is not None:
        existing_invoice.total_paid = update_data.total_paid

        existing_financial_transacion = await DBFinancial_transaction.find_one(
            DBFinancial_transaction.visit_id == PydanticObjectId(visit_id)
        )
        if existing_financial_transacion is not None:
            existing_financial_transacion.amount = update_data.total_paid
            await existing_financial_transacion.replace()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"No financial_transacion found for visit with id: {visit_id}!",
            )
    db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
    if db_patient is None:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with visit id: {db_visit.id} not found",
        )

    db_insurance_company = await DBInsurance_company.find_one(
        DBInsurance_company.id == db_patient.insurance_company_id
    )
    if db_insurance_company is None:
        raise HTTPException(
            status_code=404,
            detail=f"Insurance company with id: {db_patient.insurance_company_id} not found",
        )
    changed_lab_tests = {}
    for changed_test in existing_invoice.list_of_lab_tests_ids_changed:
        changed_lab_tests[str(changed_test.lab_test_id)] = changed_test.new_price

    changed_lab_panels = {}
    for changed_panel in existing_invoice.list_of_lab_panels_ids_changed:
        changed_lab_panels[str(changed_panel.panel_id)] = changed_panel.new_price

    total_price = 0.0
    insurance_rate = db_insurance_company.rate
    for test in existing_invoice.list_of_tests:
        test_id = str(test.lab_test_id)
        if test_id in changed_lab_tests:
            total_price += changed_lab_tests[test_id]
        else:
            total_price += test.price * insurance_rate

    for panel in existing_invoice.list_of_lab_panels:
        panel_id = str(panel.id)
        if panel_id in changed_lab_panels:
            total_price += changed_lab_panels[panel_id]
        else:
            total_price += (panel.lab_panel_price or 0) * insurance_rate

    total_price += existing_invoice.adjustment_minor
    if existing_invoice.total_paid >= total_price:
        db_visit.posted = True
        await db_visit.replace()
    await existing_invoice.replace()

    return existing_invoice


@router.put("/{visit_id}/override_test_price", response_model=DBInvoice)
async def override_test_price(visit_id: str, body: LabTestChanged):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid visit ID")
    if not PydanticObjectId.is_valid(body.lab_test_id):
        raise HTTPException(status_code=400, detail="Invalid lab_test_id")

    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    invoice = await DBInvoice.find_one(DBInvoice.visit_id == db_visit.id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    found = False
    for i, item in enumerate(invoice.list_of_lab_tests_ids_changed):
        if str(item.lab_test_id) == str(body.lab_test_id):
            invoice.list_of_lab_tests_ids_changed[i].new_price = body.new_price
            found = True
            break
    if not found:
        invoice.list_of_lab_tests_ids_changed.append(
            type(invoice.list_of_lab_tests_ids_changed[0])(
                lab_test_id=body.lab_test_id, new_price=body.new_price
            )
            if invoice.list_of_lab_tests_ids_changed
            else {"lab_test_id": body.lab_test_id, "new_price": body.new_price}
        )

    await invoice.replace()
    return invoice


@router.get("/{visit_id}/rebuild_invoice", response_model=invoiceData)
async def rebuild_invoice(visit_id: str):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid Visit ID")
    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(status_code=400, detail=f"Visit Id:{visit_id} not found!")

    db_list_of_lab_tests_results = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    if not db_list_of_lab_tests_results:
        raise HTTPException(
            status_code=400,
            detail=f"No test result found for visit with id: {visit_id}!",
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
    visit_date = db_visit.visit_date

    listOfTests: List[Lab_test_type] = []
    listOfPanels: List[LabPanelResponse] = []
    list_of_individual_test_results: List[Lab_test_result] = []
    panel_to_list_of_tests: Dict[str, List[Lab_test_result]] = defaultdict(list)

    async for lab_result in db_list_of_lab_tests_results:
        db_lab_test_type = await DBLab_test_type.find_one(
            DBLab_test_type.id == lab_result.lab_test_type_id
        )
        if not db_lab_test_type:
            raise HTTPException(
                status_code=400,
                detail=f"Lab test type: {lab_result.lab_test_type_id} not found!",
            )
        category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_test_type.lab_test_category_id
        )
        if not category:
            raise HTTPException(
                status_code=400,
                detail=f"Lab test category: {db_lab_test_type.lab_test_category_id} not found!",
            )
        if lab_result.lab_panel_id:
            panel_to_list_of_tests[lab_result.lab_panel_id].append(lab_result)
        else:
            list_of_individual_test_results.append(lab_result)
            currentLabTest = Lab_test_type(
                name=db_lab_test_type.name,
                lab_test_id=str(db_lab_test_type.id),
                lab_test_category_name=category.lab_test_category_name,
                nssf_id=db_lab_test_type.nssf_id,
                lab_test_category_id=str(db_lab_test_type.lab_test_category_id),
                unit=db_lab_test_type.unit,
                price=db_lab_test_type.price,
                normal_value_list=db_lab_test_type.normal_value_list,
            )
            listOfTests.append(currentLabTest)

    lab_tests: List[Lab_test_type] = []
    for panel_id in panel_to_list_of_tests:
        current_list_of_lab_results: List[Lab_test_result] = panel_to_list_of_tests[
            panel_id
        ]
        for lab_result in current_list_of_lab_results:
            db_lab_test_type = await DBLab_test_type.find_one(
                DBLab_test_type.id == lab_result.lab_test_type_id
            )
            if not db_lab_test_type:
                raise HTTPException(
                    status_code=400,
                    detail=f"Lab test type: {lab_result.lab_test_type_id} not found!",
                )
            category = await DBLab_test_category.find_one(
                DBLab_test_category.id == db_lab_test_type.lab_test_category_id
            )
            if not category:
                raise HTTPException(
                    status_code=400,
                    detail=f"Lab test category: {db_lab_test_type.lab_test_category_id} not found!",
                )
            currentLabTest = Lab_test_type(
                name=db_lab_test_type.name,
                lab_test_id=str(db_lab_test_type.id),
                lab_test_category_name=category.lab_test_category_name,
                nssf_id=db_lab_test_type.nssf_id,
                lab_test_category_id=str(db_lab_test_type.lab_test_category_id),
                unit=db_lab_test_type.unit,
                price=db_lab_test_type.price,
                normal_value_list=db_lab_test_type.normal_value_list,
            )
            lab_tests.append(currentLabTest)

        db_lab_panel = await DBLab_panel.find_one(DBLab_panel.id == panel_id)
        if not db_lab_panel:
            raise HTTPException(
                status_code=400, detail=f"Invalid lab panel id: {panel_id}"
            )

        lab_panel = LabPanelResponse(
            id=str(db_lab_panel.id),
            nssf_id=db_lab_panel.nssf_id,
            panel_name=db_lab_panel.panel_name,
            lab_tests=lab_tests,
            lab_panel_price=db_lab_panel.lab_panel_price,
            lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
        )
        listOfPanels.append(lab_panel)
        # totalPrice += db_lab_panel.lab_panel_price

    db_invoice = await DBInvoice.find_one(
        DBInvoice.visit_id == PydanticObjectId(visit_id)
    )
    if not db_invoice:
        raise HTTPException(
            status_code=400, detail=f"Invoice with visit id: {visit_id} not found"
        )
    current_invoice_data = Invoice(
        insurance_company_id=str(db_patient.insurance_company_id),
        list_of_tests=listOfTests,
        list_of_lab_panels=listOfPanels,
        visit_id=visit_id,
        visit_date=visit_date,
        patient_insurance_company_rate=patient_insurance_company_rate,
        adjustment_minor=db_invoice.adjustment_minor,
        invoice_number=db_invoice.invoice_number,
        total_paid=db_invoice.total_paid,
        list_of_lab_panels_ids_changed=db_invoice.list_of_lab_panels_ids_changed,
        list_of_lab_tests_ids_changed=db_invoice.list_of_lab_tests_ids_changed,
    )

    db_invoice.list_of_lab_panels = listOfPanels
    db_invoice.list_of_tests = listOfTests

    await db_invoice.replace()
    output = invoiceData(
        patient=currentPatient,
        invoice_data=current_invoice_data,
        currency=db_insurance_company.currency,
    )
    return output


@router.post(
    "/{visit_id}/create_empty_invoice",
    response_model=DBInvoice,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new empty invoice",
)
async def create_invoice(visit_id: str, patient: Patient):
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
        adjustment_minor=0.0,
        insurance_company_id=patient.insurance_company_id,
        invoice_number=await get_next_sequence("invoice_number"),
        list_of_lab_panels_ids_changed=[],
        list_of_lab_tests_ids_changed=[],
    )
    new_invoice = await db_invoice.insert()
    if not new_invoice:
        raise HTTPException(status_code=404, detail="Invoice was not created")
    # db_insurance_company = await DBInsurance_company.find_one(
    #     DBInsurance_company.id == PydanticObjectId(patient.insurance_company_id)
    # )
    # if not db_insurance_company:
    #     raise HTTPException(
    #         status_code=400,
    #         detail=f"Insurance Company of ID: {patient.insurance_company_id} not found!",
    #     )

    # db_financial_transacion = DBFinancial_transaction(
    #     type="Income",
    #     currency=db_insurance_company.currency,
    #     date=db_visit.visit_date,
    #     amount=0.0,
    #     description=f"Paid by: {patient.name}",
    #     category="Visit By System",
    #     visit_id=PydanticObjectId(visit_id),
    # )
    # new_financial_transaction = await db_financial_transacion.insert()
    # if not new_financial_transaction:
    #     raise HTTPException(
    #         status_code=404, detail="Financial Transation was not created"
    #     )
    return new_invoice


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
            lab_test_id=str(test.lab_test_id),
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
        adjustment_minor=db_invoice.adjustment_minor,
        visit_id=str(db_invoice.visit_id),
        list_of_tests=list_of_lab_test,
        list_of_lab_panels=db_invoice.list_of_lab_panels,
        visit_date=db_invoice.visit_date,
        patient_insurance_company_rate=patient_insurance_company_rate,
        insurance_company_id=str(db_patient.insurance_company_id),
        invoice_number=db_invoice.invoice_number,
        total_paid=db_invoice.total_paid,
        list_of_lab_tests_ids_changed=db_invoice.list_of_lab_tests_ids_changed,
        list_of_lab_panels_ids_changed=db_invoice.list_of_lab_panels_ids_changed,
    )
    output_invoice_data = invoiceData(
        patient=currentPatient,
        invoice_data=currentInvoice,
        currency=db_insurance_company.currency,
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
            adjustment_minor=invoice.adjustment_minor,
            list_of_lab_panels=invoice.list_of_lab_panels,
            list_of_tests=invoice.list_of_tests,
            visit_id=invoice.visit_id,
            visit_date=invoice.visit_date,
            insurance_company_id=str(db_patient.insurance_company_id),
            patient_insurance_company_rate=patient_insurance_company_rate,
            invoice_number=invoice.invoice_number,
            total_paid=invoice.total_paid,
            list_of_lab_panels_ids_changed=invoice.list_of_lab_panels_ids_changed,
            list_of_lab_tests_ids_changed=invoice.list_of_lab_panels_ids_changed,
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
