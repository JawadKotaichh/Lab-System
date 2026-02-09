from typing import Optional, List
from pydantic import BaseModel, Field
from ..schemas.schema_Patient import Patient
from ..schemas.schema_Lab_Panel import LabPanelResponse
from ..schemas.schema_Lab_Test_Type import Lab_test_type
from datetime import datetime


class LabTestChanged(BaseModel):
    lab_test_id: str
    new_price: float


class LabPanelChanged(BaseModel):
    panel_id: str
    new_price: float


class Invoice(BaseModel):
    invoice_number: int = Field(...)
    list_of_tests: List[Lab_test_type] = Field(...)
    list_of_lab_panels: List[LabPanelResponse] = Field(...)
    visit_id: str = Field(...)
    visit_date: datetime = Field(...)
    patient_insurance_company_rate: float = Field(...)
    adjustment_minor: float = Field(default=0.0)
    insurance_company_id: str = Field(...)
    total_paid: float = Field(...)
    list_of_lab_tests_ids_changed: List[LabTestChanged] = Field(default=[])
    list_of_lab_panels_ids_changed: List[LabPanelChanged] = Field(default=[])


class invoiceData(BaseModel):
    patient: Patient
    invoice_data: Invoice
    currency: str


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
    adjustment_minor: Optional[float] = None
    insurance_company_id: Optional[str] = None
    total_paid: Optional[float] = None
    list_of_lab_tests_ids_changed: Optional[List[LabTestChanged]] = None
    list_of_lab_panels_ids_changed: Optional[List[LabPanelChanged]] = None
