from fastapi import APIRouter, HTTPException, status, Query
from datetime import date, datetime, time
from typing import Optional
from ..models import Visit as DBVisit
from ..models import Patient as DBPatient
from ..models import lab_test_result as DBLab_test_result
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from ..models import lab_test_category as DBLab_test_category
from ..schemas.schema_Lab_Test_Result import Lab_test_result
from ..models import lab_panel as DBLab_panel
from ..schemas.schema_Lab_Panel import Lab_Panel
from ..schemas.schema_Visit import (
    PaginatedVisitDataList,
    Visit,
    update_visit_model,
    VisitData,
    visitInvoice,
    visitResultData,
    visitResultTest,
)
from collections import defaultdict
from beanie import PydanticObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil
from typing import Any, Dict, List
from ..schemas.schema_Patient import Patient
from ..models import lab_test_type as DBLab_test_type
from ..models import insurance_company as DBInsurance_company

router = APIRouter(prefix="/visits", tags=["visits"])


@router.get("/{visit_id}/invoice", response_model=visitInvoice)
async def get_invoice(visit_id: str):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid Visit ID")
    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(status_code=400, detail=f"Visit Id:{visit_id} not found!")

    db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=400, detail=f"Patient Id:{db_visit.patient_id} not found!"
        )
    db_list_of_lab_tests = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    if not db_list_of_lab_tests:
        raise HTTPException(
            status_code=400, detail=f"No test found for visit: {visit_id}!"
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
    visit_date = db_visit.date

    listOfTests: List[Lab_test_type] = []
    listOfPanels: List[Lab_Panel] = []
    list_of_individual_test_results: List[Lab_test_result] = []
    panel_to_list_of_tests: Dict[str, List[Lab_test_result]] = defaultdict(list)

    async for lab_result in db_list_of_lab_tests:
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
        if lab_result.lab_panel_name:
            panel_to_list_of_tests[lab_result.lab_panel_name].append(lab_result)
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
                lower_bound=db_lab_test_type.lower_bound,
                upper_bound=db_lab_test_type.upper_bound,
            )
            listOfTests.append(currentLabTest)

    totalPrice = 0.0

    for individual_test in list_of_individual_test_results:
        lab_test = await DBLab_test_type.get(
            PydanticObjectId(individual_test.lab_test_type_id)
        )
        if lab_test:
            totalPrice += lab_test.price

    for panel_name in panel_to_list_of_tests:
        db_lab_panel = await DBLab_panel.find_one(DBLab_panel.panel_name == panel_name)
        if not db_lab_panel:
            raise HTTPException(
                status_code=400, detail=f"Invalid lab panel name: {panel_name}"
            )
        lab_panel = Lab_Panel(
            nssf_id=db_lab_panel.nssf_id,
            panel_name=db_lab_panel.panel_name,
            list_of_test_type_ids=db_lab_panel.list_of_test_type_ids,
            lab_panel_price=db_lab_panel.lab_panel_price,
        )
        listOfPanels.append(lab_panel)
        totalPrice += db_lab_panel.lab_panel_price

    output = visitInvoice(
        listOfTests=listOfTests,
        listOfPanels=listOfPanels,
        patient=currentPatient,
        totalPrice=totalPrice,
        visit_date=visit_date,
        patient_insurance_company_rate=patient_insurance_company_rate,
    )
    return output


@router.get("/{visit_id}/result", response_model=visitResultData)
async def getResult(visit_id: str):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=400, detail="Invalid Visit ID")
    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(status_code=400, detail=f"Visit Id:{visit_id} not found!")

    db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=400, detail=f"Patient Id:{db_visit.patient_id} not found!"
        )
    db_list_of_lab_tests = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    if not db_list_of_lab_tests:
        raise HTTPException(
            status_code=400, detail=f"No test found for visit: {visit_id}!"
        )

    db_insurance_company = await DBInsurance_company.find_one(
        DBInsurance_company.id == db_patient.insurance_company_id
    )
    if not db_insurance_company:
        raise HTTPException(
            status_code=400,
            detail=f"Insurance Company of ID: {db_patient.insurance_company_id} not found!",
        )

    db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
    if not db_patient:
        raise HTTPException(
            status_code=400,
            detail=f"Patient of ID: {db_visit.patient_id} not found!",
        )
    currentPatient = Patient(
        insurance_company_name=db_insurance_company.insurance_company_name,
        DOB=db_patient.DOB,
        patient_id=str(db_patient.id),
        name=db_patient.name,
        gender=db_patient.gender,
        phone_number=db_patient.phone_number,
        insurance_company_id=str(db_patient.insurance_company_id),
    )
    visit_date = db_visit.date
    listOfLabTestResults: List[visitResultTest] = []

    async for lab_result in db_list_of_lab_tests:
        db_lab_test_type = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(lab_result.lab_test_type_id)
        )
        if not db_lab_test_type:
            raise HTTPException(
                status_code=400,
                detail=f"Lab test type: {lab_result.lab_test_type_id} not found!",
            )
        lab_test_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_test_type.lab_test_category_id
        )
        if not lab_test_category:
            raise HTTPException(
                status_code=400,
                detail=f"Lab test category: {db_lab_test_type.lab_test_category_id} not found!",
            )

        current_lab_test_result = visitResultTest(
            name=db_lab_test_type.name,
            result=lab_result.result,
            unit=db_lab_test_type.unit,
            lower_bound=db_lab_test_type.lower_bound,
            upper_bound=db_lab_test_type.upper_bound,
            lab_test_category_name=lab_test_category.lab_test_category_name,
            lab_panel_name=lab_result.lab_panel_name,
        )
        listOfLabTestResults.append(current_lab_test_result)
    output = visitResultData(
        patient=currentPatient,
        visit_date=visit_date,
        listOfLabTestResults=listOfLabTestResults,
    )
    return output


@router.get("/page/{page_size}/{page_number}", response_model=PaginatedVisitDataList)
async def get_visits_with_page_size(
    page_number: int,
    page_size: int,
    visit_date: Optional[str] = Query(
        None, description="Filter visits by date prefix YYYY-MM-DD"
    ),
    patient_name: Optional[str] = Query(
        None, description="Filter by patient name substring"
    ),
    insurance_company_name: Optional[str] = Query(
        None, description="Filter by insurance company name substring"
    ),
    patient_phone_number: Optional[str] = Query(
        None, description="Filter by insurance company name substring"
    ),
):
    offset = (page_number - 1) * page_size
    mongo_filter_visits: Dict[str, Any] = {}
    mongo_filter_patients: Dict[str, Any] = {}

    if patient_name:
        mongo_filter_patients["name"] = {"$regex": patient_name, "$options": "i"}
    if insurance_company_name:
        ins_coll = DBInsurance_company.get_motor_collection()
        ins_cursor = ins_coll.find(
            {
                "insurance_company_name": {
                    "$regex": insurance_company_name,
                    "$options": "i",
                }
            },
            {"_id": 1},
        )
        matching_cos = await ins_cursor.to_list(length=None)
        if not matching_cos:
            return PaginatedVisitDataList(
                visitsData=[], total_pages=0, TotalNumberOfVisits=0
            )
        co_ids = [doc["_id"] for doc in matching_cos]
        mongo_filter_patients["insurance_company_id"] = {"$in": co_ids}
    if patient_phone_number:
        mongo_filter_patients["phone_number"] = {
            "$regex": patient_phone_number,
            "$options": "i",
        }
    if mongo_filter_patients:
        pat_coll = DBPatient.get_motor_collection()
        pat_cursor = pat_coll.find(mongo_filter_patients, {"_id": 1})
        matching_patients = await pat_cursor.to_list(length=None)
        if not matching_patients:
            return PaginatedVisitDataList(
                visitsData=[], total_pages=0, TotalNumberOfVisits=0
            )
        patient_ids = [doc["_id"] for doc in matching_patients]
        mongo_filter_visits["patient_id"] = {"$in": patient_ids}

    if visit_date:
        mongo_filter_visits["date"] = {"$regex": f"^{visit_date}"}

    total_number_of_visits = await DBVisit.find(mongo_filter_visits).count()
    cursor = DBVisit.find(mongo_filter_visits).skip(offset).limit(page_size)

    visits: List[VisitData] = []
    async for visit in cursor:
        if not PydanticObjectId.is_valid(visit.id):
            raise HTTPException(status_code=400, detail=f"Invalid Visit ID: {visit.id}")
        db_visit = await DBVisit.get(PydanticObjectId(visit.id))
        if not db_visit:
            raise HTTPException(status_code=404, detail=f"Visit {visit.id} not found")

        db_patient = await DBPatient.get(PydanticObjectId(db_visit.patient_id))
        if not db_patient:
            raise HTTPException(
                status_code=404, detail=f"Patient {db_visit.patient_id} not found"
            )

        patient = Patient(
            name=db_patient.name,
            gender=db_patient.gender,
            DOB=db_patient.DOB,
            phone_number=db_patient.phone_number,
            insurance_company_id=str(db_patient.insurance_company_id),
            patient_id=str(db_patient.id),
        )
        all_test_results = DBLab_test_result.find(
            DBLab_test_result.visit_id == PydanticObjectId(visit.id)
        )
        list_of_individual_test_results: List[Lab_test_result] = []
        panel_to_list_of_tests: Dict[str, List[Lab_test_result]] = defaultdict(list)

        async for test_result in all_test_results:
            if test_result.lab_panel_name:
                panel_to_list_of_tests[test_result.lab_panel_name].append(test_result)
            else:
                list_of_individual_test_results.append(test_result)

        total_tests_results = 0
        completed_tests_results = 0
        total_price = 0.0
        for individual_test in list_of_individual_test_results:
            total_tests_results += 1
            lab_test = await DBLab_test_type.get(
                PydanticObjectId(individual_test.lab_test_type_id)
            )
            if lab_test:
                total_price += lab_test.price
            if test_result.result:
                completed_tests_results += 1

        for panel_name in panel_to_list_of_tests:
            db_lab_panel = await DBLab_panel.find_one(
                DBLab_panel.panel_name == panel_name
            )
            if not db_lab_panel:
                raise HTTPException(
                    status_code=400, detail=f"Invalid lab panel name: {panel_name}"
                )
            total_price += db_lab_panel.lab_panel_price

        insurance_company = await DBInsurance_company.get(
            db_patient.insurance_company_id
        )
        if not insurance_company:
            raise HTTPException(
                status_code=404,
                detail=f"Insurance Company {db_patient.insurance_company_id} not found",
            )
        total_price_with_insurance = total_price * insurance_company.rate

        visits.append(
            VisitData(
                total_price=total_price,
                total_price_with_insurance=total_price_with_insurance,
                patient=patient,
                visit_id=str(visit.id),
                visit_date=db_visit.date,
                completed_tests_results=completed_tests_results,
                total_tests_results=total_tests_results,
                insurance_company_name=insurance_company.insurance_company_name,
            )
        )

    total_pages = ceil(total_number_of_visits / page_size)
    return PaginatedVisitDataList(
        visitsData=visits,
        total_pages=total_pages,
        TotalNumberOfVisits=total_number_of_visits,
    )


@router.get("/all", response_model=List[Dict[str, Any]])
async def getAllVisits() -> List[Dict[str, Any]]:
    cursor = DBVisit.find()
    visits: List[Dict[str, Any]] = []
    async for visit in cursor:
        visits.append(
            {
                "visit_id": str(visit.id),
                "date": str(visit.date)[:10],
                "patient_id": str(visit.patient_id),
            }
        )
    return visits


@router.get("/{visit_id}/name")
async def get_patient_name(visit_id: PydanticObjectId):
    visit = await DBVisit.get(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    patient = await DBPatient.get(visit.patient_id)
    if patient is not None:
        return {
            "patient_id": visit.patient_id,
            "name": patient.name,
            "visit_id": visit_id,
        }
    else:
        raise HTTPException(status_code=404, detail="Patient not found")


@router.get("/", response_model=Page[DBVisit])
async def get_visits_by_date_range(
    start_date: Optional[date] = Query(
        None, description="Include visits with date >= this (YYYY-MM-DD)"
    ),
    end_date: Optional[date] = Query(
        None, description="Include visits with date <= this (YYYY-MM-DD)"
    ),
):
    query: dict = {}

    if start_date or end_date:
        if start_date:
            start_date = datetime.combine(start_date, time.min)
        if end_date:
            end_date = datetime.combine(end_date, time.max)

        date_filter: dict = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter

    cursor = DBVisit.find(query)
    return await apaginate(cursor)


@router.post(
    "/{patient_id}",
    response_model=DBVisit,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new visit",
)
async def create_visit(patient_id: PydanticObjectId, data: Visit):
    if not PydanticObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID",
        )
    if data.patient_id != str(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient ID in the visit is not the same as the one given!",
        )
    patient = await DBPatient.get(PydanticObjectId(patient_id))
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    db_visit = DBVisit(patient_id=data.patient_id, date=data.date)
    new_visit = await db_visit.insert()
    return new_visit


@router.get("/{visit_id}", response_model=VisitData)
async def get_visit(visit_id: PydanticObjectId):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    db_visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not db_visit:
        raise HTTPException(404, f"Visit {visit_id} not found")
    db_patient = await DBPatient.find_one(
        DBPatient.id == PydanticObjectId(db_visit.patient_id)
    )
    if not db_patient:
        raise HTTPException(404, f"Visit {db_visit.patient_id} not found")
    patient = Patient(
        name=db_patient.name,
        gender=db_patient.gender,
        DOB=db_patient.DOB,
        phone_number=db_patient.phone_number,
        insurance_company_id=db_patient.insurance_company_id,
        patient_id=str(db_patient.id),
    )
    all_lab_test_results = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    if not all_lab_test_results:
        raise HTTPException(
            404, f"Lab result of patient {db_visit.patient_id} not found"
        )

    total_tests_results = 0
    completed_tests_results = 0
    total_price = 0

    async for test_result in all_lab_test_results:
        total_tests_results += 1
        lab_test = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(test_result.lab_test_type_id)
        )
        if lab_test is not None:
            total_price += lab_test.price
        if test_result.result != "":
            completed_tests_results += 1
    insurance_company = await DBInsurance_company.find_one(
        DBInsurance_company.id == db_patient.insurance_company_id
    )
    if not insurance_company:
        raise HTTPException(
            404, f"Insurance Company of patient {db_patient.id} not found"
        )
    total_price_with_insurance = total_price * insurance_company.rate
    insurance_company_name = insurance_company.insurance_company_name
    visit_data = VisitData(
        total_price=total_price,
        total_price_with_insurance=total_price_with_insurance,
        patient=patient,
        visit_id=str(visit_id),
        visit_date=db_visit.date,
        completed_tests_results=completed_tests_results,
        total_tests_results=total_tests_results,
        insurance_company_name=insurance_company_name,
    )
    return visit_data


@router.get("/", response_model=Page[DBVisit])
async def get_all_visits():
    all_items = DBVisit.find()
    return await apaginate(all_items)


@router.put("/{visit_id}", response_model=DBVisit)
async def update_visit(visit_id: PydanticObjectId, update_data: update_visit_model):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    if not PydanticObjectId.is_valid(update_data.patient_id):
        raise HTTPException(400, "Invalid Visit ID")

    existing_visit = await DBVisit.find_one(DBVisit.id == PydanticObjectId(visit_id))
    if existing_visit is None:
        raise HTTPException(404, f"Visit {visit_id} not found")
    patient = await DBPatient.get(PydanticObjectId(update_data.patient_id))
    if patient is None:
        raise HTTPException(404, f"Visit {visit_id} not found")

    if update_data.patient_id is not None:
        existing_visit.patient_id = update_data.patient_id
    if update_data.date is not None:
        existing_visit.date = update_data.date

    await existing_visit.replace()

    return existing_visit


@router.delete("/{visit_id}", response_class=Response)
async def delete_visit(visit_id: PydanticObjectId):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    visit_to_be_deleted = await DBVisit.get(PydanticObjectId(visit_id))
    if not visit_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found",
        )
    await visit_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
