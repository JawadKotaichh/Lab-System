from fastapi import APIRouter, HTTPException, status
from typing import List
from src.models import Visit as DBVisit
from src.models import Patient as DBPatient
from src.schemas.Visit import Visit, update_visit_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response

router = APIRouter(prefix="/patients/{patient_id}/visits", tags=["visits"])
PyObjectId = Annotated[str, BeforeValidator(str)]


@router.post(
    "/",
    response_model=DBVisit,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new visit",
)
async def create_visit(patient_id: str, data: Visit):
    if not ObjectId.is_valid(patient_id) or data.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID",
        )
    patient = await DBPatient.get(ObjectId(patient_id))
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    db_visit = DBVisit(patient_id=data.patient_id, date=data.date)
    new_visit = await db_visit.insert()
    return new_visit


@router.get("/{visit_id}", response_model=DBVisit)
async def get_visit(visit_id: str):
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    Visit = await DBVisit.get(ObjectId(visit_id))
    if not Visit:
        raise HTTPException(404, f"Visit {visit_id} not found")
    return Visit


@router.get("/", response_model=List[DBVisit])
async def get_all_visits():
    return await DBVisit.find_all().to_list()


@router.put("/{visit_id}", response_model=DBVisit)
async def update_visit(visit_id: str, update_data: update_visit_model):
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")

    existing_visit = await DBVisit.find_one(DBVisit.id == ObjectId(visit_id))
    if existing_visit is None:
        raise HTTPException(404, f"Visit {visit_id} not found")

    existing_visit.patient_id = update_data.patient_id
    existing_visit.date = update_data.date

    await existing_visit.replace()

    return existing_visit


@router.delete("/{visit_id}")
async def delete_patient(visit_id: str):
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    visit_to_be_deleted = await DBPatient.get(ObjectId(visit_id))
    if not visit_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found",
        )
    await visit_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
