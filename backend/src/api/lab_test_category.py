from fastapi import APIRouter, HTTPException, status
from ..models import lab_test_category as DBlab_test_category
from ..schemas.schema_lab_test_category import lab_test_category, update_lab_test_category
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate

router = APIRouter(prefix="/lab_test_category", tags=["lab_test_category"])
PyObjectId = Annotated[str, BeforeValidator(str)]

@router.get("/page",response_model=list[lab_test_category])
async def get_lab_test_category_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    lab_test_category_paginated = DBlab_test_category.find().skip(offset).limit(page_size)
    lab_test_category_paginated_list = []
    async for test_type_category in lab_test_category_paginated:
        lab_test_category_paginated_list.append(test_type_category)
    return lab_test_category_paginated_list

@router.get("/all")
async def getAllTestTypeCategories():
    all_lab_test_type_categories = await DBlab_test_category.find().to_list()
    output = []
    for category in all_lab_test_type_categories:
        d = {}
        d["lab_test_category_id"] = str(category.id)
        d["lab_test_category_name"] = category.lab_test_category_name
        output.append(d)
    return output

@router.post(
    "/",
    response_model=DBlab_test_category,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab_test_category",
)
async def create_lab_test_category(data: lab_test_category):
    db_lab_test_category = DBlab_test_category(
        lab_test_category_name=data.lab_test_category_name
    )
    new_lab_test_category = await db_lab_test_category.insert()
    if not new_lab_test_category:
        raise HTTPException(status_code=404, detail="lab_test_category was not created")
    return new_lab_test_category


@router.get("/{lab_test_category_id}")
async def get_lab_test_category(lab_test_category_id: str):
    
    if not ObjectId.is_valid(lab_test_category_id):
        raise HTTPException(400, "Invalid lab_test_category ID")
    lab_test_category = await DBlab_test_category.get(ObjectId(lab_test_category_id))
    
    if not lab_test_category:
        raise HTTPException(404, f"lab_test_category {lab_test_category_id} not found")
    output = {}
    output["lab_test_category_id"] = str(lab_test_category.id)
    output["lab_test_category_name"] = lab_test_category.lab_test_category_name
    return output


@router.get("/", response_model=Page[DBlab_test_category])
async def get_all_lab_test_categoryes():
    all_items = DBlab_test_category.find()
    return await apaginate(all_items)


@router.put("/{lab_test_category_id}", response_model=DBlab_test_category)
async def Update_lab_test_category(lab_test_category_id: str, update_data: update_lab_test_category):
    if not ObjectId.is_valid(lab_test_category_id):
        raise HTTPException(400, "Invalid lab_test_category ID")

    existing_lab_test_category = await DBlab_test_category.find_one(DBlab_test_category.id == ObjectId(lab_test_category_id))
    if existing_lab_test_category is None:
        raise HTTPException(404, f"lab_test_category {lab_test_category_id} not found")

    if update_data.lab_test_category_name is not None:
        existing_lab_test_category.lab_test_category_name = update_data.lab_test_category_name
        
    await existing_lab_test_category.replace()

    return existing_lab_test_category


@router.delete("/{lab_test_category_id}")
async def delete_lab_test_category(lab_test_category_id: str):
    if not ObjectId.is_valid(lab_test_category_id):
        raise HTTPException(400, "Invalid lab_test_category ID")
    lab_test_category_to_be_deleted = await DBlab_test_category.find_one(
        DBlab_test_category.id == ObjectId(lab_test_category_id)
    )
    if lab_test_category_to_be_deleted is None:
        raise HTTPException(404, f"lab_test_category {lab_test_category_id} not found")
    await lab_test_category_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
