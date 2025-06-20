from fastapi import APIRouter, HTTPException, status
from src.models import lab_test_type_class as DBLab_test_type_class
from src.schemas.schema_lab_test_type_class import Lab_Test_Type_Class, update_lab_test_type_class
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate

router = APIRouter(prefix="/lab_test_type_class", tags=["lab_test_type_class"])
PyObjectId = Annotated[str, BeforeValidator(str)]


@router.get("/all")
async def getAllInsuranceCompany():
    all_lab_test_type_classes = DBLab_test_type_class.find()
    output = []
    async for lab_test_type_class in all_lab_test_type_classes:
        d = {}
        d["lab_test_type_class_id"] = str(lab_test_type_class.id)
        d["lab_test_type_class_name"] = lab_test_type_class.lab_test_type_class_name
        output.append(d)
    return output

@router.post(
    "/",
    response_model=DBLab_test_type_class,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab_test_type_class",
)
async def create_lab_test_type_class(data: Lab_Test_Type_Class):
    db_lab_test_type_class = DBLab_test_type_class(
        lab_test_type_class_name=data.lab_test_type_class_name
    )
    new_lab_test_type_class = await db_lab_test_type_class.insert()
    if not new_lab_test_type_class:
        raise HTTPException(status_code=404, detail="lab_test_type_class was not created")
    return new_lab_test_type_class


@router.get("/{lab_test_type_class_id}")
async def get_lab_test_type_class(lab_test_type_class_id: str):
    
    if not ObjectId.is_valid(lab_test_type_class_id):
        raise HTTPException(400, "Invalid lab_test_type_class ID")
    lab_test_type_class = await DBLab_test_type_class.get(ObjectId(lab_test_type_class_id))
    
    if not lab_test_type_class:
        raise HTTPException(404, f"lab_test_type_class {lab_test_type_class_id} not found")
    output = {}
    output["lab_test_type_class_id"] = str(lab_test_type_class.id)
    output["lab_test_type_class_name"] = lab_test_type_class.lab_test_type_class_name
    return output


@router.get("/", response_model=Page[DBLab_test_type_class])
async def get_all_lab_test_type_classes():
    all_items = DBLab_test_type_class.find()
    return await apaginate(all_items)


@router.put("/{lab_test_type_class_id}", response_model=DBLab_test_type_class)
async def update_lab_test_type_class(lab_test_type_class_id: str, update_data: update_lab_test_type_class):
    if not ObjectId.is_valid(lab_test_type_class_id):
        raise HTTPException(400, "Invalid lab_test_type_class ID")

    existing_lab_test_type_class = await DBLab_test_type_class.find_one(DBLab_test_type_class.id == ObjectId(lab_test_type_class_id))
    if existing_lab_test_type_class is None:
        raise HTTPException(404, f"lab_test_type_class {lab_test_type_class_id} not found")

    if update_data.lab_test_type_class_name is not None:
        existing_lab_test_type_class.lab_test_type_class_name = update_data.lab_test_type_class_name
        
    await existing_lab_test_type_class.replace()

    return existing_lab_test_type_class


@router.delete("/{lab_test_type_class_id}")
async def delete_lab_test_type_class(lab_test_type_class_id: str):
    if not ObjectId.is_valid(lab_test_type_class_id):
        raise HTTPException(400, "Invalid lab_test_type_class ID")
    lab_test_type_class_to_be_deleted = await DBLab_test_type_class.find_one(
        DBLab_test_type_class.id == ObjectId(lab_test_type_class_id)
    )
    if lab_test_type_class_to_be_deleted is None:
        raise HTTPException(404, f"lab_test_type_class {lab_test_type_class_id} not found")
    await lab_test_type_class_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
