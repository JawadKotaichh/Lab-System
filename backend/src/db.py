from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from .models import Visit, Patient, lab_test_type, lab_test_result,insurance_company,lab_test_category,lab_panel

async def init_db():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    await init_beanie(
        database=client["lab_system"],
        document_models=[Visit, Patient, lab_test_type, lab_test_result,insurance_company,lab_test_category,lab_panel],
    )
