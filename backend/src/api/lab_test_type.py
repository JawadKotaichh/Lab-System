from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status, Query
from ..models import lab_test_type as DBLab_test_type
from ..models import lab_test_category as DBlab_test_category
from ..schemas.schema_Lab_Test_Type import Lab_test_type, update_Lab_test_type_model
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil
from typing import Any, Dict, List
from ..models import Result_suggestions as DBResult_suggestions


router = APIRouter(
    prefix="/lab_test_type",
    tags=["lab_test_type"],
)


@router.get("/page/{page_size}/{page_number}", response_model=Dict[str, Any])
async def get_Lab_test_type_with_page_size(
    page_number: int,
    page_size: int,
    name: str | None = Query(None),
    price: int | None = Query(None),
    unit: str | None = Query(None),
    nssf_id: int | None = Query(None),
    lab_test_category_name: str | None = Query(None),
    lab_test_category_id: str | None = Query(None),
):
    offset = (page_number - 1) * page_size
    mongo_filter: dict[str, Any] = {}
    if name:
        mongo_filter["name"] = {"$regex": name, "$options": "i"}
    if unit:
        mongo_filter["unit"] = {"$regex": unit, "$options": "i"}
    if price:
        expr = {
            "$expr": {
                "$regexMatch": {
                    "input": {"$toString": "$price"},
                    "regex": str(price),
                }
            }
        }
        mongo_filter = {"$and": [mongo_filter, expr]}
    if nssf_id:
        expr = {
            "$expr": {
                "$regexMatch": {
                    "input": {"$toString": "$nssf_id"},
                    "regex": str(nssf_id),
                }
            }
        }
        mongo_filter = {"$and": [mongo_filter, expr]}

    if lab_test_category_id:
        if not PydanticObjectId.is_valid(lab_test_category_id):
            raise HTTPException(400, "Invalid lab_test_category_id")
        mongo_filter["lab_test_category_id"] = {
            "$in": [
                PydanticObjectId(lab_test_category_id),
                lab_test_category_id,
            ]
        }
    elif lab_test_category_name:
        category_filter = {
            "lab_test_category_name": {
                "$regex": lab_test_category_name,
                "$options": "i",
            }
        }
        category_ids: list[PydanticObjectId] = []
        async for category in DBlab_test_category.find(category_filter):
            category_ids.append(category.id)
        id_candidates: list[Any] = []
        for category_id in category_ids:
            id_candidates.extend([category_id, str(category_id)])
        mongo_filter["lab_test_category_id"] = {"$in": id_candidates}

    total_number_of_lab_test_type = await DBLab_test_type.find(mongo_filter).count()
    cursor = DBLab_test_type.find(mongo_filter).skip(offset).limit(page_size)
    lab_tests: List[Lab_test_type] = []

    async for test in cursor:
        db_category = await DBlab_test_category.find_one(
            DBlab_test_category.id == test.lab_test_category_id
        )
        if db_category is None:
            raise HTTPException(
                status_code=404,
                detail=f"Lab Test Type {test.lab_test_category_id} not found",
            )

        lab_test = Lab_test_type(
            normal_value_list=test.normal_value_list,
            lab_test_id=str(test.id),
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=test.nssf_id,
            lab_test_category_id=str(test.lab_test_category_id),
            name=test.name,
            unit=test.unit,
            price=test.price,
        )
        lab_tests.append(lab_test)

    total_pages = ceil(total_number_of_lab_test_type / page_size)
    result = {
        "TotalNumberOfTests": total_number_of_lab_test_type,
        "total_pages": total_pages,
        "lab_tests": lab_tests,
    }
    return result


@router.get("/all", response_model=List[Lab_test_type])
async def getAllTestTypes() -> List[Lab_test_type]:
    cursor = DBLab_test_type.find()
    lab_tests: List[Lab_test_type] = []
    async for test in cursor:
        db_category = await DBlab_test_category.find_one(
            DBlab_test_category.id == test.lab_test_category_id
        )
        if db_category is None:
            raise HTTPException(
                status_code=404,
                detail=f"Lab Test Type {test.lab_test_category_id} not found",
            )
        lab_test = Lab_test_type(
            normal_value_list=test.normal_value_list,
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=test.nssf_id,
            lab_test_category_id=str(test.lab_test_category_id),
            name=test.name,
            unit=test.unit,
            price=test.price,
        )
        lab_tests.append(lab_test)
    return lab_tests


@router.get("/{lab_test_type_id}", response_model=Lab_test_type)
async def getLabTestType(lab_test_type_id: str):
    db_lab_test = await DBLab_test_type.get(PydanticObjectId(lab_test_type_id))
    if not db_lab_test:
        raise HTTPException(status_code=404, detail="Lab Test Type not found")
    db_category = await DBlab_test_category.find_one(
        DBlab_test_category.id == db_lab_test.lab_test_category_id
    )
    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail=f"Lab Test Type {db_lab_test.lab_test_category_id} not found",
        )
    lab_test = Lab_test_type(
        lab_test_category_name=db_category.lab_test_category_name,
        unit=db_lab_test.unit,
        nssf_id=db_lab_test.nssf_id,
        lab_test_category_id=str(db_lab_test.lab_test_category_id),
        name=db_lab_test.name,
        price=db_lab_test.price,
        normal_value_list=db_lab_test.normal_value_list,
    )
    return lab_test


@router.post(
    "/",
    response_model=DBLab_test_type,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab test type",
)
async def create_lab_test_type(data: Lab_test_type):
    if (
        DBlab_test_category.find_one(
            DBlab_test_category.id == PydanticObjectId(data.lab_test_category_id)
        )
        is None
    ):
        raise HTTPException(400, "Invalid lab_test_category ID")
    db_Lab_test_type = DBLab_test_type(
        nssf_id=data.nssf_id,
        lab_test_category_id=str(data.lab_test_category_id),
        name=data.name,
        unit=data.unit,
        price=data.price,
        normal_value_list=data.normal_value_list,
    )
    new_Lab_test_type = await db_Lab_test_type.insert()
    return new_Lab_test_type


@router.get("/{lab_test_type_id}", response_model=DBLab_test_type)
async def get_lab_test_type(lab_test_type_id: str):
    if not PydanticObjectId.is_valid(lab_test_type_id):
        raise HTTPException(400, "Invalid lab_test_type ID")
    Lab_test_type = await DBLab_test_type.get(PydanticObjectId(lab_test_type_id))
    if not Lab_test_type:
        raise HTTPException(404, f"Lab_test_type {lab_test_type_id} not found")
    return Lab_test_type


@router.get("/", response_model=Page[DBLab_test_type])
async def get_all_lab_test_type():
    all_items = DBLab_test_type.find()
    return await apaginate(all_items)


@router.put("/{lab_test_type_id}", response_model=DBLab_test_type)
async def update_lab_test_type(
    lab_test_type_id: str, update_data: update_Lab_test_type_model
):
    print("Iwas called")
    if not PydanticObjectId.is_valid(lab_test_type_id):
        raise HTTPException(400, "Invalid lab_test_type ID")

    existing_Lab_test_type = await DBLab_test_type.find_one(
        DBLab_test_type.id == PydanticObjectId(lab_test_type_id)
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
    if update_data.normal_value_list is not None:
        existing_Lab_test_type.normal_value_list = update_data.normal_value_list
    if update_data.lab_test_category_id is not None:
        existing_Lab_test_type.lab_test_category_id = update_data.lab_test_category_id

    await existing_Lab_test_type.replace()

    return existing_Lab_test_type


@router.delete("/{lab_test_type_id}", response_class=Response)
async def delete_lab_test_type(lab_test_type_id: str):
    if not PydanticObjectId.is_valid(lab_test_type_id):
        raise HTTPException(400, "Invalid lab_test_type ID")
    lab_test_type_to_be_deleted = await DBLab_test_type.get(
        PydanticObjectId(lab_test_type_id)
    )
    if not lab_test_type_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab_test_type not found",
        )
    await DBResult_suggestions.find(
        DBResult_suggestions.lab_test_type_id == lab_test_type_id
    ).delete()

    await lab_test_type_to_be_deleted.delete()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
