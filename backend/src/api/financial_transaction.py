from datetime import datetime, time
from fastapi import APIRouter, HTTPException, status
from ..models import Financial_transaction as DBfinancial_transaction
from ..models import Invoice as DBInvoice
from ..models import Patient as DBPatient
from ..models import Visit as DBVisit
from ..models import insurance_company as DBInsurance_company
from ..schemas.schema_financial_transactions import (
    financial_transaction,
    update_financial_transaction,
    financial_transaction_with_id,
)
from fastapi.responses import Response
from typing import Any, Dict, List, Mapping, Optional, Sequence
from math import ceil
from fastapi import Query
from beanie import PydanticObjectId

router = APIRouter(prefix="/financial_transaction", tags=["financial_transactions"])


@router.get("/summary", response_model=List[financial_transaction_with_id])
async def get_financial_transactions_summary(
    type: str | None = Query(None),
    category: str | None = Query(None),
    currency: str | None = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
) -> List[financial_transaction_with_id]:
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

    cursor = DBfinancial_transaction.find(mongo_filter)
    financial_transactions: List[financial_transaction_with_id] = []
    async for current_financial_transaction in cursor:
        financial_transactions.append(
            financial_transaction_with_id(
                id=str(current_financial_transaction.id),
                type=current_financial_transaction.type,
                currency=current_financial_transaction.currency,
                date=current_financial_transaction.date,
                amount=current_financial_transaction.amount,
                description=current_financial_transaction.description,
                category=current_financial_transaction.category,
                visit_id=str(current_financial_transaction.visit_id),
            )
        )

    return financial_transactions


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
    financial_transactions: List[financial_transaction_with_id] = []
    async for current_financial_transaction in cursor:
        financial_transactions.append(
            financial_transaction_with_id(
                id=str(current_financial_transaction.id),
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


@router.get("/get_all_currencies", response_model=List[Dict[str, Any]])
async def getAllFinancialTransactionsCurrencies() -> List[Dict[str, Any]]:
    pipeline: Sequence[Mapping[str, Any]] = [
        {"$sort": {"date": -1}},
        {"$group": {"_id": "$currency", "doc": {"$first": "$$ROOT"}}},
        {"$replaceRoot": {"newRoot": "$doc"}},
    ]
    cursor = DBfinancial_transaction.get_motor_collection().aggregate(pipeline)
    all_financial_transactions_currencies: List[Dict[str, Any]] = []
    async for element in cursor:
        element_id = element.get("_id") or element.get("id")
        all_financial_transactions_currencies.append(
            {
                "id": str(element_id) if element_id is not None else "",
                "currency": element.get("currency"),
            }
        )
    return all_financial_transactions_currencies


@router.get("/get_all_categories", response_model=List[Dict[str, Any]])
async def getAllFinancialTransactionsCategories() -> List[Dict[str, Any]]:
    pipeline: Sequence[Mapping[str, Any]] = [
        {"$sort": {"date": -1}},
        {"$group": {"_id": "$category", "doc": {"$first": "$$ROOT"}}},
        {"$replaceRoot": {"newRoot": "$doc"}},
    ]
    cursor = DBfinancial_transaction.get_motor_collection().aggregate(pipeline)
    all_financial_transactions_categories: List[Dict[str, Any]] = []
    async for element in cursor:
        element_id = element.get("_id") or element.get("id")
        all_financial_transactions_categories.append(
            {
                "id": str(element_id) if element_id is not None else "",
                "category": element.get("category"),
            }
        )
    return all_financial_transactions_categories


@router.get("/get_all_types", response_model=List[Dict[str, Any]])
async def getAllFinancialTransactionsTypes() -> List[Dict[str, Any]]:
    pipeline: Sequence[Mapping[str, Any]] = [
        {"$sort": {"date": -1}},
        {"$group": {"_id": "$type", "doc": {"$first": "$$ROOT"}}},
        {"$replaceRoot": {"newRoot": "$doc"}},
    ]
    cursor = DBfinancial_transaction.get_motor_collection().aggregate(pipeline)
    all_financial_transactions_types: List[Dict[str, Any]] = []
    async for element in cursor:
        element_id = element.get("_id") or element.get("id")
        all_financial_transactions_types.append(
            {
                "id": str(element_id) if element_id is not None else "",
                "type": element.get("type"),
            }
        )
    return all_financial_transactions_types


@router.get("/all", response_model=List[Dict[str, Any]])
async def get_unique_category_financial_transactions() -> List[Dict[str, Any]]:
    pipeline: Sequence[Mapping[str, Any]] = [
        {"$sort": {"date": -1}},
        {"$group": {"_id": "$category", "doc": {"$first": "$$ROOT"}}},
        {"$replaceRoot": {"newRoot": "$doc"}},
    ]

    cursor = DBfinancial_transaction.get_motor_collection().aggregate(pipeline)

    results: List[Dict[str, Any]] = []
    async for element in cursor:
        if element.get("category") != "Visit By System":
            results.append(
                {
                    "type": element.get("type"),
                    "date": element.get("date"),
                    "amount": element.get("amount"),
                    "currency": element.get("currency"),
                    "description": element.get("description"),
                    "category": element.get("category"),
                }
            )
    return results


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


@router.get("/{financial_transaction_id}", response_model=financial_transaction_with_id)
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
        output = financial_transaction_with_id(
            id=str(existing_financial_transaction.id),
            type=existing_financial_transaction.type,
            currency=existing_financial_transaction.currency,
            date=existing_financial_transaction.date,
            amount=existing_financial_transaction.amount,
            description=existing_financial_transaction.description,
            category=existing_financial_transaction.category,
            visit_id=str(existing_financial_transaction.visit_id),
        )
    else:
        output = financial_transaction_with_id(
            id=str(existing_financial_transaction.id),
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

    if (
        update_data.amount is not None
        and existing_financial_transaction.visit_id is not None
    ):
        visit_id = existing_financial_transaction.visit_id
        db_invoice = await DBInvoice.find_one(DBInvoice.visit_id == visit_id)
        db_visit = await DBVisit.get(visit_id)
        if db_invoice and db_visit:
            db_invoice.total_paid = existing_financial_transaction.amount
            db_patient = await DBPatient.find_one(DBPatient.id == db_visit.patient_id)
            db_insurance_company = None
            if db_patient:
                db_insurance_company = await DBInsurance_company.find_one(
                    DBInsurance_company.id == db_patient.insurance_company_id
                )
            if db_insurance_company:
                total_price = 0.0
                for test in db_invoice.list_of_tests:
                    total_price += test.price
                for panel in db_invoice.list_of_lab_panels:
                    total_price += panel.lab_panel_price
                total_price *= db_insurance_company.rate
                total_price += db_invoice.adjustment_minor
                db_visit.posted = db_invoice.total_paid >= total_price
                await db_visit.replace()
            await db_invoice.replace()

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
