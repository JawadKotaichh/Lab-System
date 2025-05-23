from typing import Optional
from pydantic import ConfigDict, BaseModel, Field
from datetime import datetime

from beanie import PydanticObjectId



class Visit(BaseModel):
    patient_id: PydanticObjectId
    date: datetime = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "6829e34cf35023046f4b5c00",
                "date": datetime(1995, 1, 15),
            }
        },
    )


class update_visit_model(BaseModel):
    patient_id: Optional[PydanticObjectId]
    date: datetime = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "682b24bc66676a3a442db2f5",
                "date": datetime(1995, 1, 1),
            }
        },
    )

