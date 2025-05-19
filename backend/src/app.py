import os
from typing import Optional, List
from datetime import date as _date
from fastapi import FastAPI, Body, HTTPException, status
from fastapi.responses import Response
from pydantic import ConfigDict, BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from fastapi.middleware.cors import CORSMiddleware
from typing_extensions import Annotated
from fastapi.staticfiles import StaticFiles
from bson import ObjectId
import motor.motor_asyncio
from pymongo import ReturnDocument
import uvicorn
import sys


from Patient import update_patient_model,Patient,list_patient_collection
from Visit import Visit,update_visit,list_all_visits
from Lab_Test_Result import Lab_test_result,update_Lab_test_result,list_lab_test_result
from Lab_Test_Type import Lab_test_type,update_Lab_test_type,list_Lab_test_type


app = FastAPI (
    title= "Laboratory System",
    summary="Laboratory System for labs"
)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/Lab_System")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client["college"] 

patient_collection = db.get_collection("patients")
visits_collection = db.get_collection("visits")
lab_test_types_collection = db.get_collection("lab_test_types")
lab_test_results_collection = db.get_collection("lab_test_results")

DEBUG = os.environ.get("DEBUG","").strip().lower() in {"1","true","on","yes"}
PyObjectId = Annotated[str, BeforeValidator(str)]



# Patient Functions

@app.post(
    "/patients/",
    response_description="Add new patient",
    response_model=Patient,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_patient(patient: Patient = Body(...)):
    new_patient = await patient_collection.insert_one(patient.model_dump(by_alias=True,exclude=["id"]))
    created_patient = await patient_collection.find_one({"_id":new_patient.inserted_id})
    return created_patient

@app.get(
    "/patients/",
    response_description="List of all patients",
    response_model = list_patient_collection,
    response_model_by_alias=False,
)
async def list_patients():
    return list_patient_collection(patients=await patient_collection.find().to_list(1000))

@app.get(
    "/patients/{pat_id}",
    response_description="Get a single patient",
    response_model = Patient,
    response_model_by_alias=False,
)

async def show_patient(pat_id:str):
    
    patient = await patient_collection.find_one({"_id": ObjectId(pat_id)})
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {pat_id} not found")
    return patient

@app.put(
    "/patients/{pat_id}",
    response_description="Update a patient",
    response_model = Patient,
    response_model_by_alias=False,
)
async def update_patient(pat_id:str,patient:update_patient_model= Body(...)):
    patient = {
        k: v for k, v in patient.model_dump(by_alias=True).items() if v is not None
    }

    if len(patient)>=1:
        update_result = await patient_collection.find_one_and_update(
            {"_id": ObjectId(pat_id)},
            {"$set": patient},
            return_document=ReturnDocument.AFTER,
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404,detail=f"Patient {pat_id} not found")
    
    if(existing_patient := await patient_collection.find_one({"_id":pat_id})) is not None:
        return existing_patient
    
    raise HTTPException(status_code=404,detail=f"Patient {pat_id} not found")



@app.delete("/patients/{pat_id}",response_description="Delete a patient")
async def delete_patient(pat_id:str):
    delete_result = await patient_collection.delete_one({"_id":ObjectId(pat_id)})
    if delete_result.deleted_count == 1:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    raise HTTPException(status_code=404,detail=f"Patient {pat_id} not found")



# Visit Functions

@app.post(
    "/patients/{patient_id}/visits/",
    response_description="Create a new visit for a patient",
    response_model=Visit,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_visit_for_a_patient(patient_id :str, visit : Visit=Body(...)):
    visit_data = visit.model_dump(by_alias=True, exclude={"id"})
    visit_data["patient_id"] = ObjectId(patient_id)
    new_visit = await visits_collection.insert_one(visit_data)
    created_visit = await visits_collection.find_one({"_id":new_visit.inserted_id})
    if not created_visit:
        raise HTTPException(status_code=404, detail="Patient {patient_id} not found")
    return created_visit

@app.get(
    "/patients/{patient_id}/visits/",
    response_description="List of all visits of a patient",
    response_model = list_all_visits,
    response_model_by_alias=False,
)
async def list_all_visits_for_a_patient(patient_id:str):
    patient = await patient_collection.find_one(
        {"_id":ObjectId(patient_id)}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient {patient_id} not found")
    
    docs = await visits_collection.find(
        {"patient_id": ObjectId(patient_id)}
    ).to_list(length=1000)

    return list_all_visits(all_visits=docs)

@app.get(
    "/patients/{patient_id}/visits/{visit_id}",
    response_description="Get a single visit of a patient",
    response_model = Visit,
    response_model_by_alias=False,
)

async def show_visit_for_a_patient(visit_id:str,patient_id:str):
    patient = await patient_collection.find_one(
        {"_id":ObjectId(patient_id)}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient {patient_id} not found")
    
    doc = await visits_collection.find_one(
        {   
            "patient_id": ObjectId(patient_id),
            "_id":ObjectId(visit_id)
        }
    )
    if not doc:
        raise HTTPException(status_code=404, detail=f"Visit {visit_id} not found")
    return doc


@app.put(
    "/patients/{patient_id}/visits/{visit_id}",
    response_description="Update a visit for a patient",
    response_model = Visit,
    response_model_by_alias=False,
)
async def update_a_visit_of_a_patient(visit_id:str,patient_id:str,new_visit:update_visit= Body(...)):
    patient = await patient_collection.find_one(
        {"_id":ObjectId(patient_id)}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient {patient_id} not found")
    
    new_visit = {
        k: v for k, v in new_visit.model_dump(by_alias=True).items() if v is not None and k!="_id"
    }

    if len(new_visit)>=1:
        update_result = await visits_collection.find_one_and_update(
            {"_id": ObjectId(visit_id)},
            {"$set": new_visit},
            return_document=ReturnDocument.AFTER,
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404,detail=f"Visit {visit_id} not found")
    
    if(existing_visit := await visits_collection.find_one({"_id":visit_id})) is not None:
        return existing_visit
    
    raise HTTPException(status_code=404,detail=f"Visit {visit_id} not found")


@app.delete("/patients/{patient_id}/visits/{visit_id}",response_description="Delete a visit for a patient")
async def delete_visit(visit_id:str,patient_id:str):
    patient = await patient_collection.find_one({"_id":ObjectId(patient_id)})
    if not patient:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    delete_result_visit = await visits_collection.delete_one({"_id":ObjectId(visit_id)})
    
    if delete_result_visit.deleted_count == 1:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    
    raise HTTPException(status_code=404,detail=f"Visit {visit_id} not found")

# Lab Test Type

@app.post(
    "/lab_test_type/",
    response_description="Add new lab_test_type",
    response_model=Lab_test_type,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_lab_test_type(lab_test: Lab_test_type = Body(...)):
    lab_test_type_data = lab_test.model_dump(by_alias=True,exclude=["id"])
    new_lab_test_type = await lab_test_types_collection.insert_one(lab_test_type_data)
    created_test = await lab_test_types_collection.find_one({"_id":new_lab_test_type.inserted_id})
    return created_test

@app.get(
    "/lab_test_types/",
    response_description="List of all tests types",
    response_model = list_Lab_test_type,
    response_model_by_alias=False,
)
async def list_all_tests():
    return list_Lab_test_type(all_tests=await lab_test_types_collection.find().to_list(1000))

@app.get(
    "/lab_test_type/{test_id}",
    response_description="Get a single test",
    response_model = Lab_test_type,
    response_model_by_alias=False,
)

async def show_test(test_id:str):
    
    test = await lab_test_types_collection.find_one({"_id": ObjectId(test_id)})
    if not test:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found")
    return test

@app.put(
    "/lab_test_type/{test_id}",
    response_description="Update a lab test",
    response_model = Lab_test_type,
    response_model_by_alias=False,
)
async def update_test(test_id:str,updated_test:update_Lab_test_type= Body(...)):
    updated_test = {
        k: v for k, v in updated_test.model_dump(by_alias=True).items() if v is not None
    }

    if len(updated_test)>=1:
        update_result = await lab_test_types_collection.find_one_and_update(
            {"_id": ObjectId(test_id)},
            {"$set": updated_test},
            return_document=ReturnDocument.AFTER,
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404,detail=f"Test {test_id} not found")
    
    if(existing_test := await lab_test_types_collection.find_one({"_id":ObjectId(test_id)})) is not None:
        return existing_test
    
    raise HTTPException(status_code=404,detail=f"Test {test_id} not found")



@app.delete("/lab_test_type/{test_id}",response_description="Delete a test")
async def delete_test(test_id:str):
    delete_result = await lab_test_types_collection.delete_one({"_id":ObjectId(test_id)})
    if delete_result.deleted_count == 1:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    raise HTTPException(status_code=404,detail=f"Test {test_id} not found")




# Lab Test Results Functions

@app.post(
    "/patients/{pat_id}/visits/{visit_id}/lab_test_results/",
    response_description="Add new lab result for a visit of a patient",
    response_model=Lab_test_result,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_lab_test_result_for_a_visit_of_a_patient(pat_id:str,visit_id: str, test_result : Lab_test_result=Body(...)):
    data = test_result.model_dump(by_alias=True, exclude={"id"})
    data["visit_id"]   = ObjectId(visit_id)
    data["patient_id"] = ObjectId(pat_id)
    new_res = await lab_test_results_collection.insert_one(data)
    created = await lab_test_results_collection.find_one({"_id": new_res.inserted_id})
    if not created:
        raise HTTPException(status_code=404, detail=f"Visit {visit_id} not found")
    return created

@app.get(
    "/patients/{pat_id}/visits/{visit_id}/lab_test_results/",
    response_description="List of all test results of a patient in a specific visit",
    response_model = list_lab_test_result,
    response_model_by_alias=False,
)
async def list_all_lab_test_results_for_a_patient_in_a_visit(pat_id:str,visit_id:str):
    visit = await visits_collection.find_one(
        {
            "_id":ObjectId(visit_id),
            "patient_id": ObjectId(pat_id)
        }
    )
    if not visit:
        raise HTTPException(status_code=404, detail="Visit {visit_id} not found for this patient of id {pat_id}")
    
    docs = await lab_test_results_collection.find({"visit_id": ObjectId(visit_id)}).to_list(length=1000)

    return list_lab_test_result(list_of_all_lab_test_result=docs)

@app.get(
    "/patients/{pat_id}/visits/{visit_id}/lab_test_result/{lab_test_id}",
    response_description="Get a single test result for a patient in a specific visit",
    response_model = Lab_test_result,
    response_model_by_alias=False,
)

async def show_a_test_result_for_a_patient_in_a_specific_visit(pat_id:str,visit_id:str,lab_test_id:str):
    result = await lab_test_results_collection.find_one({
        "_id": ObjectId(lab_test_id),
        "visit_id": ObjectId(visit_id),
        "patient_id":ObjectId(pat_id)
    })
    if not result:
        raise HTTPException(status_code=404, detail=f"Lab test result {lab_test_id} not found in visit {visit_id} for patient {pat_id}")
    return result

@app.put(
    "/patients/{pat_id}/visits/{visit_id}/lab_test_result/{lab_test_id}",
    response_description="Update a test result for a patient in a visit",
    response_model = Lab_test_result,
    response_model_by_alias=False,
)
async def update_test_result(pat_id:str,visit_id:str,lab_test_id:str,updated_result:update_Lab_test_result= Body(...)):
    test = await lab_test_results_collection.find_one(
        {
            "_id": ObjectId(lab_test_id),
            "visit_id": ObjectId(visit_id),
            "patient_id":ObjectId(pat_id)
        }
    )
    if not test:
        raise HTTPException(status_code=404, detail="Visit {visit_id} not found for this patient")

    result = {
        k: v for k, v in updated_result.model_dump(by_alias=True).items() if v is not None
    }

    if len(result)>=1:
        update_result = await lab_test_results_collection.find_one_and_update(
            {"_id": ObjectId(lab_test_id)},
            {"$set": result},
            return_document=ReturnDocument.AFTER,
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404,detail=f"Test {lab_test_id} not found")
    
    if(existing_test_result := await lab_test_results_collection.find_one({"_id":lab_test_id})) is not None:
        return existing_test_result
    
    raise HTTPException(status_code=404,detail=f"Test {lab_test_id} not found")



@app.delete("/patients/{pat_id}/visits/{visit_id}/lab_test_result/{lab_test_id}",response_description="Delete a test result for a patient in a specific visit")
async def delete_result_for_patient_in_a_visit(pat_id:str,visit_id:str,lab_test_id:str):
    visit = await visits_collection.find_one(
        {
            "_id":ObjectId(visit_id),
            "patient_id": ObjectId(pat_id)
        }
    )
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found for this patient")

    delete_result = await lab_test_results_collection.delete_one({"_id":ObjectId(lab_test_id)})
    if delete_result.deleted_count == 1:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    raise HTTPException(status_code=404,detail=f"Test {lab_test_id} not found")

def main(argv = sys.argv[1:]):
    try:
        uvicorn.run("app:app",host = "localhost", port = 8000,reload = DEBUG)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()