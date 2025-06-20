from typing import Optional
from pydantic import ConfigDict, BaseModel, Field

from beanie import PydanticObjectId


class Lab_test_result(BaseModel):
    lab_test_type_id: PydanticObjectId = Field(..., description="Which test type this result refers to")    
    result: str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "682b2fb189e933f09cbcb489",
                "visit_id": "607c191e810c19729de860ec",
                "result": "",
            }
        },
    )


class update_lab_test_result_model(BaseModel):
    lab_test_type_id: Optional[PydanticObjectId] = None
    visit_id: Optional[PydanticObjectId] = None
    result: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "682b2fb189e933f09cbcb489",
                "result": "Negative",
            }
        },
    )
