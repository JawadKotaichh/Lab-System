from pydantic import BaseModel, Field


class Admin(BaseModel):
    username: str = Field(...)
    password_hashed: str = Field(...)
    is_active: bool = Field(...)


class login_admin_data(BaseModel):
    username: str = Field(...)
    password: str = Field(...)
