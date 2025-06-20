import uvicorn
import asyncio
from fastapi import FastAPI
from src.db import init_db
from src.api.visits import all_visits_router
from src.api.patients import router as patients_router
from src.api.visits import router as visits_router
from src.api.lab_test_results import router as lab_test_results_router
from src.api.lab_test_type import router as lab_test_type_router
from src.api.lab_test_class import router as lab_test_class_router
from src.api.insurance_company import router as insurance_comapny_router
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Lab System API")
add_pagination(app)

app.include_router(patients_router)
app.include_router(visits_router)
app.include_router(lab_test_type_router)
app.include_router(lab_test_results_router)
app.include_router(all_visits_router)
app.include_router(insurance_comapny_router)
app.include_router(lab_test_class_router)

origins = [
   "http://localhost:5173",
    "http://localhost:3000", 
    "http://127.0.0.1:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"]
)

@app.on_event("startup")
async def on_startup():
    await init_db()

if __name__ == "__main__":
    asyncio.run(on_startup())
    config = uvicorn.Config(app, host="localhost", port=8000, reload=True)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
