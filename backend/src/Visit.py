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
from datetime import datetime
from pymongo import ReturnDocument

from Lab_Test_Result import Lab_test_result,update_Lab_test_result


PyObjectId = Annotated[str, BeforeValidator(str)]

class Visit(BaseModel):
    id: PyObjectId = Field(None, alias="_id")
    patient_id: PyObjectId
    date: datetime=Field(...)

    model_config = ConfigDict(
        populate_by_name= True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "6829e34cf35023046f4b5c00",
                "date": datetime(1995,1,15),        
            }
        },
    )

class update_visit(BaseModel):
    id: PyObjectId = Field(None, alias="_id")
    patient_id: Optional[PyObjectId]
    date: datetime=Field(...)

    model_config = ConfigDict(
        populate_by_name= True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "682b24bc66676a3a442db2f5",
                "date": datetime(1995,1,1),        
            }
        },
    )

class list_all_visits(BaseModel):
    all_visits : List[Visit]
