from datetime import datetime, time
from fastapi import APIRouter, HTTPException, status
from ..models import Financial_transaction as DBfinancial_transaction
from ..schemas.schema_financial_transactions import (
    financial_transaction,
    update_financial_transaction,
)
from fastapi.responses import Response
from typing import Any, Dict, List, Optional
from math import ceil
from fastapi import Query
from beanie import PydanticObjectId

router = APIRouter(prefix="/financial_transaction", tags=["financial_transactions"])


@router.get("/page/{page_size}/{page_number}", response_model=Dict[str, Any])
async def get_financial_transaction_with_page_size(
    page_number: int,
    page_size: int,
    type: str | None = Query(None),
    category: str | None = Query(None),
    currency: str | None = Query(None),
    start_date: Optional[str] = Query(
        None, description="Filter financial transactions by date prefix YYYY-MM-DD"
    ),
    end_date: Optional[str] = Query(
        None, description="Filter financial transactions by date prefix YYYY-MM-DD"
    ),
):
    offset = (page_number - 1) * page_size
    mongo_filter: dict[str, Any] = {}
    if type:
        mongo_filter["type"] = {
            "$regex": type,
            "$options": "i",
        }

    if category:
        mongo_filter["category"] = {
            "$regex": category,
            "$options": "i",
        }
    if currency:
        mongo_filter["currency"] = {
            "$regex": currency,
            "$options": "i",
        }
    start_dt = end_dt = None

    if start_date:
        try:
            parsed = datetime.strptime(start_date, "%Y-%m-%d").date()
            start_dt = datetime.combine(parsed, time.min)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid start_date. Use YYYY-MM-DD"
            )

    if end_date:
        try:
            parsed = datetime.strptime(end_date, "%Y-%m-%d").date()
            end_dt = datetime.combine(parsed, time.max)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid end_date. Use YYYY-MM-DD"
            )

    if start_dt and end_dt:
        mongo_filter["date"] = {"$gte": start_dt, "$lte": end_dt}
    elif start_dt:
        mongo_filter["date"] = {
            "$gte": start_dt,
            "$lte": datetime.combine(start_dt.date(), time.max),
        }
    elif end_dt:
        mongo_filter["date"] = {
            "$gte": datetime.combine(end_dt.date(), time.min),
            "$lte": end_dt,
        }
    mongo_filter["amount"] = {"$gt": 0}
    total_number_of_financial_transactions = await DBfinancial_transaction.find(
        mongo_filter
    ).count()
    cursor = DBfinancial_transaction.find(mongo_filter).skip(offset).limit(page_size)
    financial_transactions: List[financial_transaction] = []
    async for current_financial_transaction in cursor:
        financial_transactions.append(
            financial_transaction(
                type=current_financial_transaction.type,
                currency=current_financial_transaction.currency,
                date=current_financial_transaction.date,
                amount=current_financial_transaction.amount,
                description=current_financial_transaction.description,
                category=current_financial_transaction.category,
                visit_id=str(current_financial_transaction.visit_id),
            )
        )

    total_pages = ceil(total_number_of_financial_transactions / page_size)
    result = {
        "TotalNumberOfFinancialTransactions": total_number_of_financial_transactions,
        "total_pages": total_pages,
        "financial_transactions": financial_transactions,
    }
    return result


@router.post(
    "/",
    response_model=DBfinancial_transaction,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new financial_transaction",
)
async def create_financial_transaction(data: financial_transaction):
    if data.visit_id is not None:
        db_financial_transaction = DBfinancial_transaction(
            type=data.type,
            currency=data.currency,
            date=data.date,
            amount=data.amount,
            description=data.description,
            category=data.category,
            visit_id=PydanticObjectId(data.visit_id),
        )
    else:
        db_financial_transaction = DBfinancial_transaction(
            type=data.type,
            currency=data.currency,
            date=data.date,
            amount=data.amount,
            description=data.description,
            category=data.category,
        )
    new_financial_transaction = await db_financial_transaction.insert()
    if not new_financial_transaction:
        raise HTTPException(
            status_code=404, detail="financial_transaction was not created"
        )
    return new_financial_transaction


@router.get("/all", response_model=List[Dict[str, Any]])
async def getAllFinancialTransactions() -> List[Dict[str, Any]]:
    cursor = DBfinancial_transaction.find()
    all_financial_transactions: List[Dict[str, Any]] = []
    async for element in cursor:
        all_financial_transactions.append(
            {
                "id": str(element.id),
                "type": element.type,
                "date": element.date,
                "amount": element.amount,
                "currency": element.currency,
                "description": element.description,
                "category": element.category,
            }
        )
    return all_financial_transactions


@router.get("/{financial_transaction_id}", response_model=financial_transaction)
async def get_financial_transaction(financial_transaction_id: str):
    if not PydanticObjectId.is_valid(financial_transaction_id):
        raise HTTPException(400, "Invalid financial_transaction ID")
    existing_financial_transaction = await DBfinancial_transaction.get(
        PydanticObjectId(financial_transaction_id)
    )

    if not existing_financial_transaction:
        raise HTTPException(
            404, f"financial_transaction {financial_transaction_id} not found"
        )
    if existing_financial_transaction.visit_id is not None:
        output = financial_transaction(
            type=existing_financial_transaction.type,
            currency=existing_financial_transaction.currency,
            date=existing_financial_transaction.date,
            amount=existing_financial_transaction.amount,
            description=existing_financial_transaction.description,
            category=existing_financial_transaction.category,
            visit_id=str(existing_financial_transaction.visit_id),
        )
    else:
        output = financial_transaction(
            type=existing_financial_transaction.type,
            currency=existing_financial_transaction.currency,
            date=existing_financial_transaction.date,
            amount=existing_financial_transaction.amount,
            description=existing_financial_transaction.description,
            category=existing_financial_transaction.category,
        )

    return output


@router.put("/{financial_transaction_id}", response_model=DBfinancial_transaction)
async def update_the_financial_transaction(
    financial_transaction_id: str, update_data: update_financial_transaction
):
    if not PydanticObjectId.is_valid(financial_transaction_id):
        raise HTTPException(400, "Invalid financial_transaction ID")

    existing_financial_transaction = await DBfinancial_transaction.find_one(
        DBfinancial_transaction.id == PydanticObjectId(financial_transaction_id)
    )
    if existing_financial_transaction is None:
        raise HTTPException(
            404, f"financial_transaction {financial_transaction_id} not found"
        )

    if update_data.type is not None:
        existing_financial_transaction.type = update_data.type
    if update_data.currency is not None:
        existing_financial_transaction.currency = update_data.currency
    if update_data.amount is not None:
        existing_financial_transaction.amount = update_data.amount
    if update_data.description is not None:
        existing_financial_transaction.description = update_data.description
    if update_data.category is not None:
        existing_financial_transaction.category = update_data.category
    if update_data.date is not None:
        existing_financial_transaction.date = update_data.date

    await existing_financial_transaction.replace()

    return existing_financial_transaction


@router.delete("/{financial_transaction_id}", response_class=Response)
async def delete_financial_transaction(financial_transaction_id: str):
    if not PydanticObjectId.is_valid(financial_transaction_id):
        raise HTTPException(400, "Invalid financial_transaction ID")
    financial_transaction_to_be_deleted = await DBfinancial_transaction.find_one(
        DBfinancial_transaction.id == PydanticObjectId(financial_transaction_id)
    )
    if financial_transaction_to_be_deleted is None:
        raise HTTPException(
            404, f"financial transaction {financial_transaction_id} not found"
        )
    await financial_transaction_to_be_deleted.delete()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
