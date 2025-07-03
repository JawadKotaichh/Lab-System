from typing import Optional, List
from pydantic import ConfigDict, BaseModel, Field
from beanie import PydanticObjectId


class Lab_Panel(BaseModel):
    panel_name: str = Field(...)
    list_of_test_type_ids : List[PydanticObjectId] = Field(...)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "panel_name": "CBCD",
                "list_of_test_type_ids":["",""]
            }
        },
    )


class update_Lab_Panel_model(BaseModel):
    panel_name:  Optional[str] = None
    list_of_test_type_ids : Optional[List[PydanticObjectId]] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
               "panel_name": "CBCD",
                "list_of_test_type_ids":["",""]
            }
        },
    )


