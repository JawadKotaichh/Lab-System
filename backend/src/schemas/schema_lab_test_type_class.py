from typing import Optional
from pydantic import ConfigDict, BaseModel, Field



class Lab_Test_Type_Class(BaseModel):
    lab_test_type_class_name : str = Field(...) 

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_class_name": "Hematology",
            }
        },
    )


class update_lab_test_type_class(BaseModel):
    """
    A set of optional updates to be made to a document in the database.
    """
    lab_test_type_class_name: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "lab_test_type_class_name": "Hematology",
            }
        },
    )
