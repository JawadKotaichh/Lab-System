from fastapi import APIRouter, HTTPException, status
from ..models import lab_test_category as DBlab_test_category
from ..schemas.schema_lab_test_category import lab_test_category, update_lab_test_category
from beanie import PydanticObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil
from typing import Any, Dict, List
from fastapi import Query

router = APIRouter(prefix="/lab_test_category", tags=["lab_test_category"])

@router.get("/page/{page_size}/{page_number}",response_model=Dict[str, Any])
async def get_lab_test_category_with_page_size(page_number:int,page_size:int,lab_test_category_name:str | None = Query(None)):
    offset = (page_number - 1) * page_size
    insurance_companies: List[Dict[str, Any]] = []
    
    mongo_filter: dict[str, Any] = {}
    if lab_test_category_name:
        mongo_filter["lab_test_category_name"] = {"$regex": lab_test_category_name, "$options": "i"}
    
    cursor = DBlab_test_category.find(mongo_filter).skip(offset).limit(page_size)
    total_number_of_lab_test_category = await DBlab_test_category.find(mongo_filter).count()

    async for current_lab_test_category in cursor:
        insurance_companies.append({
            "lab_test_category_id": str(current_lab_test_category.id),
            "lab_test_category_name": current_lab_test_category.lab_test_category_name,
        })

    total_pages = ceil(total_number_of_lab_test_category / page_size)
    result= {
        "TotalNumberOfLabTestCategories":total_number_of_lab_test_category,
        "total_pages":total_pages,
        "lab_test_categories":insurance_companies
    }
    return result

@router.get("/all",response_model= List[Dict[str, Any]])
async def getAllTestTypeCategories() -> List[Dict[str, Any]]:
    cursor = DBlab_test_category.find()
    lab_test_categories: List[Dict[str, Any]] = []
    async for category in cursor:
        lab_test_categories.append({
            "lab_test_category_id": str(category.id),
            "lab_test_category_name": category.lab_test_category_name,
        })
    return lab_test_categories


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
async def get_lab_test_category(lab_test_category_id: str,response_model=Dict[str, Any]):
    
    if not PydanticObjectId.is_valid(lab_test_category_id):
        raise HTTPException(400, "Invalid lab_test_category ID")
    lab_test_category = await DBlab_test_category.get(PydanticObjectId(lab_test_category_id))
    
    if not lab_test_category:
        raise HTTPException(404, f"lab_test_category {lab_test_category_id} not found")
    output: Dict[str, Any] = {}
    output["lab_test_category_id"] = str(lab_test_category.id)
    output["lab_test_category_name"] = lab_test_category.lab_test_category_name
    return output


@router.get("/", response_model=Page[DBlab_test_category])
async def get_all_lab_test_categoryes():
    all_items = DBlab_test_category.find()
    return await apaginate(all_items)


@router.put("/{lab_test_category_id}", response_model=DBlab_test_category)
async def Update_lab_test_category(lab_test_category_id: str, update_data: update_lab_test_category):
    if not PydanticObjectId.is_valid(lab_test_category_id):
        raise HTTPException(400, "Invalid lab_test_category ID")

    existing_lab_test_category = await DBlab_test_category.find_one(DBlab_test_category.id == PydanticObjectId(lab_test_category_id))
    if existing_lab_test_category is None:
        raise HTTPException(404, f"lab_test_category {lab_test_category_id} not found")

    if update_data.lab_test_category_name is not None:
        existing_lab_test_category.lab_test_category_name = update_data.lab_test_category_name
        
    await existing_lab_test_category.replace()

    return existing_lab_test_category


@router.delete("/{lab_test_category_id}", response_class=Response)
async def delete_lab_test_category(lab_test_category_id: str):
    if not PydanticObjectId.is_valid(lab_test_category_id):
        raise HTTPException(400, "Invalid lab_test_category ID")
    lab_test_category_to_be_deleted = await DBlab_test_category.find_one(
        DBlab_test_category.id == PydanticObjectId(lab_test_category_id)
    )
    if lab_test_category_to_be_deleted is None:
        raise HTTPException(404, f"lab_test_category {lab_test_category_id} not found")
    await lab_test_category_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
