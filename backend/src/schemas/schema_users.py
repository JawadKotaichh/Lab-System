from typing import Optional
from pydantic import BaseModel, Field


class User(BaseModel):
    user_id: str = Field(...)
    username: str = Field(...)
    password: str = Field(...)


class login_data(BaseModel):
    username: str = Field(...)
    password: str = Field(...)


class update_user(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
