from fastapi import APIRouter, HTTPException, status
from ..models import lab_test_type as DBLab_test_type
from ..models import lab_panel as DBLab_panel
from ..schemas.schema_Lab_Panel import Lab_Panel,update_Lab_Panel_model
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil

router = APIRouter(
    prefix="/lab_panel",
    tags=["lab_panel"],
)
PyObjectId = Annotated[str, BeforeValidator(str)]

@router.get("/page/{page_size}/{page_number}")
async def get_Lab_panel_with_page_size(page_number:int,page_size:int):
    offset = (page_number - 1) * page_size
    total_number_of_lab_panel = await DBLab_panel.find_all().count()
    all_lab_panels_paginated = DBLab_panel.find().skip(offset).limit(page_size)
    output = []
    async for lab_panel in all_lab_panels_paginated:
        d={}
        d["lab_panel_id"] = str(lab_panel.id)
        d["lab_panel_name"]=str(lab_panel.panel_name)
        d["list_of_test_type_ids"] = lab_panel.list_of_test_type_ids
        output.append(d)

    total_pages = ceil(total_number_of_lab_panel / page_size)
    result= {
        "TotalNumberOfLabPanels":total_number_of_lab_panel,
        "total_pages":total_pages,
        "lab_panels":output
    }
    return result



@router.get("/all")
async def getAllLabPanels():
    all_items = DBLab_panel.find()
    output=[]
    async for lab_panel in all_items:
        d={}
        d["lab_panel_id"] = str(lab_panel.id)
        d["lab_panel_name"]=str(lab_panel.panel_name)
        d["list_of_test_type_ids"] = lab_panel.list_of_test_type_ids
        output.append(d)
    return output

@router.get("/{lab_panel_id}")
async def getLabPanel(lab_panel_id:str):
    lab_panel = await DBLab_panel.get(ObjectId(lab_panel_id))
    if not lab_panel:
        raise HTTPException(status_code=404, detail="Panel not found")
    d={}
    d["lab_panel_id"] = str(lab_panel.id)
    d["lab_panel_name"]=str(lab_panel.panel_name)
    d["list_of_test_type_ids"] = lab_panel.list_of_test_type_ids
    return d

@router.post(
    "/",
    response_model=DBLab_panel,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab panel",
)
async def create_lab_panel(data: Lab_Panel):
    for lab_test_type_id in data.list_of_test_type_ids:
        if DBLab_test_type.find_one(DBLab_test_type.id == ObjectId(lab_test_type_id)) is None:
            raise HTTPException(400, "Invalid lab_test_type ID")
    db_Lab_panel = DBLab_panel(
        panel_name = data.panel_name,
        list_of_test_type_ids= data.list_of_test_type_ids
    )
    db_Lab_panel = await db_Lab_panel.insert()
    return db_Lab_panel


@router.get("/{lab_panel_id}", response_model=DBLab_panel)
async def get_lab_panel(lab_panel_id: str):
    if not ObjectId.is_valid(lab_panel_id):
        raise HTTPException(400, "Invalid lab_panel_id ID")
    Lab_panel = await DBLab_panel.get(ObjectId(lab_panel_id))
    if not Lab_panel:
        raise HTTPException(404, f"Lab_panel {lab_panel_id} not found")
    return Lab_panel



@router.get("/", response_model=Page[DBLab_panel])
async def get_all_lab_panels():
    all_items =  DBLab_panel.find()
    return await apaginate(all_items)




@router.put("/{lab_panel_id}", response_model=DBLab_panel)
async def update_lab_panel(
    lab_panel_id: str, update_data: update_Lab_Panel_model
):
    if not ObjectId.is_valid(lab_panel_id):
        raise HTTPException(400, "Invalid lab_panel ID")

    existing_Lab_panel = await DBLab_panel.find_one(
        DBLab_panel.id == ObjectId(lab_panel_id)
    )
    if existing_Lab_panel is None:
        raise HTTPException(404, f"Lab_panel {lab_panel_id} not found")

    if update_data.panel_name is not None:
        existing_Lab_panel.panel_name = update_data.panel_name
    if update_data.list_of_test_type_ids is not None:
        existing_Lab_panel.list_of_test_type_ids = update_data.list_of_test_type_ids
    
    await existing_Lab_panel.replace()

    return existing_Lab_panel


@router.delete("/{lab_panel_id}")
async def delete_lab_panel(lab_panel_id: str):
    if not ObjectId.is_valid(lab_panel_id):
        raise HTTPException(400, "Invalid lab_panel ID")
    lab_panel_to_be_deleted = await DBLab_panel.get(ObjectId(lab_panel_id))
    if not lab_panel_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab_panel not found",
        )
    await lab_panel_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
