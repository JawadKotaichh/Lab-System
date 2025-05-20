from fastapi import APIRouter, HTTPException, status
from typing import List
from src.models import Patient as DBPatient
from src.schemas.Patient import Patient, update_patient_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response

router = APIRouter(prefix="/patients", tags=["patients"])
PyObjectId = Annotated[str, BeforeValidator(str)]


@router.post(
    "/",
    response_model=DBPatient,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Patient",
)
async def create_patient(data: Patient):
    db_patient = DBPatient(
        name=data.name, gender=data.gender, DOB=data.DOB, phone_number=data.phone_number
    )
    new_patient = await db_patient.insert()
    if not new_patient:
        raise HTTPException(status_code=404, detail="Patient was not created")

    return new_patient.id


@router.get("/{patient_id}", response_model=DBPatient)
async def get_patient(patient_id: str):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(400, "Invalid patient ID")
    patient = await DBPatient.get(ObjectId(patient_id))
    if not patient:
        raise HTTPException(404, f"Patient {patient_id} not found")
    return patient


@router.get("/", response_model=List[DBPatient])
async def get_all_patients():
    return await DBPatient.find_all().to_list()


@router.put("/{patient_id}", response_model=DBPatient)
async def update_patient(patient_id: str, update_data: update_patient_model):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(400, "Invalid patient ID")

    existing_patient = await DBPatient.find_one(DBPatient.id == ObjectId(patient_id))
    if existing_patient is None:
        raise HTTPException(404, f"Patient {patient_id} not found")

    existing_patient.name = update_data.name
    existing_patient.DOB = update_data.DOB
    existing_patient.gender = update_data.gender
    existing_patient.phone_number = update_data.phone_number

    await existing_patient.replace()

    return existing_patient


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(400, "Invalid patient ID")
    patient_to_be_deleted = await DBPatient.find_one(
        DBPatient.id == ObjectId(patient_id)
    )
    if patient_to_be_deleted is None:
        raise HTTPException(404, f"Patient {patient_id} not found")
    await patient_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
