from typing import Optional, List
from pydantic import BaseModel, Field
from ..schemas.schema_Patient import Patient
from ..schemas.schema_Lab_Panel import LabPanelResponse
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from datetime import datetime


class Invoice(BaseModel):
    invoice_number: int = Field(...)
    list_of_tests: List[Lab_test_type] = Field(...)
    list_of_lab_panels: List[LabPanelResponse] = Field(...)
    visit_id: str = Field(...)
    visit_date: datetime = Field(...)
    patient_insurance_company_rate: float = Field(...)
    discount_percentage: float = Field(...)
    insurance_company_id: str = Field(...)


class invoiceData(BaseModel):
    patient: Patient
    invoice_data: Invoice


class monthlySummaryInvoicesParams(BaseModel):
    insurance_company_id: str
    start_date: datetime
    end_date: datetime


class update_invoice(BaseModel):
    list_of_tests: Optional[List[Lab_test_type]] = None
    list_of_lab_panels: Optional[List[LabPanelResponse]] = None
    visit_id: Optional[str] = None
    visit_date: Optional[datetime] = None
    patient_insurance_company_rate: Optional[float] = None
    discount_percentage: Optional[float] = None
    insurance_company_id: Optional[str] = None
