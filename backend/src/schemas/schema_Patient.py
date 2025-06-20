from typing import Optional
from pydantic import ConfigDict, BaseModel, Field
from datetime import datetime



class Patient(BaseModel):
    name: str = Field(...)
    gender: str = Field(...)
    DOB: datetime = Field(...)
    phone_number: str = Field(...)
    insurance_company_id : str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Jawad Kotaich",
                "gender": "Male",
                "DOB": "1995-01-15T00:00:00",
                "phone_number": "12345678",
                "insurance_company_id" :"684e9e724cd8de425cec0af7",
            }
        },
    )


class update_patient_model(BaseModel):
    """
    A set of optional updates to be made to a document in the database.
    """

    name: Optional[str] = None
    gender: Optional[str] = None
    DOB: Optional[datetime] = None
    phone_number: Optional[str] = None
    insurance_company_id: Optional[str] = None


    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Jawad Kotaich",
                "gender": "Male",
                "DOB": datetime(1995, 1, 15),
                "phone_number": "02345678",
                "insurance_company_id": "684e9e724cd8de425cec0af7",
            }
        },
    )
