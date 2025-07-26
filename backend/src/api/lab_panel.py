from fastapi import APIRouter, HTTPException, Query, status
from ..models import lab_test_type as DBLab_test_type
from ..models import lab_panel as DBLab_panel
from ..models import lab_test_category as DBLab_test_category
from ..schemas.schema_Lab_Panel import (
    Lab_Panel,
    LabPanelResponseTestsIDs,
    update_Lab_Panel_model,
    LabPanelResponse,
    LabPanelPaginatedResponse,
)
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from beanie import PydanticObjectId
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.beanie import apaginate
from math import ceil
from typing import Any, Dict, List

router = APIRouter(
    prefix="/lab_panel",
    tags=["lab_panel"],
)


@router.post(
    "/",
    response_model=DBLab_panel,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab panel",
)
async def create_lab_panel(data: Lab_Panel):
    for lab_test_type_id in data.list_of_test_type_ids:
        if (
            DBLab_test_type.find_one(
                DBLab_test_type.id == PydanticObjectId(lab_test_type_id)
            )
            is None
        ):
            raise HTTPException(400, "Invalid lab_test_type ID")
    db_Lab_panel = DBLab_panel(
        panel_name=data.panel_name, list_of_test_type_ids=data.list_of_test_type_ids
    )
    db_Lab_panel = await db_Lab_panel.insert()
    return db_Lab_panel


@router.get("/page/{page_size}/{page_number}", response_model=LabPanelPaginatedResponse)
async def get_Lab_panel_with_page_size(
    page_size: int, page_number: int, panel_name: str | None = Query(None)
):
    offset = (page_number - 1) * page_size
    mongo_filter = {}
    if panel_name:
        mongo_filter["panel_name"] = {"$regex": panel_name, "$options": "i"}

    total_number_of_lab_panel = await DBLab_panel.find(mongo_filter).count()

    cursor = DBLab_panel.find(mongo_filter).skip(offset).limit(page_size)
    listOfpanels: List[LabPanelResponse] = []

    async for panel in cursor:
        db_lab_panel = await DBLab_panel.find_one(
            DBLab_panel.id == PydanticObjectId(panel.id)
        )
        if not db_lab_panel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Panel {panel.id} not found",
            )
        listOfLabTest: List[Lab_test_type] = []
        for test_id in db_lab_panel.list_of_test_type_ids:
            db_lab_test = await DBLab_test_type.find_one(
                DBLab_test_type.id == PydanticObjectId(test_id)
            )
            if db_lab_test is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"lab test {test_id} not found!",
                )
            db_lab_test_category = await DBLab_test_category.find_one(
                DBLab_test_category.id
                == PydanticObjectId(db_lab_test.lab_test_category_id)
            )
            if db_lab_test_category is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"lab test category {db_lab_test.lab_test_category_id} not found!",
                )
            lab_test = Lab_test_type(
                name=db_lab_test.name,
                nssf_id=db_lab_test.nssf_id,
                lab_test_category_id=str(db_lab_test.lab_test_category_id),
                unit=db_lab_test.unit,
                upper_bound=db_lab_test.upper_bound,
                lower_bound=db_lab_test.lower_bound,
                price=db_lab_test.price,
                lab_test_category_name=db_lab_test_category.lab_test_category_name,
            )
            listOfLabTest.append(lab_test)
        labPanelData = LabPanelResponse(
            nssf_id=db_lab_panel.nssf_id,
            lab_panel_price=db_lab_panel.lab_panel_price,
            id=str(db_lab_panel.id),
            panel_name=db_lab_panel.panel_name,
            lab_tests=listOfLabTest,
        )
        listOfpanels.append(labPanelData)

    total_pages = ceil(total_number_of_lab_panel / page_size)
    output = LabPanelPaginatedResponse(
        TotalNumberOfLabPanels=total_number_of_lab_panel,
        total_pages=total_pages,
        lab_panels=listOfpanels,
    )

    return output


@router.get("/all", response_model=List[Dict[str, Any]])
async def getAllLabPanels() -> List[Dict[str, Any]]:
    cursor = DBLab_panel.find()
    panels: List[Dict[str, Any]] = []
    async for panel in cursor:
        panels.append(
            {
                "lab_panel_id": str(panel.id),
                "panel_name": panel.panel_name,
                "list_of_test_type_ids": [
                    str(tid) for tid in panel.list_of_test_type_ids
                ],
            }
        )
    return panels


@router.get("/{lab_panel_id}", response_model=LabPanelResponse)
async def getLabPanel(lab_panel_id: str):
    if not PydanticObjectId.is_valid(lab_panel_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid lab_panel_id ID"
        )
    db_lab_panel = await DBLab_panel.find_one(
        DBLab_panel.id == PydanticObjectId(lab_panel_id)
    )
    if not db_lab_panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Panel {lab_panel_id} not found",
        )
    listOfLabTest: List[Lab_test_type] = []
    for test_id in db_lab_panel.list_of_test_type_ids:
        db_lab_test = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(test_id)
        )
        if db_lab_test is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"lab test {test_id} not found!",
            )
        db_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_test.lab_test_category_id
        )
        if db_category is None:
            raise HTTPException(
                status_code=404,
                detail=f"Lab Test Type {db_lab_test.lab_test_category_id} not found",
            )
        lab_test = Lab_test_type(
            lab_test_id=str(db_lab_test.id),
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=db_lab_test.nssf_id,
            lab_test_category_id=str(db_lab_test.lab_test_category_id),
            name=db_lab_test.name,
            unit=db_lab_test.unit,
            price=db_lab_test.price,
            lower_bound=db_lab_test.lower_bound,
            upper_bound=db_lab_test.upper_bound,
        )
        listOfLabTest.append(lab_test)
    labPanelData = LabPanelResponse(
        nssf_id=db_lab_panel.nssf_id,
        lab_panel_price=db_lab_panel.lab_panel_price,
        id=str(db_lab_panel.id),
        panel_name=db_lab_panel.panel_name,
        lab_tests=listOfLabTest,
    )

    return labPanelData


@router.get("/{lab_panel_id}/test_ids", response_model=LabPanelResponseTestsIDs)
async def getLabPanelWithListOfIDs(lab_panel_id: str):
    if not PydanticObjectId.is_valid(lab_panel_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid lab_panel_id ID"
        )
    db_lab_panel = await DBLab_panel.get(PydanticObjectId(lab_panel_id))
    if not db_lab_panel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Panel with id: {lab_panel_id} not found",
        )

    testsList: List[str] = []
    for test_type_id in db_lab_panel.list_of_test_type_ids:
        testsList.append(str(test_type_id))

    output: LabPanelResponseTestsIDs = LabPanelResponseTestsIDs(
        nssf_id=db_lab_panel.nssf_id,
        id=str(db_lab_panel.id),
        panel_name=db_lab_panel.panel_name,
        list_of_test_type_ids=testsList,
        lab_panel_price=db_lab_panel.lab_panel_price,
    )
    return output


@router.get("/{lab_panel_id}", response_model=DBLab_panel)
async def get_lab_panel(lab_panel_id: str):
    if not PydanticObjectId.is_valid(lab_panel_id):
        raise HTTPException(400, "Invalid lab_panel_id ID")
    Lab_panel = await DBLab_panel.get(PydanticObjectId(lab_panel_id))
    if not Lab_panel:
        raise HTTPException(404, f"Lab_panel {lab_panel_id} not found")
    return Lab_panel


@router.get("/", response_model=Page[DBLab_panel])
async def get_all_lab_panels():
    all_items = DBLab_panel.find()
    return await apaginate(all_items)


@router.put("/{lab_panel_id}", response_model=DBLab_panel)
async def update_lab_panel(lab_panel_id: str, update_data: update_Lab_Panel_model):
    if not PydanticObjectId.is_valid(lab_panel_id):
        raise HTTPException(400, "Invalid lab_panel ID")

    existing_Lab_panel = await DBLab_panel.find_one(
        DBLab_panel.id == PydanticObjectId(lab_panel_id)
    )
    if existing_Lab_panel is None:
        raise HTTPException(404, f"Lab_panel {lab_panel_id} not found")

    if update_data.panel_name is not None:
        existing_Lab_panel.panel_name = update_data.panel_name
    if update_data.list_of_test_type_ids is not None:
        existing_Lab_panel.list_of_test_type_ids = update_data.list_of_test_type_ids
    if update_data.lab_panel_price is not None:
        existing_Lab_panel.lab_panel_price = update_data.lab_panel_price
    if update_data.nssf_id is not None:
        existing_Lab_panel.nssf_id = update_data.nssf_id

    await existing_Lab_panel.replace()

    return existing_Lab_panel


@router.delete("/{lab_panel_id}", response_class=Response)
async def delete_lab_panel(lab_panel_id: str):
    if not PydanticObjectId.is_valid(lab_panel_id):
        raise HTTPException(400, "Invalid lab_panel ID")
    lab_panel_to_be_deleted = await DBLab_panel.get(PydanticObjectId(lab_panel_id))
    if not lab_panel_to_be_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab_panel not found",
        )
    await lab_panel_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
