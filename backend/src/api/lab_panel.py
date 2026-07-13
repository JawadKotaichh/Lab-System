from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from ..models import lab_test_type as DBLab_test_type
from ..models import lab_panel as DBLab_panel
from ..models import lab_test_category as DBLab_test_category
from ..schemas.schema_Lab_Panel import (
    Lab_Panel,
    LabPanelResponseTestsIDs,
    LabPanelWithIdsListOut,
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
from .deps import require_admin
from typing import Any, Dict, List

router = APIRouter(
    prefix="/lab_panel",
    tags=["lab_panel"],
    dependencies=[Depends(require_admin)],
)


async def validate_lab_test_type_ids(test_type_ids: List[PydanticObjectId]) -> None:
    for test_type_id in test_type_ids:
        if not PydanticObjectId.is_valid(str(test_type_id)):
            raise HTTPException(400, "Invalid lab_test_type ID")
        db_lab_test_type = await DBLab_test_type.find_one(
            DBLab_test_type.id == PydanticObjectId(str(test_type_id))
        )
        if db_lab_test_type is None:
            raise HTTPException(400, "Invalid lab_test_type ID")


async def validate_lab_panel_category_id(category_id: str) -> PydanticObjectId:
    if not PydanticObjectId.is_valid(str(category_id)):
        raise HTTPException(400, "Invalid lab_panel_category ID")
    category_oid = PydanticObjectId(str(category_id))
    db_category = await DBLab_test_category.find_one(
        DBLab_test_category.id == category_oid
    )
    if db_category is None:
        raise HTTPException(400, "Invalid lab_panel_category ID")
    return category_oid


@router.post(
    "/",
    response_model=DBLab_panel,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lab panel",
)
async def create_lab_panel(data: Lab_Panel):
    await validate_lab_test_type_ids(data.list_of_test_type_ids)
    category_oid = await validate_lab_panel_category_id(data.lab_panel_category_id)
    db_Lab_panel = DBLab_panel(
        panel_name=data.panel_name,
        list_of_test_type_ids=data.list_of_test_type_ids,
        nssf_id=data.nssf_id,
        lab_panel_price=data.lab_panel_price,
        lab_panel_category_id=category_oid,
    )
    db_Lab_panel = await db_Lab_panel.insert()
    return db_Lab_panel


@router.get("/page/{page_size}/{page_number}", response_model=LabPanelPaginatedResponse)
async def get_Lab_panel_with_page_size(
    page_size: int = Path(..., ge=1, le=100),
    page_number: int = Path(..., ge=1),
    panel_name: str | None = Query(None),
):
    offset = (page_number - 1) * page_size
    mongo_filter = {}
    if panel_name:
        mongo_filter["panel_name"] = {"$regex": panel_name, "$options": "i"}

    total_number_of_lab_panel = await DBLab_panel.find(mongo_filter).count()

    page_panels = await (
        DBLab_panel.find(mongo_filter).skip(offset).limit(page_size).to_list()
    )
    listOfpanels: List[LabPanelResponse] = []

    lab_test_ids = list(
        dict.fromkeys(
            test_id for panel in page_panels for test_id in panel.list_of_test_type_ids
        )
    )
    lab_tests = (
        await DBLab_test_type.find({"_id": {"$in": lab_test_ids}}).to_list()
        if lab_test_ids
        else []
    )
    lab_tests_by_id = {lab_test.id: lab_test for lab_test in lab_tests}

    lab_test_category_ids = list(
        dict.fromkeys(lab_test.lab_test_category_id for lab_test in lab_tests)
    )
    lab_test_categories = (
        await DBLab_test_category.find(
            {"_id": {"$in": lab_test_category_ids}}
        ).to_list()
        if lab_test_category_ids
        else []
    )
    lab_test_categories_by_id = {
        category.id: category for category in lab_test_categories
    }

    for db_lab_panel in page_panels:
        listOfLabTest: List[Lab_test_type] = []
        for test_id in db_lab_panel.list_of_test_type_ids:
            db_lab_test = lab_tests_by_id.get(test_id)
            if db_lab_test is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"lab test {test_id} not found!",
                )
            db_lab_test_category = lab_test_categories_by_id.get(
                db_lab_test.lab_test_category_id
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
                normal_value_list=db_lab_test.normal_value_list,
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
            lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
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
async def getAllLabPanels(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> List[Dict[str, Any]]:
    cursor = DBLab_panel.find().sort("_id").skip(offset).limit(limit)
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid lab panel  ID: {lab_panel_id}",
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
                detail=f"Lab Test category with id {db_lab_test.lab_test_category_id} not found",
            )
        lab_test = Lab_test_type(
            lab_test_id=str(db_lab_test.id),
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=db_lab_test.nssf_id,
            lab_test_category_id=str(db_lab_test.lab_test_category_id),
            name=db_lab_test.name,
            unit=db_lab_test.unit,
            price=db_lab_test.price,
            normal_value_list=db_lab_test.normal_value_list,
        )
        listOfLabTest.append(lab_test)
    labPanelData = LabPanelResponse(
        nssf_id=db_lab_panel.nssf_id,
        lab_panel_price=db_lab_panel.lab_panel_price,
        id=str(db_lab_panel.id),
        panel_name=db_lab_panel.panel_name,
        lab_tests=listOfLabTest,
        lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
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
        lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
    )
    return output


@router.get("/{lab_panel_id}/test_types", response_model=LabPanelWithIdsListOut)
async def getLabPanelWithListOfTests(lab_panel_id: str):
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

    testsList: List[Lab_test_type] = []
    testsIdsList: List[str] = []
    for test_type_id in db_lab_panel.list_of_test_type_ids:
        testsIdsList.append(str(test_type_id))
    for test_type_id in db_lab_panel.list_of_test_type_ids:
        db_lab_test = await DBLab_test_type.find_one(DBLab_test_type.id == test_type_id)
        if not db_lab_test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test type with id: {test_type_id} not found",
            )
        db_category = await DBLab_test_category.find_one(
            DBLab_test_category.id == db_lab_test.lab_test_category_id
        )
        if db_category is None:
            raise HTTPException(
                status_code=404,
                detail=f"Lab Test category with id {db_lab_test.lab_test_category_id} not found",
            )
        lab_test = Lab_test_type(
            lab_test_id=str(db_lab_test.id),
            lab_test_category_name=db_category.lab_test_category_name,
            nssf_id=db_lab_test.nssf_id,
            lab_test_category_id=str(db_lab_test.lab_test_category_id),
            name=db_lab_test.name,
            unit=db_lab_test.unit,
            price=db_lab_test.price,
            normal_value_list=db_lab_test.normal_value_list,
        )
        testsList.append(lab_test)
    lab_panel_response: LabPanelResponse = LabPanelResponse(
        id=str(db_lab_panel.id),
        nssf_id=db_lab_panel.nssf_id,
        panel_name=db_lab_panel.panel_name,
        lab_panel_price=db_lab_panel.lab_panel_price,
        lab_tests=testsList,
        lab_panel_category_id=str(db_lab_panel.lab_panel_category_id),
    )
    output: LabPanelWithIdsListOut = LabPanelWithIdsListOut(
        lab_panel=lab_panel_response, list_of_lab_test_ids=testsIdsList
    )
    return output


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
        await validate_lab_test_type_ids(update_data.list_of_test_type_ids)
        existing_Lab_panel.list_of_test_type_ids = update_data.list_of_test_type_ids
    if update_data.lab_panel_price is not None:
        existing_Lab_panel.lab_panel_price = update_data.lab_panel_price
    if update_data.nssf_id is not None:
        existing_Lab_panel.nssf_id = update_data.nssf_id
    if update_data.lab_panel_category_id is not None:
        existing_Lab_panel.lab_panel_category_id = await validate_lab_panel_category_id(
            update_data.lab_panel_category_id
        )

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
