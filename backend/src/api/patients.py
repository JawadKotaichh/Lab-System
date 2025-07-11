from fastapi import APIRouter, HTTPException, status
from ..models import Patient as DBPatient
from ..schemas.schema_Patient import Patient, update_patient_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil
from typing import Any, Dict, List

router = APIRouter(prefix="/patients", tags=["patients"])
PyObjectId = Annotated[str, BeforeValidator(str)]

@router.get("/page/{page_size}/{page_number}",response_model=Dict[str, Any])
async def get_patients_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    total_number_of_patients = await DBPatient.find_all().count()
    cursor = DBPatient.find().skip(offset).limit(page_size)
    patients : List[Dict[str, Any]] = []
    async for patient in cursor:
        patients.append({
            "patient_id": str(patient.id),
            "patient_name": patient.name,
            "gender": patient.gender,
            "DOB":patient.DOB,
            "phone_number":patient.phone_number,
            "insurance_company_id":str(patient.insurance_company_id),
        })
    total_pages= ceil(total_number_of_patients / page_size)
    return {
        "TotalNumberOfPatients":total_number_of_patients,
        "total_pages":total_pages,
        "patients":patients
    }

@router.get("/all",response_model=List[Dict[str,Any]])
async def getAllPatients()->List[Dict[str,Any]]:
    cursor = DBPatient.find()
    patients:List[Dict[str,Any]]=[]
    async for patient in cursor:
        patients.append({
            "patient_id": str(patient.id),
            "patient_name": patient.name,
            "gender": patient.gender,
            "DOB":patient.DOB,
            "phone_number":patient.phone_number,
            "insurance_company_id":patient.insurance_company_id,
        })
    return patients

@router.post(
    "/",
    response_model=DBPatient,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Patient",
)
async def create_patient(data: Patient):
    db_patient = DBPatient(
        name=data.name, gender=data.gender, DOB=data.DOB, phone_number=data.phone_number,insurance_company_id=data.insurance_company_id
    )
    new_patient = await db_patient.insert()
    if not new_patient:
        raise HTTPException(status_code=404, detail="Patient was not created")

    return new_patient


@router.get("/{patient_id}",response_model=Dict[str, Any])
async def get_patient(patient_id: str):
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(400, "Invalid patient ID")
    patient = await DBPatient.get(ObjectId(patient_id))
    
    if not patient:
        raise HTTPException(404, f"Patient {patient_id} not found")
    output: Dict[str, Any] = {}
    output["patient_id"] = str(patient.id)
    output["patient_name"] = patient.name
    output["gender"] = patient.gender
    output["DOB"] = patient.DOB
    output["phone_number"] = patient.phone_number
    output["insurance_company_id"]=patient.insurance_company_id

    return output


@router.get("/", response_model=Page[DBPatient])
async def get_all_patients():
    all_items = DBPatient.find()
    return await apaginate(all_items)


@router.put("/{patient_id}", response_model=DBPatient)
async def update_patient(patient_id: str, update_data: update_patient_model):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(400, "Invalid patient ID")
    
    existing_patient = await DBPatient.find_one(DBPatient.id == ObjectId(patient_id))
    if existing_patient is None:
        raise HTTPException(404, f"Patient {patient_id} not found")

    if update_data.name is not None:
        existing_patient.name = update_data.name
    if update_data.DOB is not None:
        existing_patient.DOB = update_data.DOB
    if update_data.gender is not None:
        existing_patient.gender = update_data.gender
    if update_data.phone_number is not None:
        existing_patient.phone_number = update_data.phone_number
    if update_data.insurance_company_id is not None:
        if not ObjectId.is_valid(update_data.insurance_company_id):
            raise HTTPException(400, "Invalid insurance_company ID")
        existing_patient.insurance_company_id = update_data.insurance_company_id

    await existing_patient.replace()

    return existing_patient


@router.delete("/{patient_id}", response_class=Response)
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
