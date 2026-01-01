from typing import Optional
from pydantic import ConfigDict, BaseModel, Field, model_validator
from datetime import datetime
from ..schemas.schema_Patient import Patient
from typing import List
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from ..schemas.schema_Lab_Panel import Lab_Panel


class Visit(BaseModel):
    patient_id: str
    visit_date: datetime = Field(...)
    posted: bool = Field(default=False)
    report_date: datetime | None = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "682f96b6b102ec8900f41b2a",
                "visit_date": "1995-01-15T00:00:00",
            }
        },
    )

    @model_validator(mode="before")
    def set_report_date(cls, values):
        if values.get("report_date") is None and values.get("visit_date") is not None:
            values["report_date"] = values["visit_date"]
        return values


class VisitData(BaseModel):
    visit_id: str
    posted: bool
    visit_date: datetime
    report_date: datetime
    patient: Patient
    completed_tests_results: int
    total_tests_results: int
    total_price: float
    total_price_with_insurance: float
    insurance_company_name: str
    currency: str


class visitInvoice(BaseModel):
    invoice_number: int
    listOfTests: List[Lab_test_type]
    listOfPanels: List[Lab_Panel]
    totalPrice: float
    patient: Patient
    visit_date: datetime
    patient_insurance_company_rate: float


class PaginatedVisitDataList(BaseModel):
    visitsData: List[VisitData]
    TotalNumberOfVisits: int
    total_pages: int


class update_visit_model(BaseModel):
    visit_date: Optional[datetime] = None
    report_date: Optional[datetime] = None
    posted: Optional[bool] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "682b24bc66676a3a442db2f5",
                "visit_date": "1995-01-15T00:00:00",
            }
        },
    )
