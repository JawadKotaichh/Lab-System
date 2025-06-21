from fastapi import APIRouter, HTTPException, status,Query
from datetime import date, datetime, time
from typing import Optional
from ..models import Visit as DBVisit
from ..models import Patient as DBPatient
from ..schemas.schema_Visit import Visit, update_visit_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil


router = APIRouter(prefix="/visits", tags=["visits"])
PyObjectId = Annotated[str, BeforeValidator(str)]


@router.get("/page/{page_size}/{page_number}")
async def get_visits_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    total_number_of_visits = await DBVisit.find_all().count()
    all_visit_paginated = DBVisit.find().skip(offset).limit(page_size)
    output = []
    async for visit in all_visit_paginated:
        d = {}
        d["visit_id"] = str(visit.id)
        d["date"] = str(visit.date)[:10]
        d["patient_id"] = str(visit.patient_id)

        output.append(d)

    total_pages= ceil(total_number_of_visits / page_size)
    return {
        "TotalNumberOfVisits":total_number_of_visits,
        "total_pages":total_pages,
        "visits":output
    }



@router.get("/all")
async def getAllVisits():
    all_items = DBVisit.find()
    output=[]
    async for visit in all_items:
        d={}
        d["visit_id"] = str(visit.id)
        d["date"] = str(visit.date)[:10]
        d["patient_id"] = str(visit.patient_id)
        output.append(d)
    return output



@router.get("/{visit_id}/patient_name")
async def get_patient_name(visit_id: PyObjectId):
    visit = await DBVisit.get(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    patient  = await DBPatient.get(visit.patient_id)
    if patient is not None:
        return {"patient_id": visit.patient_id, "name": patient.name,"visit_id":visit_id}
    else:
        raise HTTPException(status_code=404, detail="Patient not found")

@router.get("/", response_model=Page[DBVisit])
async def get_visits_by_date_range(
    start_date: Optional[date] = Query(
        None, 
        description="Include visits with date >= this (YYYY-MM-DD)"
    ),
    end_date: Optional[date] = Query(
        None, 
        description="Include visits with date <= this (YYYY-MM-DD)"
    ),
):


    query: dict = {}

    if start_date or end_date:
        if start_date:
            start_date = datetime.combine(start_date, time.min)
        if end_date:
            end_date = datetime.combine(end_date, time.max)

        date_filter: dict = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter

    cursor = DBVisit.find(query)
    return await apaginate(cursor)

@router.post(
    "/{patient_id}",
    response_model=DBVisit,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new visit",
)
async def create_visit(patient_id: PyObjectId, data: Visit):
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID",
        )
    if  data.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient ID in the visit is not the same as the one given!",
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
async def get_visit(visit_id: PyObjectId):
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    Visit = await DBVisit.get(ObjectId(visit_id))
    if not Visit:
        raise HTTPException(404, f"Visit {visit_id} not found")
    return Visit


@router.get("/", response_model=Page[DBVisit])
async def get_all_visits():
    all_items =  DBVisit.find()
    return  await apaginate(all_items)


@router.put("/{visit_id}", response_model=DBVisit)
async def update_visit(visit_id: PyObjectId, update_data: update_visit_model):
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    if not ObjectId.is_valid(update_data.patient_id):
        raise HTTPException(400, "Invalid Visit ID")

    existing_visit = await DBVisit.find_one(DBVisit.id == ObjectId(visit_id))
    if existing_visit is None:
        raise HTTPException(404, f"Visit {visit_id} not found")
    patient = await DBPatient.get(ObjectId(update_data.patient_id))
    if patient is None:
        raise HTTPException(404, f"Visit {visit_id} not found")

    if update_data.patient_id is not None:
        existing_visit.patient_id = update_data.patient_id
    if update_data.date is not None:
        existing_visit.date = update_data.date

    await existing_visit.replace()

    return existing_visit


@router.delete("/{visit_id}")
async def delete_visit(visit_id: PyObjectId):
    if not ObjectId.is_valid(visit_id):
        raise HTTPException(400, "Invalid Visit ID")
    visit_to_be_deleted = await DBVisit.get(ObjectId(visit_id))
    if not visit_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found",
        )
    await visit_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
