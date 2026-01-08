from enum import Enum
from typing import Dict, List, Literal, Optional
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


AnalyticsMode = Literal["daily", "monthly", "yearly", "range"]
GranularityUnit = Literal["hour", "day", "month"]


class KPIModel(BaseModel):
    total_income: float
    total_expense: float
    net: float
    count_income: int
    count_expense: int
    total_count: int


class SeriesPoint(BaseModel):
    bucket: str  # isoformat string (you do bucket = ...isoformat())
    income: float
    expense: float
    net: float
    count_income: int
    count_expense: int


class Currency(str, Enum):
    USD = "USD"
    LBP = "LBP"


class TransactionType(str, Enum):
    Income = "Income"
    Expense = "Expense"


class BreakdownRow(BaseModel):
    key: str  # category name (in your current pipeline)
    type: TransactionType  # "Income" / "Expense"
    total: float
    count: int


class AnalyticsFilters(BaseModel):
    currency: Optional[Currency] = None
    category: Optional[str] = None
    type: Optional[TransactionType] = None
    include_system: bool


class AnalyticsSummaryResponse(BaseModel):
    # top-level
    mode: AnalyticsMode
    start_dt: str
    end_dt_exclusive: str
    unit: GranularityUnit
    tz: str
    filters: AnalyticsFilters

    # multi-currency blocks
    kpis_by_currency: Dict[Currency, KPIModel]
    series_by_currency: Dict[Currency, List[SeriesPoint]]
    by_category_by_currency: Dict[Currency, List[BreakdownRow]]

    # convenience flat blocks (only present when `currency` query param is provided)
    kpis: Optional[KPIModel] = None
    series: Optional[List[SeriesPoint]] = None
    by_category: Optional[List[BreakdownRow]] = None


class AnalyticsAvailableYearsResponse(BaseModel):
    years: List[int]
    min: Optional[str] = None
    max: Optional[str] = None
