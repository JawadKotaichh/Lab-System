from typing import Optional
from pydantic import ConfigDict, BaseModel, Field
from typing import Union



class Lab_test_type(BaseModel):
    nssf_id: str = Field(...)
    lab_test_type_class_id : str = Field(...)
    name: str = Field(...)
    unit: str = Field(...)
    price: int = Field(...)
    lower_bound: Union[str, float] = Field(...)
    upper_bound:  Union[str, float] = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "nssf_id": "8000",
                "lab_test_type_class_id":"684fd209009ae7352f726b22",
                "name": "FBS",
                "unit": "mg/dL",
                "price": 10,
                "lower_bound": "70",
                "upper_bound": "110",
            }
        },
    )


class update_Lab_test_type_model(BaseModel):
    nssf_id: Optional[str] = None
    lab_test_type_class_id:Optional[str]=None
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
                "nssf_id": "9002",
                "lab_test_type_class_id":"684fd209009ae7352f726b22",
                "name": "FBS",
                "unit": "mg/dL",
                "price": 10,
                "lower_bound": "70",
                "upper_bound": "110",
            }
        },
    )


