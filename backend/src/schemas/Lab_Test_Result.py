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


class Lab_test_result(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    lab_test_type_id: PyObjectId = Field(
        ..., description="Which test type this result refers to"
    )
    visit_id: PyObjectId = Field(..., description="Which visit this result belongs to")
    result: str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "682b2fb189e933f09cbcb489",
                "visit_id": "607c191e810c19729de860ec",
                "result": "Positive",
            }
        },
    )


class update_lab_test_result_model(BaseModel):
    lab_test_type_id: Optional[PyObjectId] = None
    result: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_id": "682b2fb189e933f09cbcb489",
                "result": "Negative",
            }
        },
    )


class list_lab_test_result(BaseModel):
    test_results: list[Lab_test_result] = Field(...)
    model_config = ConfigDict(populate_by_name=True)
