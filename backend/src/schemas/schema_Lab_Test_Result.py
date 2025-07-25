from typing import List, Optional
from pydantic import ConfigDict, BaseModel, Field
from ..schemas.schema_Lab_Test_Type import Lab_test_type


class Lab_test_result(BaseModel):
    lab_test_type_id: str = Field(
        ..., description="Which test type this result refers to"
    )
    visit_id: str = Field(...)
    result: str = Field(...)
    lab_panel_name: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "682b2fb189e933f09cbcb489",
                "visit_id": "607c191e810c19729de860ec",
                "result": "",
                "lab_panel_name": "",
            }
        },
    )


class visitResult(BaseModel):
    lab_test_result_id: str
    lab_panel_id: Optional[str] = None
    lab_panel_name: Optional[str] = None
    lab_test_type: Lab_test_type
    lab_test_type_id: str
    result: str


class paginatedVisitResults(BaseModel):
    visit_id: str
    list_of_results: List[visitResult]
    TotalNumberOfLabTestResults: int
    total_pages: int


class update_lab_test_result_model(BaseModel):
    lab_test_type_id: Optional[str] = None
    lab_panel_name: Optional[str] = None
    visit_id: Optional[str] = None
    result: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "682b2fb189e933f09cbcb489",
                "result": "Negative",
                "lab_panel_name": "",
            }
        },
    )
