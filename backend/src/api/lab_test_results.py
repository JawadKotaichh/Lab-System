from math import ceil
from fastapi import APIRouter, HTTPException, status, Query
from ..models import lab_test_result as DBLab_test_result
from ..models import Visit as DBVisit
from ..models import lab_test_type as DBLab_test_type
from ..models import Patient as DBPatient
from ..models import insurance_company as DBInsurance_company
from ..schemas.schema_Lab_Test_Result import (
    Lab_test_result,
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


@router.get("/completed/{visit_id}", response_model=Dict[str, Any])
async def get_completed_and_total_results(visit_id: str):
    all_items = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    total = 0.0
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
        total += 1
        lab_test = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(item.lab_test_type_id)
        )
        if lab_test is not None:
            totalPrice += lab_test.price
        if item.result != "":
            completed += 1
    FinalTotalPrice = totalPrice * (float(insurance_company.rate))
    output: Dict[str, Any] = {
        "visit_id": str(visit_id),
        "countOfCompletedResults": completed,
        "totalNumberOfTests": total,
        "totalPrice": round(FinalTotalPrice, 2),
    }
    return output


@router.get("/page/{page_size}/{page_number}", response_model=List[Dict[str, Any]])
async def get_Lab_panel_with_page_size(
    page_number: int,
    page_size: int,
    visit_id: str | None = Query(None),
    result: str | None = Query(None),
    lab_test_type_id: str | None = Query(None),
):
    offset = (page_number - 1) * page_size
    mongo_filter: dict[str, Any] = {}
    if visit_id:
        mongo_filter["visit_id"] = {"$regex": visit_id, "$options": "i"}
    if result:
        mongo_filter["result"] = {"$regex": result, "$options": "i"}
    if lab_test_type_id:
        mongo_filter["lab_test_type_id"] = {"$regex": lab_test_type_id, "$options": "i"}

    total_number_of_labtest_results = await DBLab_test_result.find(mongo_filter).count()
    cursor = DBLab_test_result.find(mongo_filter).skip(offset).limit(page_size)

    test_results: List[Dict[str, Any]] = []
    async for test_result in cursor:
        test_results.append(
            {
                "lab_test_result_id": str(test_result.id),
                "lab_test_type_id": str(test_result.lab_test_type_id),
                "visit_id": str(test_result.visit_id),
                "result": test_result.result,
            }
        )

    total_pages = ceil(total_number_of_labtest_results / page_size)
    output = {
        "TotalNumberOfLabTestResults": total_number_of_labtest_results,
        "total_pages": total_pages,
        "test_results": test_results,
    }
    return output


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
            detail="Invalid visit_id ID",
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
    )
    new_lab_test_result = await db_lab_test_result.insert()
    return new_lab_test_result


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


@router.get("/all/{visit_id}", response_model=List[Dict[str, Any]])
async def get_list_of_lab_test(visit_id: str):
    all_items = DBLab_test_result.find(
        DBLab_test_result.visit_id == PydanticObjectId(visit_id)
    )
    output: List[Dict[str, Any]] = []
    async for item in all_items:
        d: Dict[str, Any] = {}
        lab_test = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(item.lab_test_type_id)
        )
        if lab_test is not None:
            d["lab_test_type_id"] = str(item.lab_test_type_id)
            d["lab_test_category_id"] = str(lab_test.lab_test_category_id)
            d["name"] = lab_test.name
            d["result"] = item.result
            d["unit"] = lab_test.unit
            d["price"] = lab_test.price
            d["upper_bound"] = lab_test.upper_bound
            d["lower_bound"] = lab_test.lower_bound
            d["lab_test_result_id"] = str(item.id)
        output.append(d)
    return output


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
