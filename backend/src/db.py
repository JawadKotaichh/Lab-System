from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from backend.src.models import Visit, Patient, lab_test_type, lab_test_result

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
MONGODB_DB = os.getenv("MONGODB_DB_NAME", "lab_system")


async def init_db():
    client = AsyncIOMotorClient(MONGODB_URI)
    await init_beanie(
        database=client[MONGODB_DB],
        document_models=[Visit, Patient, lab_test_result, lab_test_type],
    )
