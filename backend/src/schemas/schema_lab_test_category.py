from typing import Optional
from pydantic import ConfigDict, BaseModel, Field



class lab_test_category(BaseModel):
    lab_test_category_name : str = Field(...) 

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_category_name": "Hematology",
            }
        },
    )


class update_lab_test_category(BaseModel):
    """
    A set of optional updates to be made to a document in the database.
    """
    lab_test_category_name: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_category_name": "Hematology",
            }
        },
    )
