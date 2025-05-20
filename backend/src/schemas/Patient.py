import os
from typing import Optional, List
from datetime import date as _date
from fastapi import FastAPI, Body, HTTPException, status
from fastapi.responses import Response
from pydantic import ConfigDict, BaseModel, Field, EmailStr
from pydantic.functional_validators import BeforeValidator
from fastapi.middleware.cors import CORSMiddleware
from typing_extensions import Annotated
from fastapi.staticfiles import StaticFiles
from bson import ObjectId
import motor.motor_asyncio
from pymongo import ReturnDocument


PyObjectId = Annotated[str, BeforeValidator(str)]


class Patient(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    name: str = Field(...)
    gender: str = Field(...)
    DOB: str = Field(...)
    phone_number: int = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Jawad Kotaich",
                "gender": "Male",
                "DOB": "1995-05-16",
                "phone_number": "12345678",
            }
        },
    )


class update_patient_model(BaseModel):
    """
    A set of optional updates to be made to a document in the database.
    """

    id: PyObjectId = Field(None, alias="_id")
    name: Optional[str] = None
    gender: Optional[str] = None
    DOB: Optional[str] = None
    phone_number: Optional[int] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Jawad Kotaich",
                "gender": "Male",
                "DOB": "1995-05-16",
                "phone_number": "12345678",
            }
        },
    )


class list_patient_collection(BaseModel):
    """
    A container holding a list of `Patient` instances.
    """

    patients: List[Patient]
