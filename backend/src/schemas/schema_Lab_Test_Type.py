from typing import Optional
from pydantic import ConfigDict, BaseModel, Field



class Lab_test_type(BaseModel):
    nssf_id: int = Field(...)
    name: str = Field(...)
    unit: str = Field(...)
    price: int = Field(...)
    lower_bound: str = Field(...)
    upper_bound: str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "nssf_id": 8000,
                "name": "FBS",
                "unit": "mg/dL",
                "price": 10,
                "lower_bound": "70",
                "upper_bound": "110",
            }
        },
    )


class update_Lab_test_type_model(BaseModel):
    nssf_id: Optional[int] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[int] = None
    lower_bound: Optional[str] = None
    upper_bound: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "nssf_id": 9002,
                "name": "FBS",
                "unit": "mg/dL",
                "price": 10,
                "lower_bound": "70",
                "upper_bound": "110",
            }
        },
    )


