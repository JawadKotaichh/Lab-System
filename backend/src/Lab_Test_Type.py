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


class Lab_test_type(BaseModel):
    id:           PyObjectId = Field(default=None, alias="_id") 
    nssf_id:      int=Field(...)
    name:         str=Field(...)
    unit:         str=Field(...)
    price:        int=Field(...)
    lower_bound:  str=Field(...)
    upper_bound:  str=Field(...)

    model_config = ConfigDict(
        populate_by_name= True,
        arbitrary_types_allowed=True,
        json_schema_extra={
             "example": {
                "_id":         "607c191e810c19729de860ee",
                "nssf_id":     8000,
                "name":        "FBS",
                "unit":        "mg/dL",
                "price":       10,
                "lower_bound": "70",
                "upper_bound": "110"
            }
        },
    )

class update_Lab_test_type(BaseModel):
    nssf_id:     Optional[int]    = None
    name:        Optional[str]    = None
    unit:        Optional[str]    = None
    price:       Optional[int]    = None
    lower_bound: Optional[str]    = None
    upper_bound: Optional[str]    = None

    model_config = ConfigDict(
        populate_by_name= True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "price": 12
            }
        },
    )
class list_Lab_test_type(BaseModel):
    list_all_tests: list[Lab_test_type] = Field(...)
    model_config = ConfigDict(populate_by_name=True)