from typing import Optional
from pydantic import ConfigDict, BaseModel, Field



class Insurance_company(BaseModel):
    insurance_company_name: str = Field(...)
    rate:str = Field(...)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "insurance_company_name": "Bankers",
                "rate": "0.2",
            }
        },
    )


class update_insurance_company(BaseModel):
    """
    A set of optional updates to be made to a document in the database.
    """
    insurance_company_name: Optional[str] = None
    rate: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "insurance_company_name": "Bankers",
                "rate": "0.2"
            }
        },
    )
