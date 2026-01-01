from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Session(BaseModel):
    user_id: str = Field(...)
    role: Literal["admin", "patient"] = Field(...)
    refresh_hash: str = Field(...)
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime = Field(...)
    revoked: bool = Field(...)


class update_session(BaseModel):
    insurance_company_name: Optional[str] = None
    rate: Optional[float] = None
    currency: str = Field(...)
