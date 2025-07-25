from datetime import datetime
from pydantic import Field
from typing import List, Optional

# TODO: take the database name from env variables

from beanie import Document, PydanticObjectId

from typing import Union


class Visit(Document):
    patient_id: PydanticObjectId = Field(...)
    date: datetime = Field(...)

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


class lab_test_type(Document):
    nssf_id: int = Field(...)
    lab_test_category_id: PydanticObjectId = Field(...)
    name: str = Field(...)
    unit: str = Field(...)
    price: int = Field(...)
    lower_bound: Union[str, float] = Field(...)
    upper_bound: Union[str, float] = Field(...)

    class Settings:
        name = "lab_test_type"


class lab_test_result(Document):
    lab_test_type_id: PydanticObjectId = Field(...)
    visit_id: PydanticObjectId = Field(...)
    result: str = Field(...)
    lab_panel_name: Optional[str] = None

    class Settings:
        name = "lab_tests_results"


class insurance_company(Document):
    insurance_company_name: str = Field(...)
    rate: float = Field(...)

    class Settings:
        name = "insurance_company"


class lab_test_category(Document):
    lab_test_category_name: str = Field(...)

    class Settings:
        name = "lab_test_category"


class lab_panel(Document):
    panel_name: str = Field(...)
    list_of_test_type_ids: List[PydanticObjectId] = Field(...)

    class Settings:
        name = "lab_panel"
