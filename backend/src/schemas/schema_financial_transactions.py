from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class financial_transaction(BaseModel):
    type: str = Field(...)
    date: datetime = Field(...)
    amount: float = Field(...)
    currency: str = Field(...)
    description: str = Field(default="")
    category: str = Field(...)
    visit_id: Optional[str] = None


class update_financial_transaction(BaseModel):
    type: Optional[str] = None
    date: Optional[datetime] = None
    amount: Optional[float] = None
    currency: Optional[float] = None
    description: Optional[float] = None
    category: Optional[float] = None
    visit_id: Optional[str] = None
