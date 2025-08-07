from fastapi import APIRouter, HTTPException, status

from ..schemas.schema_Lab_Test_Type import Lab_test_type
from ..models import Invoice as DBInvoice
from ..schemas.schema_Invoice import Invoice, invoiceData, update_invoice
from ..schemas.schema_Patient import Patient

# from ..schemas.schema_Lab_Test_Type import Lab_test_type
# from ..schemas.schema_Lab_Panel import Lab_Panel
# from ..schemas.schema_Lab_Test_Result import Lab_test_result
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

# from ..models import lab_test_result as DBLab_test_result
# from ..models import lab_test_type as DBLab_test_type
# from ..models import lab_test_category as DBLab_test_category
# from ..models import lab_panel as DBLab_panel

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
        visit_date=db_visit.date,
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
        raise HTTPException(404, f"Invoice with visit id: {db_visit.id} not found")

    if update_data.visit_date is not None:
        existing_invoice.visit_date = update_data.visit_date
    if update_data.list_of_tests is not None:
        existing_invoice.list_of_tests = update_data.list_of_tests
    if update_data.list_of_lab_panels is not None:
        existing_invoice.list_of_lab_panels = update_data.list_of_lab_panels
    # if update_data.total_price_with_insurance is not None:
    #     existing_invoice.total_price_with_insurance = (
    #         update_data.total_price_with_insurance
    #     )
    # if update_data.total_without_insurance is not None:
    #     existing_invoice.total_without_insurance = update_data.total_without_insurance

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
                detail=f"Lab Test Type {test.lab_test_category_id} not found",
            )
        lab_test = Lab_test_type(
            lab_test_id=str(test.id),
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=test.nssf_id,
            lab_test_category_id=str(test.lab_test_category_id),
            name=test.name,
            unit=test.unit,
            price=test.price,
            lower_bound=test.lower_bound,
            upper_bound=test.upper_bound,
        )
        list_of_lab_test.append(lab_test)
    currentInvoice = Invoice(
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


# @router.get(
#     "/{visit_id}/get_invoice",
#     response_model=DBInvoice,
# )
# async def get_invoice(visit_id: str):
#     if not PydanticObjectId.is_valid(visit_id):
#         raise HTTPException(status_code=400, detail="Invalid Visit ID")
#     db_visit = await DBVisit.get(PydanticObjectId(visit_id))
#     if not db_visit:
#         raise HTTPException(status_code=400, detail=f"Visit Id:{visit_id} not found!")

#     db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
#     if not db_patient:
#         raise HTTPException(
#             status_code=400, detail=f"Patient Id:{db_visit.patient_id} not found!"
#         )
#     db_list_of_lab_tests = DBLab_test_result.find(
#         DBLab_test_result.visit_id == PydanticObjectId(visit_id)
#     )
#     if not db_list_of_lab_tests:
#         raise HTTPException(
#             status_code=400, detail=f"No test found for visit: {visit_id}!"
#         )

#     visit_date = db_visit.date

#     listOfTests: List[Lab_test_type] = []
#     listOfPanels: List[Lab_Panel] = []
#     list_of_individual_test_results: List[Lab_test_result] = []
#     panel_to_list_of_tests: Dict[str, List[Lab_test_result]] = defaultdict(list)

#     async for lab_result in db_list_of_lab_tests:
#         db_lab_test_type = await DBLab_test_type.find_one(
#             DBLab_test_type.id == lab_result.lab_test_type_id
#         )
#         if not db_lab_test_type:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Lab test type: {lab_result.lab_test_type_id} not found!",
#             )
#         category = await DBLab_test_category.find_one(
#             DBLab_test_category.id == db_lab_test_type.lab_test_category_id
#         )
#         if not category:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Lab test category: {db_lab_test_type.lab_test_category_id} not found!",
#             )
#         if lab_result.lab_panel_name:
#             panel_to_list_of_tests[lab_result.lab_panel_name].append(lab_result)
#         else:
#             list_of_individual_test_results.append(lab_result)
#             currentLabTest = Lab_test_type(
#                 name=db_lab_test_type.name,
#                 lab_test_id=str(db_lab_test_type.id),
#                 lab_test_category_name=category.lab_test_category_name,
#                 nssf_id=db_lab_test_type.nssf_id,
#                 lab_test_category_id=str(db_lab_test_type.lab_test_category_id),
#                 unit=db_lab_test_type.unit,
#                 price=db_lab_test_type.price,
#                 lower_bound=db_lab_test_type.lower_bound,
#                 upper_bound=db_lab_test_type.upper_bound,
#             )
#             listOfTests.append(currentLabTest)

#     totalPrice = 0.0

#     for individual_test in list_of_individual_test_results:
#         lab_test = await DBLab_test_type.get(
#             PydanticObjectId(individual_test.lab_test_type_id)
#         )
#         if lab_test:
#             totalPrice += lab_test.price

#     for panel_name in panel_to_list_of_tests:
#         db_lab_panel = await DBLab_panel.find_one(DBLab_panel.panel_name == panel_name)
#         if not db_lab_panel:
#             raise HTTPException(
#                 status_code=400, detail=f"Invalid lab panel name: {panel_name}"
#             )
#         lab_panel = Lab_Panel(
#             nssf_id=db_lab_panel.nssf_id,
#             panel_name=db_lab_panel.panel_name,
#             list_of_test_type_ids=db_lab_panel.list_of_test_type_ids,
#             lab_panel_price=db_lab_panel.lab_panel_price,
#         )
#         listOfPanels.append(lab_panel)
#         totalPrice += db_lab_panel.lab_panel_price

#     db_invoice = DBInvoice(
#         visit_id=PydanticObjectId(data.visit_id),
#         list_of_tests=data.list_of_tests,
#         list_of_lab_panels=data.list_of_lab_panels,
#         issued_at_date=data.issued_at_date,
#         total_price_with_insurance=data.total_price_with_insurance,
#         total_without_insurance=data.total_without_insurance,
#     )
#     new_invoice = await db_invoice.insert()
#     if not new_invoice:
#         raise HTTPException(status_code=404, detail="invoice was not created")

#     output = Invoice(
#         list_of_tests=listOfTests,
#         list_of_lab_panels=listOfPanels,
#         total_without_insurance=totalPrice,
#         issued_at_date=visit_date,
#     )
#     return output


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
