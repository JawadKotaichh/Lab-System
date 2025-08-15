from typing import Optional, List
from pydantic import ConfigDict, BaseModel, Field
from beanie import PydanticObjectId
from ..schemas.schema_Lab_Test_Type import Lab_test_type


class Lab_Panel(BaseModel):
    nssf_id: int = Field(...)
    panel_name: str = Field(...)
    list_of_test_type_ids: List[PydanticObjectId] = Field(...)
    lab_panel_price: float
    lab_panel_category_id: str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {"panel_name": "CBCD", "list_of_test_type_ids": ["", ""]}
        },
    )


class LabPanelResponse(BaseModel):
    id: str
    nssf_id: int
    panel_name: str
    lab_panel_price: float
    lab_tests: List[Lab_test_type]
    lab_panel_category_id: str


class LabPanelResponseTestsIDs(BaseModel):
    id: str
    nssf_id: int
    panel_name: str
    lab_panel_price: float
    list_of_test_type_ids: List[str]
    lab_panel_category_id: str


class LabPanelResponseTestsTypes(BaseModel):
    id: str
    nssf_id: int
    panel_name: str
    lab_panel_price: float
    lab_tests: List[Lab_test_type]
    lab_panel_category_id: str
    list_of_test_type_ids: List[str]


class LabPanelWithIdsListOut(BaseModel):
    lab_panel: LabPanelResponse
    list_of_lab_test_ids: List[str]


class LabPanelPaginatedResponse(BaseModel):
    TotalNumberOfLabPanels: int
    total_pages: int
    lab_panels: List[LabPanelResponse]


class update_Lab_Panel_model(BaseModel):
    panel_name: Optional[str] = None
    nssf_id: Optional[int] = None
    lab_panel_price: Optional[float] = None
    list_of_test_type_ids: Optional[List[PydanticObjectId]] = None
    lab_panel_category_id: Optional[PydanticObjectId] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {"panel_name": "CBCD", "list_of_test_type_ids": ["", ""]}
        },
    )
