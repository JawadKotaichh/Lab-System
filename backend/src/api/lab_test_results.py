from collections import defaultdict
from math import ceil
from fastapi import APIRouter, HTTPException, status

from ..schemas.schema_Patient import Patient
from ..models import lab_test_result as DBLab_test_result
from ..models import Visit as DBVisit
from ..models import lab_test_type as DBLab_test_type
from ..models import Patient as DBPatient
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from ..models import insurance_company as DBInsurance_company
from ..models import lab_test_category as DBLab_test_category
from ..models import lab_panel as DBLab_panel
from ..schemas.schema_Lab_Test_Result import (
    Lab_test_result,
    paginatedMixedVisitResults,
    patientPanelResult,
    patientTestResult,
    resultListData,
    update_lab_test_result_model,
)
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from typing import Any, Dict, List
from beanie import PydanticObjectId

router = APIRouter(
    prefix="/lab_tests_results",
    tags=["lab_tests_results"],
)


@router.post(
    "/{visit_id}/{lab_panel_id}",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab test result panel for a patient in a visit",
)
async def create_lab_panel_result(visit_id: str, lab_panel_id: str):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid visit ID",
        )
    db_lab_panel = await DBLab_panel.find_one(
        DBLab_panel.id == PydanticObjectId(lab_panel_id)
    )
    if not db_lab_panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab Test Panel id {lab_panel_id} not found",
        )

    list_of_test_type_ids = db_lab_panel.list_of_test_type_ids
    test_ids_pydantic = [
        PydanticObjectId(t) for t in db_lab_panel.list_of_test_type_ids
    ]

    existing = await DBLab_test_result.find(
        {
            "visit_id": PydanticObjectId(visit_id),
            "lab_test_type_id": {"$in": test_ids_pydantic},
        }
    ).to_list()

    if existing:
        dup_ids = {str(r.lab_test_type_id) for r in existing}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Some of these tests are already recorded for visit {visit_id}: {', '.join(dup_ids)}",
        )

    for test_id in list_of_test_type_ids:
        if not PydanticObjectId.is_valid(test_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid lab test type ID",
            )
        db_lab_test_result = DBLab_test_result(
            lab_panel_id=db_lab_panel.id,
            lab_test_type_id=PydanticObjectId(test_id),
            visit_id=PydanticObjectId(visit_id),
            result="",
        )
        new_lab_test_result = await db_lab_test_result.insert()
        if not new_lab_test_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error Creation Lab test Results for lab test id {test_id} for lab panel {lab_panel_id}",
            )


@router.post(
    "/{visit_id}",
    response_model=DBLab_test_result,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab test result for a patient in a visit",
)
async def create_lab_test_result(visit_id: str, data: Lab_test_result):
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid visit ID",
        )

    visit = await DBVisit.get(PydanticObjectId(visit_id))
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit {visit_id} not found",
        )
    if not PydanticObjectId.is_valid(data.lab_test_type_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab test type {data.lab_test_type_id} not found",
        )
    test = await DBLab_test_type.get(PydanticObjectId(data.lab_test_type_id))
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test type {data.lab_test_type_id} not found",
        )
    visit_corresponds_to_patient = DBVisit.find(DBVisit.id == visit_id)
    if not visit_corresponds_to_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit {visit_id} is not found",
        )
    db_lab_test_result = DBLab_test_result(
        lab_test_type_id=PydanticObjectId(data.lab_test_type_id),
        visit_id=PydanticObjectId(visit_id),
        result=data.result,
        lab_panel_id=None,
    )
    new_lab_test_result = await db_lab_test_result.insert()
    return new_lab_test_result


@router.get("/completed/{visit_id}", response_model=Dict[str, Any])
async def get_completed_and_total_results(visit_id: str):
    mongo_filter_lab_test_results: dict[str, Any] = {}
    if visit_id:
        mongo_filter_lab_test_results["visit_id"] = PydanticObjectId(visit_id)
    all_items = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    total_number_of_lab_test_results = await DBLab_test_result.find(
        mongo_filter_lab_test_results
    ).count()
    completed = 0
    totalPrice = 0.0
    visit = await DBVisit.find_one(DBVisit.id == PydanticObjectId(visit_id))
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit {visit_id} not found",
        )
    patient = await DBPatient.find_one(
        DBPatient.id == PydanticObjectId(visit.patient_id)
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {visit.patient_id} not found",
        )
    insurance_company = await DBInsurance_company.find_one(
        DBInsurance_company.id == patient.insurance_company_id
    )
    if not insurance_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insurance Company {patient.insurance_company_id} not found",
        )
    async for item in all_items:
        lab_test = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(item.lab_test_type_id)
        )
        if lab_test is not None:
            totalPrice += lab_test.price
        if item.result != "":
            completed += 1
    FinalTotalPrice = totalPrice * (insurance_company.rate)
    output: Dict[str, Any] = {
        "visit_id": str(visit_id),
        "countOfCompletedResults": completed,
        "totalNumberOfTests": total_number_of_lab_test_results,
        "totalPrice": round(FinalTotalPrice, 2),
    }
    return output


@router.get(
    "/{visit_id}/get_result_list",
    response_model=resultListData,
)
async def get_result_list(
    visit_id: str,
):
    visit_oid = PydanticObjectId(visit_id)

    db_visit = await DBVisit.find_one(DBVisit.id == visit_oid)
    if not db_visit:
        raise HTTPException(400, detail=f"Invalid visit ID: {visit_id}")

    db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
    if not db_patient:
        raise HTTPException(400, detail=f"Patient not found: {db_visit.patient_id}")

    current_results = await DBLab_test_result.find(
        DBLab_test_result.visit_id == visit_oid
    ).to_list()

    current_test_type_ids = {res.lab_test_type_id for res in current_results}

    prev_results_map = {}
    if current_test_type_ids:
        pipeline = [
            {
                "$match": {
                    "lab_test_type_id": {"$in": list(current_test_type_ids)},
                    "visit_id": {"$ne": visit_oid},
                }
            },
            {
                "$lookup": {
                    "from": "visits",
                    "localField": "visit_id",
                    "foreignField": "_id",
                    "as": "visit",
                }
            },
            {"$unwind": "$visit"},
            {
                "$match": {
                    "visit.patient_id": db_patient.id,
                    "visit.visit_date": {"$lt": db_visit.visit_date},
                }
            },
            {"$sort": {"visit.visit_date": -1}},
            {
                "$group": {
                    "_id": "$lab_test_type_id",
                    "prev_result": {"$first": "$result"},
                    "prev_date": {"$first": "$visit.visit_date"},
                }
            },
        ]

        async for doc in DBLab_test_result.aggregate(pipeline):
            prev_results_map[doc["_id"]] = {
                "result": doc["prev_result"],
                "date": doc["prev_date"],
            }

    list_of_standalone_test_results = []
    panels_to_list_of_tests = defaultdict(list)

    for test_result in current_results:
        if not test_result.result or not test_result.result.strip():
            continue

        db_lab_test_type = await DBLab_test_type.find_one(
            DBLab_test_type.id == test_result.lab_test_type_id
        )
        if not db_lab_test_type:
            raise HTTPException(
                400, detail=f"Invalid lab test type ID {test_result.lab_test_type_id}"
            )
        lab_test_type_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_test_type.lab_test_category_id
        )
        if not lab_test_type_category:
            raise HTTPException(
                400,
                detail=f"Invalid lab test category ID {db_lab_test_type.lab_test_category_id}",
            )
        prev_data = prev_results_map.get(test_result.lab_test_type_id) or {
            "result": None,
            "date": None,
        }

        lab_test_type = Lab_test_type(
            lab_test_id=str(db_lab_test_type.id),
            name=db_lab_test_type.name,
            nssf_id=db_lab_test_type.nssf_id,
            lab_test_category_id=str(db_lab_test_type.lab_test_category_id),
            unit=db_lab_test_type.unit,
            normal_value_list=db_lab_test_type.normal_value_list,
            price=db_lab_test_type.price,
            lab_test_category_name=lab_test_type_category.lab_test_category_name,
        )

        current_test_result = patientTestResult(
            lab_test_result_id=str(test_result.id),
            lab_test_type=lab_test_type,
            lab_test_type_id=str(db_lab_test_type.id),
            result=test_result.result,
            prev_result=prev_data.get("result"),
            prev_date=prev_data.get("date"),
        )

        if test_result.lab_panel_id:
            panels_to_list_of_tests[test_result.lab_panel_id].append(
                current_test_result
            )
        else:
            list_of_standalone_test_results.append(current_test_result)

    list_of_panel_results = []
    for panel_id, test_results in panels_to_list_of_tests.items():
        db_lab_panel = await DBLab_panel.find_one(DBLab_panel.id == panel_id)
        if not db_lab_panel:
            raise HTTPException(404, detail=f"Panel not found: {panel_id}")

        db_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_panel.lab_panel_category_id
        )
        if not db_category:
            raise HTTPException(404, detail="Panel category not found")

        list_of_panel_results.append(
            patientPanelResult(
                lab_panel_price=db_lab_panel.lab_panel_price,
                lab_panel_id=str(db_lab_panel.id),
                lab_panel_name=db_lab_panel.panel_name,
                list_of_test_results=test_results,
                lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
                lab_panel_category_name=db_category.lab_test_category_name,
            )
        )

    db_insurance_company = await DBInsurance_company.find_one(
        DBInsurance_company.id == db_patient.insurance_company_id
    )
    insurance_name = (
        db_insurance_company.insurance_company_name if db_insurance_company else ""
    )

    patient = Patient(
        patient_id=str(db_patient.id),
        name=db_patient.name,
        gender=db_patient.gender,
        phone_number=db_patient.phone_number,
        insurance_company_id=str(db_patient.insurance_company_id),
        insurance_company_name=insurance_name,
        DOB=db_patient.DOB,
    )
    return resultListData(
        report_date=db_visit.report_date,
        visit_date=db_visit.visit_date,
        patient=patient,
        visit_id=visit_id,
        list_of_standalone_test_results=list_of_standalone_test_results,
        list_of_panel_results=list_of_panel_results,
    )


@router.get(
    "/page/{visit_id}/{page_size}/{page_number}",
    response_model=paginatedMixedVisitResults,
)
async def get_Lab_test_results_with_page_size(
    visit_id: str,
    page_size: int,
    page_number: int,
    # result: str | None = Query(None),
    # lab_test_type_id: str | None = Query(None),
):
    offset = (page_number - 1) * page_size
    mongo_filter_lab_test_results: dict[str, Any] = {}
    if visit_id:
        mongo_filter_lab_test_results["visit_id"] = PydanticObjectId(visit_id)
    # if result:
    #     mongo_filter["result"] = {"$regex": result, "$options": "i"}
    # if lab_test_type_id:
    #     mongo_filter["lab_test_type_id"] = {"$regex": lab_test_type_id, "$options": "i"}
    total_number_of_lab_test_results = await DBLab_test_result.find(
        mongo_filter_lab_test_results
    ).count()
    cursor = (
        DBLab_test_result.find(mongo_filter_lab_test_results)
        .skip(offset)
        .limit(page_size)
    )

    list_of_standalone_test_results: List[patientTestResult] = []
    list_of_panel_results: List[patientPanelResult] = []
    panels_to_list_of_tests: dict[PydanticObjectId, List[patientTestResult]] = {}

    async for test_result in cursor:
        db_lab_test_type = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(test_result.lab_test_type_id)
        )
        if db_lab_test_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid lab test type ID",
            )
        lab_test_type_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_test_type.lab_test_category_id
        )
        if lab_test_type_category is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid lab test category ID",
            )
        lab_test_type = Lab_test_type(
            lab_test_id=str(db_lab_test_type.id),
            name=db_lab_test_type.name,
            nssf_id=db_lab_test_type.nssf_id,
            lab_test_category_id=str(db_lab_test_type.lab_test_category_id),
            unit=db_lab_test_type.unit,
            normal_value_list=db_lab_test_type.normal_value_list,
            price=db_lab_test_type.price,
            lab_test_category_name=lab_test_type_category.lab_test_category_name,
        )
        current_test_result = patientTestResult(
            lab_test_result_id=str(test_result.id),
            lab_test_type=lab_test_type,
            lab_test_type_id=str(db_lab_test_type.id),
            result=test_result.result,
        )

        if test_result.lab_panel_id is not None:
            panel_id = test_result.lab_panel_id
            db_lab_panel = await DBLab_panel.find_one(
                DBLab_panel.id == test_result.lab_panel_id
            )
            if db_lab_panel is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Panel {test_result.lab_panel_id} not found",
                )
            if db_lab_panel.id not in panels_to_list_of_tests:
                panels_to_list_of_tests[panel_id] = []
            panels_to_list_of_tests[panel_id].append(current_test_result)

        else:
            list_of_standalone_test_results.append(current_test_result)

    for panel_id, test_results in panels_to_list_of_tests.items():
        db_lab_panel = await DBLab_panel.find_one(DBLab_panel.id == panel_id)
        if db_lab_panel is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Panel {panel_id} not found",
            )
        db_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_panel.lab_panel_category_id
        )
        if db_category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lab Category with id: {db_lab_panel.lab_panel_category_id} not found",
            )
        list_of_panel_results.append(
            patientPanelResult(
                lab_panel_price=db_lab_panel.lab_panel_price,
                lab_panel_id=str(db_lab_panel.id),
                lab_panel_name=db_lab_panel.panel_name,
                list_of_test_results=test_results,
                lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
                lab_panel_category_name=db_category.lab_test_category_name,
            )
        )

    total_pages = ceil(total_number_of_lab_test_results / page_size)
    output = paginatedMixedVisitResults(
        visit_id=str(visit_id),
        list_of_standalone_test_results=list_of_standalone_test_results,
        list_of_panel_results=list_of_panel_results,
        TotalNumberOfLabTestResults=total_number_of_lab_test_results,
        total_pages=total_pages,
    )
    return output


@router.put("/{lab_test_result_id}")
async def set_result(lab_test_result_id: str, result: str):
    if not PydanticObjectId.is_valid(lab_test_result_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lab_test_result ID",
        )
    _ = await DBLab_test_result.find_one(
        DBLab_test_result.id == PydanticObjectId(lab_test_result_id)
    ).update({"$set": {"result": result}})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{lab_test_result_id}", response_model=DBLab_test_result)
async def get_lab_test_result(lab_test_result_id: str):
    lab_test_result = await DBLab_test_result.get(PydanticObjectId(lab_test_result_id))
    if not lab_test_result:
        raise HTTPException(404, f"lab_test_result {lab_test_result_id} not found")
    return lab_test_result


@router.get("/", response_model=Page[DBLab_test_result])
async def get_all_lab_test_results(visit_id: str):
    all_items = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    return await apaginate(all_items)


@router.put("/{lab_test_result_id}", response_model=DBLab_test_result)
async def update_lab_test_result(
    lab_test_result_id: str, update_data: update_lab_test_result_model
):
    if not PydanticObjectId.is_valid(lab_test_result_id):
        raise HTTPException(400, "Invalid lab_test_result ID")

    existing_lab_test_result = await DBLab_test_result.find_one(
        DBLab_test_result.id == PydanticObjectId(lab_test_result_id)
    )
    if existing_lab_test_result is None:
        raise HTTPException(404, f"Lab_test_result {lab_test_result_id} not found")

    if update_data.lab_test_type_id is not None:
        existing_lab_test_result.lab_test_type_id = update_data.lab_test_type_id

    if update_data.visit_id is not None:
        existing_lab_test_result.visit_id = update_data.visit_id

    if update_data.result is not None:
        existing_lab_test_result.result = update_data.result

    await existing_lab_test_result.replace()

    return existing_lab_test_result


@router.delete("/delete_panels/{visit_id}/{lab_panel_id}", response_class=Response)
async def delete_lab_panel_result(visit_id: str, lab_panel_id: str):
    lab_panel_to_be_deleted = await DBLab_panel.find_one(
        DBLab_panel.id == PydanticObjectId(lab_panel_id)
    )
    if not lab_panel_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab panel of id: {lab_panel_id} not found",
        )
    lab_test_results_to_be_deleted = DBLab_test_result.find(
        DBLab_test_result.lab_panel_id == PydanticObjectId(lab_panel_id),
        DBLab_test_result.visit_id == PydanticObjectId(visit_id),
    )
    await lab_test_results_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{lab_test_result_id}", response_class=Response)
async def delete_lab_test_result(lab_test_result_id: str):
    if not PydanticObjectId.is_valid(lab_test_result_id):
        raise HTTPException(400, "Invalid lab_test_result ID")

    lab_test_result_to_be_deleted = await DBLab_test_result.get(
        PydanticObjectId(lab_test_result_id)
    )
    if not lab_test_result_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab_test_result {lab_test_result_id} not found",
        )
    await lab_test_result_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
