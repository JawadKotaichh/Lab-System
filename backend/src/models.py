from datetime import datetime
from pydantic import Field

# TODO: take the database name from env variables

from beanie import Document,PydanticObjectId


class Visit(Document):
    patient_id: PydanticObjectId = Field(...)
    date: datetime = Field(...)

    class Settings:
        name = "visits"


class Patient(Document):
    name: str = Field(...)
    gender: str = Field(...)
    DOB: datetime = Field(...)
    phone_number: int = Field(...)

    class Settings:
        name = "patients"


class lab_test_type(Document):
    nssf_id: int = Field(...)
    name: str = Field(...)
    unit: str = Field(...)
    price: int = Field(...)
    lower_bound: str = Field(...)
    upper_bound: str = Field(...)

    class Settings:
        name = "lab_test_type"


class lab_test_result(Document):
    lab_test_type_id: PydanticObjectId = Field(...)
    visit_id: PydanticObjectId = Field(...)
    result: str = Field(...)

    class Settings:
        name = "lab_tests_results"
