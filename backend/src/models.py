from datetime import datetime, timezone
from pydantic import Field
from typing import List, Literal

from beanie import Document, PydanticObjectId

from typing import Union

from pymongo import IndexModel

from .schemas.schema_Lab_Test_Type import (
    NormalValueByGender,
    PositiveOrNegative,
    UpperAndLowerBound,
    UpperBoundOnly,
    DescriptionOnly,
    LowerBoundOnly,
)

from .schemas.schema_Lab_Panel import LabPanelResponse


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Visit(Document):
    patient_id: PydanticObjectId = Field(...)
    posted: bool = Field(...)
    visit_date: datetime = Field(...)
    report_date: datetime = Field(...)

    class Settings:
        name = "visits"


class Patient(Document):
    name: str = Field(...)
    gender: str = Field(...)
    DOB: datetime = Field(...)
    phone_number: str = Field(...)
    insurance_company_id: PydanticObjectId = Field(...)

    class Settings:
        name = "patients"


class Admin(Document):
    username: str = Field(...)
    password_hashed: str = Field(...)
    is_active: bool = Field(...)

    class Settings:
        name = "admins"


class User(Document):
    user_id: PydanticObjectId = Field(...)
    username: str = Field(...)
    password_hashed: str = Field(...)

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("user_id", 1)], unique=True),
        ]


class Session(Document):
    user_id: PydanticObjectId = Field(...)
    role: Literal["admin", "patient"] = Field(...)
    refresh_hash: str = Field(...)
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime = Field(...)
    revoked: bool = Field(...)

    class Settings:
        name = "sessions"


class lab_test_type(Document):
    nssf_id: int = Field(...)
    lab_test_category_id: PydanticObjectId = Field(...)
    name: str = Field(...)
    unit: str = Field(...)
    price: int = Field(...)
    normal_value_list: List[
        Union[
            DescriptionOnly,
            NormalValueByGender,
            UpperBoundOnly,
            LowerBoundOnly,
            UpperAndLowerBound,
            PositiveOrNegative,
        ]
    ]
    # lower_bound: Union[str, float] = Field(...)
    # upper_bound: Union[str, float] = Field(...)

    class Settings:
        name = "lab_test_type"


class lab_test_result(Document):
    lab_test_type_id: PydanticObjectId = Field(...)
    visit_id: PydanticObjectId = Field(...)
    result: str = Field(...)
    lab_panel_id: PydanticObjectId | None = None

    class Settings:
        name = "lab_tests_results"


class insurance_company(Document):
    insurance_company_name: str = Field(...)
    rate: float = Field(...)
    currency: str = Field(...)

    class Settings:
        name = "insurance_company"


class lab_test_category(Document):
    lab_test_category_name: str = Field(...)

    class Settings:
        name = "lab_test_category"


class lab_panel(Document):
    nssf_id: int = Field(...)
    panel_name: str = Field(...)
    lab_panel_price: float = Field(...)
    lab_panel_category_id: PydanticObjectId = Field(...)
    list_of_test_type_ids: List[PydanticObjectId] = Field(...)

    class Settings:
        name = "lab_panel"


class Result_suggestions(Document):
    lab_test_type_id: str = Field(...)
    value: str = Field(...)
    use_count: int = Field(...)

    class Settings:
        name = "result_suggestions"


class Invoice(Document):
    invoice_number: int = Field(...)
    list_of_tests: List[lab_test_type] = Field(...)
    list_of_lab_panels: List[LabPanelResponse] = Field(...)
    visit_id: PydanticObjectId = Field(...)
    visit_date: datetime = Field(...)
    discount_percentage: float = Field(...)
    insurance_company_id: PydanticObjectId = Field(...)
    total_paid: int = Field(default=0)

    # total_price_with_insurance: float = Field(...)
    # total_without_insurance: float = Field(...)
