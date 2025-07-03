from fastapi import APIRouter, HTTPException, status
from ..models import lab_test_type as DBLab_test_type
from ..models import lab_test_category as DBlab_test_category
from ..schemas.schema_Lab_Test_Type import Lab_test_type, update_Lab_test_type_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil

router = APIRouter(
    prefix="/lab_test_type",
    tags=["lab_test_type"],
)
PyObjectId = Annotated[str, BeforeValidator(str)]

@router.get("/page/{page_size}/{page_number}")
async def get_Lab_test_type_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    total_number_of_lab_test_type = await DBLab_test_type.find_all().count()
    all_lab_tests_paginated = DBLab_test_type.find().skip(offset).limit(page_size)
    output = []
    async for lab_test in all_lab_tests_paginated:
        d={}
        d["lab_test_id"] = str(lab_test.id)
        d["lab_test_category_id"]=str(lab_test.lab_test_category_id)
        d["lab_test_name"] = lab_test.name
        d["nssf_id"] = lab_test.nssf_id
        d["unit"] = lab_test.unit
        d["price"] = lab_test.price
        d["upper_bound"] = lab_test.upper_bound
        d["lower_bound"] = lab_test.lower_bound
        output.append(d)

    total_pages = ceil(total_number_of_lab_test_type / page_size)
    result= {
        "TotalNumberOfTests":total_number_of_lab_test_type,
        "total_pages":total_pages,
        "lab_tests":output
    }
    return result



@router.get("/all")
async def getAllTestTypes():
    all_items = DBLab_test_type.find()
    output=[]
    async for lab_test in all_items:
        d={}
        d["lab_test_id"] = str(lab_test.id)
        d["lab_test_category_id"]=str(lab_test.lab_test_category_id)
        d["lab_test_name"] = lab_test.name
        d["nssf_id"] = lab_test.nssf_id
        d["unit"] = lab_test.unit
        d["price"] = lab_test.price
        d["upper_bound"] = lab_test.upper_bound
        d["lower_bound"] = lab_test.lower_bound
        output.append(d)
    return output
@router.get("/{lab_test_type_id}")
async def getLabTestType(lab_test_type_id:str):
    lab_test = await DBLab_test_type.get(ObjectId(lab_test_type_id))
    d={}
    d["lab_test_id"] = str(lab_test_type_id)
    d["lab_test_category_id"]=str(lab_test.lab_test_category_id)
    d["name"] = lab_test.name
    d["nssf_id"] = lab_test.nssf_id
    d["unit"] = lab_test.unit
    d["price"] = lab_test.price
    d["upper_bound"] = lab_test.upper_bound
    d["lower_bound"] = lab_test.lower_bound

    return d

@router.post(
    "/",
    response_model=DBLab_test_type,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab test type",
)
async def create_lab_test_type(data: Lab_test_type):
    if DBlab_test_category.find_one(DBlab_test_category.id == ObjectId(data.lab_test_category_id)) is None:
        raise HTTPException(400, "Invalid lab_test_category ID")
    db_Lab_test_type = DBLab_test_type(
        nssf_id=data.nssf_id,
        lab_test_category_id=data.lab_test_category_id,
        name=data.name,
        unit=data.unit,
        price=data.price,
        lower_bound=data.lower_bound,
        upper_bound=data.upper_bound,
    )
    new_Lab_test_type = await db_Lab_test_type.insert()
    return new_Lab_test_type


@router.get("/{lab_test_type_id}", response_model=DBLab_test_type)
async def get_lab_test_type(lab_test_type_id: str):
    if not ObjectId.is_valid(lab_test_type_id):
        raise HTTPException(400, "Invalid lab_test_type ID")
    Lab_test_type = await DBLab_test_type.get(ObjectId(lab_test_type_id))
    if not Lab_test_type:
        raise HTTPException(404, f"Lab_test_type {lab_test_type_id} not found")
    return Lab_test_type



@router.get("/", response_model=Page[DBLab_test_type])
async def get_all_lab_test_type():
    all_items =  DBLab_test_type.find()
    return await apaginate(all_items)




@router.put("/{lab_test_type_id}", response_model=DBLab_test_type)
async def update_lab_test_type(
    lab_test_type_id: str, update_data: update_Lab_test_type_model
):
    if not ObjectId.is_valid(lab_test_type_id):
        raise HTTPException(400, "Invalid lab_test_type ID")

    existing_Lab_test_type = await DBLab_test_type.find_one(
        DBLab_test_type.id == ObjectId(lab_test_type_id)
    )
    if existing_Lab_test_type is None:
        raise HTTPException(404, f"Lab_test_type {lab_test_type_id} not found")

    if update_data.nssf_id is not None:
        existing_Lab_test_type.nssf_id = update_data.nssf_id
    if update_data.name is not None:
        existing_Lab_test_type.name = update_data.name
    if update_data.unit is not None:
        existing_Lab_test_type.unit = update_data.unit
    if update_data.price is not None:
        existing_Lab_test_type.price = update_data.price
    if update_data.lower_bound is not None:
        existing_Lab_test_type.lower_bound = update_data.lower_bound
    if update_data.upper_bound is not None:
        existing_Lab_test_type.upper_bound = update_data.upper_bound
    if update_data.lab_test_category_id is not None:
        existing_Lab_test_type.lab_test_category_id = update_data.lab_test_category_id

    await existing_Lab_test_type.replace()

    return existing_Lab_test_type


@router.delete("/{lab_test_type_id}")
async def delete_lab_test_type(lab_test_type_id: str):
    if not ObjectId.is_valid(lab_test_type_id):
        raise HTTPException(400, "Invalid lab_test_type ID")
    lab_test_type_to_be_deleted = await DBLab_test_type.get(ObjectId(lab_test_type_id))
    if not lab_test_type_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab_test_type not found",
        )
    await lab_test_type_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
