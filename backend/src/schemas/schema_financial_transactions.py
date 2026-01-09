from typing import Dict, List, Optional
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
    currency: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    visit_id: Optional[str] = None


class financial_transaction_with_id(BaseModel):
    id: str = Field(...)
    type: str = Field(...)
    date: datetime = Field(...)
    amount: float = Field(...)
    currency: str = Field(...)
    description: str = Field(default="")
    category: str = Field(...)
    visit_id: Optional[str] = None


class financial_transaction_summary(BaseModel):
    type: Optional[str] = None
    by_currency: Dict[str, Dict[str, List[financial_transaction_with_id]]] = Field(
        default_factory=dict
    )
