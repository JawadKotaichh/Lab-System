from datetime import datetime, time, timedelta
from fastapi import APIRouter, HTTPException, status
from ..models import Financial_transaction as DBfinancial_transaction
from ..models import Invoice as DBInvoice
from ..models import Patient as DBPatient
from ..models import Visit as DBVisit
from ..models import insurance_company as DBInsurance_company
from ..schemas.schema_financial_transactions import (
    AnalyticsAvailableYearsResponse,
    AnalyticsFilters,
    AnalyticsMode,
    AnalyticsSummaryResponse,
    BreakdownRow,
    Currency,
    GranularityUnit,
    KPIModel,
    SeriesPoint,
    TransactionType,
    financial_transaction,
    update_financial_transaction,
    financial_transaction_with_id,
)
from fastapi.responses import Response
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple, cast
from math import ceil
from fastapi import Query
from beanie import PydanticObjectId

router = APIRouter(prefix="/financial_transaction", tags=["financial_transactions"])

ALLOWED_CURRENCIES = {"USD", "LBP"}
ALLOWED_TYPES = {"Income", "Expense"}


def _parse_ymd(s: str):
    return datetime.strptime(s, "%Y-%m-%d").date()


def _build_range_and_unit(
    mode: str,
    day: Optional[str],
    month: Optional[str],
    year: Optional[int],
    start_date: Optional[str],
    end_date: Optional[str],
    granularity: Optional[str],
) -> Tuple[datetime, datetime, str]:
    mode = mode.lower()

    if mode == "daily":
        if not day:
            raise HTTPException(400, "day is required for mode=daily (YYYY-MM-DD)")
        d = _parse_ymd(day)
        start_dt = datetime.combine(d, time.min)
        end_excl = start_dt + timedelta(days=1)
        unit = "hour"

    elif mode == "monthly":
        if not month:
            raise HTTPException(400, "month is required for mode=monthly (YYYY-MM)")
        y, m = map(int, month.split("-"))
        start_dt = datetime(y, m, 1, 0, 0, 0)
        end_excl = (
            datetime(y + 1, 1, 1, 0, 0, 0)
            if m == 12
            else datetime(y, m + 1, 1, 0, 0, 0)
        )
        unit = "day"

    elif mode == "yearly":
        if not year:
            raise HTTPException(400, "year is required for mode=yearly")
        start_dt = datetime(year, 1, 1, 0, 0, 0)
        end_excl = datetime(year + 1, 1, 1, 0, 0, 0)
        unit = "month"

    elif mode == "range":
        if not start_date or not end_date:
            raise HTTPException(
                400, "start_date and end_date are required for mode=range"
            )
        sd = _parse_ymd(start_date)
        ed = _parse_ymd(end_date)
        start_dt = datetime.combine(sd, time.min)
        end_excl = datetime.combine(ed + timedelta(days=1), time.min)

        days = (ed - sd).days + 1
        unit = "hour" if days <= 2 else ("day" if days <= 90 else "month")
    else:
        raise HTTPException(400, "mode must be one of: daily, monthly, yearly, range")

    if granularity:
        granularity = granularity.lower()
        if granularity not in ("hour", "day", "month"):
            raise HTTPException(400, "granularity must be one of: hour, day, month")
        unit = granularity

    return start_dt, end_excl, unit


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
async def financial_analytics_summary(
    mode: AnalyticsMode = Query(..., description="daily|monthly|yearly|range"),
    day: Optional[str] = Query(None, description="YYYY-MM-DD (for daily)"),
    month: Optional[str] = Query(None, description="YYYY-MM (for monthly)"),
    year: Optional[int] = Query(None, description="YYYY (for yearly)"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD (for range)"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD (for range)"),
    granularity: Optional[GranularityUnit] = Query(
        None, description="hour|day|month override"
    ),
    tz: str = Query("UTC", description="Timezone for bucketing e.g. Africa/Tripoli"),
    currency: Optional[Currency] = Query(None, description="USD or LBP (optional)"),
    category: Optional[str] = Query(None),
    transaction_type: Optional[TransactionType] = Query(
        None, alias="type", description="Income or Expense"
    ),
    include_system: bool = Query(True, description="Include category=Visit By System"),
    top_n: int = Query(12, ge=1, le=100),
):
    start_dt, end_excl, unit_str = _build_range_and_unit(
        mode, day, month, year, start_date, end_date, granularity
    )

    unit = cast(GranularityUnit, unit_str)

    # match with $and to avoid overwriting conditions
    conditions: List[Dict[str, Any]] = [
        {"date": {"$gte": start_dt, "$lt": end_excl}},
        {"amount": {"$gt": 0}},
    ]
    if currency:
        conditions.append({"currency": currency.value})
    if category:
        conditions.append({"category": category})
    if transaction_type:
        conditions.append({"type": transaction_type.value})
    if not include_system:
        conditions.append({"category": {"$ne": "Visit By System"}})

    match = {"$and": conditions} if len(conditions) > 1 else conditions[0]

    pipeline: Sequence[Mapping[str, Any]] = [
        {"$match": match},
        {
            "$facet": {
                "kpis_by_currency": [
                    {
                        "$group": {
                            "_id": "$currency",
                            "total_count": {"$sum": 1},
                            "income_total": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": ["$type", "Income"]},
                                        "$amount",
                                        0,
                                    ]
                                }
                            },
                            "expense_total": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": ["$type", "Expense"]},
                                        "$amount",
                                        0,
                                    ]
                                }
                            },
                            "income_count": {
                                "$sum": {"$cond": [{"$eq": ["$type", "Income"]}, 1, 0]}
                            },
                            "expense_count": {
                                "$sum": {"$cond": [{"$eq": ["$type", "Expense"]}, 1, 0]}
                            },
                        }
                    },
                    {"$sort": {"_id": 1}},
                ],
                "series_raw": [
                    {
                        "$group": {
                            "_id": {
                                "bucket": {
                                    "$dateTrunc": {
                                        "date": "$date",
                                        "unit": unit,
                                        "timezone": tz,
                                    }
                                },
                                "currency": "$currency",
                                "type": "$type",
                            },
                            "total": {"$sum": "$amount"},
                            "count": {"$sum": 1},
                        }
                    },
                    {"$sort": {"_id.bucket": 1}},
                ],
                "by_category_raw": [
                    {
                        "$group": {
                            "_id": {
                                "currency": "$currency",
                                "category": "$category",
                                "type": "$type",
                            },
                            "total": {"$sum": "$amount"},
                            "count": {"$sum": 1},
                        }
                    },
                    {"$sort": {"total": -1}},
                ],
            }
        },
    ]

    cursor = DBfinancial_transaction.get_motor_collection().aggregate(pipeline)
    res = await cursor.to_list(length=1)
    data = res[0] if res else {}

    # --- KPIs (typed) ---
    kpis_by_currency: Dict[Currency, KPIModel] = {}
    for row in data.get("kpis_by_currency") or []:
        cur = Currency(row["_id"])
        inc = float(row.get("income_total") or 0)
        exp = float(row.get("expense_total") or 0)
        kpis_by_currency[cur] = KPIModel(
            total_income=inc,
            total_expense=exp,
            net=inc - exp,
            count_income=int(row.get("income_count") or 0),
            count_expense=int(row.get("expense_count") or 0),
            total_count=int(row.get("total_count") or 0),
        )

    # --- Series (typed) ---
    series_by_currency_tmp: Dict[Currency, Dict[str, Dict[str, Any]]] = {}
    for row in data.get("series_raw") or []:
        bucket = row["_id"]["bucket"].isoformat()
        cur = Currency(row["_id"]["currency"])
        t = TransactionType(row["_id"]["type"])
        total = float(row.get("total") or 0)
        count = int(row.get("count") or 0)

        series_by_currency_tmp.setdefault(cur, {})
        series_by_currency_tmp[cur].setdefault(
            bucket,
            {
                "bucket": bucket,
                "income": 0.0,
                "expense": 0.0,
                "net": 0.0,
                "count_income": 0,
                "count_expense": 0,
            },
        )

        if t == TransactionType.Income:
            series_by_currency_tmp[cur][bucket]["income"] += total
            series_by_currency_tmp[cur][bucket]["count_income"] += count
        else:
            series_by_currency_tmp[cur][bucket]["expense"] += total
            series_by_currency_tmp[cur][bucket]["count_expense"] += count

    series_by_currency: Dict[Currency, List[SeriesPoint]] = {}
    for cur, buckets in series_by_currency_tmp.items():
        points: List[SeriesPoint] = []
        for p in buckets.values():
            p["net"] = p["income"] - p["expense"]
            points.append(SeriesPoint(**p))
        series_by_currency[cur] = points

    # --- By category (typed) ---
    by_category_by_currency: Dict[Currency, List[BreakdownRow]] = {}
    for row in data.get("by_category_raw") or []:
        cur = Currency(row["_id"]["currency"])
        by_category_by_currency.setdefault(cur, [])
        by_category_by_currency[cur].append(
            BreakdownRow(
                key=row["_id"]["category"],
                type=TransactionType(row["_id"]["type"]),
                total=float(row.get("total") or 0),
                count=int(row.get("count") or 0),
            )
        )

    # limit top_n per currency
    for cur in list(by_category_by_currency.keys()):
        by_category_by_currency[cur] = by_category_by_currency[cur][:top_n]

    # Optional “flat” fields when currency is specified
    flat_kpis: Optional[KPIModel] = None
    flat_series: Optional[List[SeriesPoint]] = None
    flat_by_category: Optional[List[BreakdownRow]] = None

    if currency:
        flat_kpis = kpis_by_currency.get(
            currency,
            KPIModel(
                total_income=0,
                total_expense=0,
                net=0,
                count_income=0,
                count_expense=0,
                total_count=0,
            ),
        )
        flat_series = series_by_currency.get(currency, [])
        flat_by_category = by_category_by_currency.get(currency, [])

    return AnalyticsSummaryResponse(
        mode=mode,
        start_dt=start_dt.isoformat(),
        end_dt_exclusive=end_excl.isoformat(),
        unit=unit,
        tz=tz,
        filters=AnalyticsFilters(
            currency=currency,
            category=category,
            type=transaction_type,
            include_system=include_system,
        ),
        kpis_by_currency=kpis_by_currency,
        series_by_currency=series_by_currency,
        by_category_by_currency=by_category_by_currency,
        kpis=flat_kpis,
        series=flat_series,
        by_category=flat_by_category,
    )


@router.get(
    "/analytics/available_years", response_model=AnalyticsAvailableYearsResponse
)
async def analytics_available_years() -> Dict[str, Any]:
    pipeline: Sequence[Mapping[str, Any]] = [
        {"$match": {"date": {"$exists": True}}},
        {
            "$group": {
                "_id": None,
                "minDate": {"$min": "$date"},
                "maxDate": {"$max": "$date"},
            }
        },
    ]
    cursor = DBfinancial_transaction.get_motor_collection().aggregate(pipeline)
    res = await cursor.to_list(length=1)
    if not res:
        return {"years": []}

    min_dt = res[0]["minDate"]
    max_dt = res[0]["maxDate"]
    if not min_dt or not max_dt:
        return {"years": []}

    years = list(range(min_dt.year, max_dt.year + 1))
    return {"years": years, "min": min_dt.isoformat(), "max": max_dt.isoformat()}


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
