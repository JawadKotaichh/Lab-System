from typing import Optional
from pydantic import ConfigDict, BaseModel, Field


class Result_suggestions(BaseModel):
    lab_test_type_id: str = Field(...)
    value: str = Field(...)
    use_count: int = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "689f160c5121cd77b303d55f",
                "value": "positive",
                "use_count": "100",
            }
        },
    )


class update_result_suggestions(BaseModel):
    value: Optional[str] = None
    use_count: Optional[int] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "value": "Positive",
                "use_count": "100",
            }
        },
    )
