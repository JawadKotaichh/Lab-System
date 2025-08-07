from typing import Optional, List
from pydantic import ConfigDict, BaseModel, Field

from ..schemas.schema_Patient import Patient
from ..schemas.schema_Lab_Panel import LabPanelResponse
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from datetime import datetime


class Invoice(BaseModel):
    list_of_tests: List[Lab_test_type] = Field(...)
    list_of_lab_panels: List[LabPanelResponse] = Field(...)
    visit_id: str = Field(...)
    visit_date: datetime = Field(...)
    patient_insurance_company_rate: float = Field(...)
    # total_price_with_insurance: float = Field(...)
    # total_without_insurance: float = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        # json_schema_extra={
        #     "example": {
        #         "insurance_company_name": "Bankers",
        #         "rate": 0.2,
        #     }
        # },
    )


class invoiceData(BaseModel):
    patient: Patient
    invoice_data: Invoice


class update_invoice(BaseModel):
    list_of_tests: Optional[List[Lab_test_type]] = None
    list_of_lab_panels: Optional[List[LabPanelResponse]] = None
    visit_id: Optional[str] = None
    visit_date: Optional[datetime] = None
    patient_insurance_company_rate: Optional[float] = None
    # total_price_with_insurance: Optional[float] = None
    # total_without_insurance: Optional[float] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {"insurance_company_name": "Bankers", "rate": 0.2}
        },
    )
