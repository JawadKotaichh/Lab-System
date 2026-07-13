from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .settings import settings
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
    Admin,
    User,
    Session,
    Financial_transaction,
)

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
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
            Admin,
            User,
            Session,
            Financial_transaction,
        ],
    )
