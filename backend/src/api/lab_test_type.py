from fastapi import APIRouter, HTTPException, status
from typing import List
from src.models import lab_test_type as DBLab_test_type
from src.schemas.Lab_Test_Type import Lab_test_type, update_Lab_test_type_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response

router = APIRouter(
    prefix="/lab_test_type",
    tags=["lab_test_type"],
)
PyObjectId = Annotated[str, BeforeValidator(str)]


@router.post(
    "/",
    response_model=DBLab_test_type,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab test type",
)
async def create_lab_test_type(data: Lab_test_type):
    db_Lab_test_type = DBLab_test_type(
        nssf_id=data.nssf_id,
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


@router.get("/", response_model=List[DBLab_test_type])
async def get_all_lab_test_type():
    return await DBLab_test_type.find_all().to_list()


@router.put("/{lab_test_type_id}", response_model=DBLab_test_type)
async def updatelLab_test_type(
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

    await existing_Lab_test_type.replace()

    return existing_Lab_test_type


@router.delete("/{lab_test_type_id}")
async def delete_patient(lab_test_type_id: str):
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
