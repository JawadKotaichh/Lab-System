from fastapi import APIRouter, HTTPException, status
from ..models import insurance_company as DBInsurance_company
from ..schemas.schema_Insurance_Company import Insurance_company, update_insurance_company
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate

router = APIRouter(prefix="/insurance_company", tags=["insurance_company"])
PyObjectId = Annotated[str, BeforeValidator(str)]


@router.get("/page",response_model=list[Insurance_company])
async def get_insurance_company_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    all_insurance_companies_paginated = DBInsurance_company.find().skip(offset).limit(page_size)
    insurance_companies_list = []
    async for insurance_company in all_insurance_companies_paginated:
        insurance_companies_list.append(insurance_company)
    return insurance_companies_list

@router.get("/all")
async def getAllInsuranceCompany():
    all_insurance_companies = DBInsurance_company.find()
    output = []
    async for insurance_company in all_insurance_companies:
        d = {}
        d["insurance_company_id"] = str(insurance_company.id)
        d["insurance_company_name"] = insurance_company.insurance_company_name
        d["rate"] = insurance_company.rate
        output.append(d)
    return output

@router.post(
    "/",
    response_model=DBInsurance_company,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new insurance_company",
)
async def create_insurance_company(data: Insurance_company):
    db_insurance_company = DBInsurance_company(
        insurance_company_name=data.insurance_company_name, rate=data.rate
    )
    new_insurance_company = await db_insurance_company.insert()
    if not new_insurance_company:
        raise HTTPException(status_code=404, detail="insurance_company was not created")
    return new_insurance_company


@router.get("/{insurance_company_id}")
async def get_insurance_company(insurance_company_id: str):
    
    if not ObjectId.is_valid(insurance_company_id):
        raise HTTPException(400, "Invalid insurance_company ID")
    insurance_company = await DBInsurance_company.get(ObjectId(insurance_company_id))
    
    if not insurance_company:
        raise HTTPException(404, f"Insurance_company {insurance_company_id} not found")
    output = {}
    output["insurance_company_id"] = str(insurance_company.id)
    output["insurance_company_name"] = insurance_company.insurance_company_name
    output["rate"] = insurance_company.rate
    return output


@router.get("/", response_model=Page[DBInsurance_company])
async def get_all_insurance_companies():
    all_items = DBInsurance_company.find()
    return await apaginate(all_items)


@router.put("/{insurance_company_id}", response_model=DBInsurance_company)
async def update_Insurance_company(insurance_company_id: str, update_data: update_insurance_company):
    if not ObjectId.is_valid(insurance_company_id):
        raise HTTPException(400, "Invalid insurance_company ID")

    existing_insurance_company = await DBInsurance_company.find_one(DBInsurance_company.id == ObjectId(insurance_company_id))
    if existing_insurance_company is None:
        raise HTTPException(404, f"insurance_company {insurance_company_id} not found")

    if update_data.insurance_company_name is not None:
        existing_insurance_company.insurance_company_name = update_data.insurance_company_name
    if update_data.rate is not None:
        existing_insurance_company.rate = update_data.rate
        
    await existing_insurance_company.replace()

    return existing_insurance_company


@router.delete("/{insurance_company_id}")
async def delete_insurance_company(insurance_company_id: str):
    if not ObjectId.is_valid(insurance_company_id):
        raise HTTPException(400, "Invalid insurance_company ID")
    insurance_company_to_be_deleted = await DBInsurance_company.find_one(
        DBInsurance_company.id == ObjectId(insurance_company_id)
    )
    if insurance_company_to_be_deleted is None:
        raise HTTPException(404, f"insurance_company {insurance_company_id} not found")
    await insurance_company_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
