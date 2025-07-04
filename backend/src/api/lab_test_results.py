from fastapi import APIRouter, HTTPException, status
from ..models import lab_test_result as DBLab_test_result
from ..models import Visit as DBVisit
from ..models import lab_test_type as DBLab_test_type
from ..schemas.schema_Lab_Test_Result import Lab_test_result, update_lab_test_result_model
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate

router = APIRouter(
    prefix="/lab_tests_results",
    tags=["lab_tests_results"],
)

@router.get("/completed/{visit_id}")
async def get_completed_and_total_results( visit_id: str):
    all_items = DBLab_test_result.find(DBLab_test_result.visit_id == ObjectId(visit_id))
    total = 0
    completed = 0
    totalPrice = 0
    async for item in all_items:
        total+=1
        lab_test = await DBLab_test_type.find_one(DBLab_test_type.id==ObjectId(item.lab_test_type_id))
        if lab_test is not None:
            totalPrice+=lab_test.price
        if item.result!="":
            completed+=1
    output = {
        "visit_id": visit_id,
        "countOfCompletedResults": completed,
        "totalNumberOfTests": total,
        "totalPrice": totalPrice
    }
    return output

@router.get("/page",response_model=list[Lab_test_result])
async def get_lab_test_results_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    all_lab_test_results_paginated = DBLab_test_result.find().skip(offset).limit(page_size)
    lab_test_results_list = []
    async for lab_test_results in all_lab_test_results_paginated:
        lab_test_results_list.append(lab_test_results)
    return lab_test_results_list

@router.post(
    "/{visit_id}",
    response_model=DBLab_test_result,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab test result for a patient in a visit",
)
async def create_lab_test_result( visit_id: str, data: Lab_test_result):
   
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid visit_id ID",
        )

    visit = await DBVisit.get(ObjectId(visit_id))
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Visit {visit_id} not found",
        )
    if not ObjectId.is_valid(data.lab_test_type_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab test type {data.lab_test_type_id} not found",
        )
    test = await DBLab_test_type.get(ObjectId(data.lab_test_type_id))
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
        lab_test_type_id=ObjectId(data.lab_test_type_id),
        visit_id=ObjectId(visit_id),
        result=data.result,
    )
    new_lab_test_result = await db_lab_test_result.insert()
    return new_lab_test_result

@router.put("/{lab_test_result_id}")
async def set_result(lab_test_result_id:str,result:str):
    if not ObjectId.is_valid(lab_test_result_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lab_test_result ID",
        )
    _ = await DBLab_test_result.find_one(
        DBLab_test_result.id == ObjectId(lab_test_result_id)
    ).update({"$set": {"result": result}})
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/all/{visit_id}")
async def get_list_of_lab_test( visit_id: str):
    all_items = DBLab_test_result.find(DBLab_test_result.visit_id == ObjectId(visit_id))
    output=[]
    async for item in all_items:
        d={}
        lab_test = await DBLab_test_type.find_one(DBLab_test_type.id==ObjectId(item.lab_test_type_id))
        if lab_test is not None:
            d["lab_test_type_id"] = str(item.lab_test_type_id)
            d["lab_test_category_id"] = str(lab_test.lab_test_category_id)
            d["lab_test_name"] = lab_test.name
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
    lab_test_result = await DBLab_test_result.get(ObjectId(lab_test_result_id))
    if not lab_test_result:
        raise HTTPException(404, f"lab_test_result {lab_test_result_id} not found")
    return lab_test_result


@router.get("/", response_model=Page[DBLab_test_result])
async def get_all_lab_test_results(visit_id: str):
    all_items = DBLab_test_result.find(DBLab_test_result.visit_id == ObjectId(visit_id))
    return await apaginate(all_items)



@router.put("/{lab_test_result_id}", response_model=DBLab_test_result)
async def update_lab_test_result(
    lab_test_result_id: str, update_data: update_lab_test_result_model
):
    if not ObjectId.is_valid(lab_test_result_id):
        raise HTTPException(400, "Invalid lab_test_result ID")

    existing_lab_test_result = await DBLab_test_result.find_one(
        DBLab_test_result.id == ObjectId(lab_test_result_id)
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


@router.delete("/{lab_test_result_id}")
async def delete_lab_test_result(lab_test_result_id: str):
    if not ObjectId.is_valid(lab_test_result_id):
        raise HTTPException(400, "Invalid lab_test_result ID")
    
    lab_test_result_to_be_deleted = await DBLab_test_result.get(
        ObjectId(lab_test_result_id)
    )
    if not lab_test_result_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab_test_result {lab_test_result_id} not found",
        )
    await lab_test_result_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
