from typing import Optional
from pydantic import ConfigDict, BaseModel, Field
from datetime import datetime
from ..schemas.schema_Patient import Patient
from typing import List


class Visit(BaseModel):
    patient_id: str
    date: datetime = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "682f96b6b102ec8900f41b2a",
                "date": "1995-01-15T00:00:00",
            }
        },
    )


class VisitData(BaseModel):
    visit_id: str
    visit_date: datetime
    patient: Patient
    completed_tests_results: int
    total_tests_results: int
    total_price: float
    total_price_with_insurance: float
    insurance_company_name: str


class PaginatedVisitDataList(BaseModel):
    visitsData: List[VisitData]
    TotalNumberOfVisits: int
    total_pages: int


class update_visit_model(BaseModel):
    patient_id: Optional[str]
    date: datetime = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "682b24bc66676a3a442db2f5",
                "date": "1995-01-15T00:00:00",
            }
        },
    )
