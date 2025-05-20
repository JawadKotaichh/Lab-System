from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .. import schemas, models, database

router = APIRouter(prefix="/patients", tags=["patients"])
