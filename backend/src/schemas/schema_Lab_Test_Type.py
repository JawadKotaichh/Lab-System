from typing import List, Optional
from pydantic import ConfigDict, BaseModel, Field
from typing import Union


class UpperBoundOnly(BaseModel):
    description: Optional[str]
    upper_bound_value: float


class LowerBoundOnly(BaseModel):
    description: Optional[str]
    lower_bound_value: float


class UpperAndLowerBound(BaseModel):
    description: Optional[str]
    upper_bound_value: float
    lower_bound_value: float


class PositiveOrNegative(BaseModel):
    description: Optional[str]
    normal_value: str


class NormalValueByGender(BaseModel):
    description: Optional[str]
    male_normal_value_type: Union[
        UpperAndLowerBound, UpperBoundOnly, LowerBoundOnly, PositiveOrNegative
    ]
    female_normal_value_type: Union[
        UpperAndLowerBound, UpperBoundOnly, LowerBoundOnly, PositiveOrNegative
    ]


class Lab_test_type(BaseModel):
    lab_test_id: Optional[str] = Field(default=None)
    nssf_id: int = Field(...)
    lab_test_category_id: str = Field(...)
    lab_test_category_name: Optional[str] = Field(default=None)
    name: str = Field(...)
    unit: str = Field(...)
    price: int = Field(...)
    normal_value_list: List[
        Union[
            NormalValueByGender,
            UpperBoundOnly,
            LowerBoundOnly,
            UpperAndLowerBound,
            PositiveOrNegative,
        ]
    ]

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "nssf_id": 8000,
                "lab_test_category_id": "68573ff6389dfecf5abc2638",
                "name": "FBS",
                "unit": "mg/dL",
                "price": 10,
            }
        },
    )


class update_Lab_test_type_model(BaseModel):
    nssf_id: Optional[int] = None
    lab_test_category_id: Optional[str] = None
    lab_test_category_name: Optional[str] = Field(default=None)
    name: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[int] = None
    normal_value_list: Optional[
        List[
            Union[
                NormalValueByGender,
                UpperBoundOnly,
                LowerBoundOnly,
                UpperAndLowerBound,
                PositiveOrNegative,
            ]
        ]
    ]

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "nssf_id": 9002,
                "lab_test_category_id": "68573ff6389dfecf5abc2638",
                "name": "FBS",
                "unit": "mg/dL",
                "price": 10,
            }
        },
    )
