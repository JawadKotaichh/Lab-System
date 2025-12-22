from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# from dotenv import load_dotenv
# from pathlib import Path
import os
from .models import (
    Visit,
    Patient,
    lab_test_type,
    lab_test_result,
    insurance_company,
    lab_test_category,
    lab_panel,
    Invoice,
    Result_suggestions,
)

# ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
# # Load root .env so local runs pick up MONGODB_URL without manual exports.
# load_dotenv(ENV_PATH)


async def init_db():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://mongo:27017")
    client = AsyncIOMotorClient(mongodb_url)
    await init_beanie(
        database=client["lab_system"],
        document_models=[
            Visit,
            Patient,
            lab_test_type,
            lab_test_result,
            insurance_company,
            lab_test_category,
            lab_panel,
            Invoice,
            Result_suggestions,
        ],
    )
