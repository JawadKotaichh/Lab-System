import unittest
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace as NS
from unittest.mock import MagicMock, patch
from beanie import PydanticObjectId
from src.api.financial_transaction import get_financial_transactions_summary


class FinancialSummaryTests(unittest.IsolatedAsyncioTestCase):
    async def test_summary_preserves_currencies_categories_and_amounts(self):
        rows = [NS(id=PydanticObjectId(), type="Income", currency=currency, date=datetime(2026, 10, 28),
                   amount=Decimal(amount), description="Sample", category="Sample", visit_id=None)
                for currency, amount in [("USD", "2.60"), ("LBP", "500000")]]
        async def cursor():
            for row in rows: yield row
        find = MagicMock(return_value=cursor())
        with patch("src.api.financial_transaction.DBfinancial_transaction", NS(find=find)):
            output = await get_financial_transactions_summary("Income", "ALL", "ALL", "2026-10-28", "2026-10-28")
        filters = find.call_args.args[0]
        self.assertNotIn("currency", filters)
        self.assertNotIn("category", filters)
        self.assertEqual(filters["amount"], {"$gt": 0})
        self.assertEqual(filters["date"]["$gte"], datetime(2026, 10, 27, 22))
        self.assertEqual(filters["date"]["$lte"], datetime(2026, 10, 28, 21, 59, 59, 999999))
        self.assertEqual(output.by_currency["USD"]["Sample"][0].amount, Decimal("2.60"))
        self.assertEqual(output.by_currency["LBP"]["Sample"][0].amount, Decimal("500000"))

    async def test_summary_applies_selected_category_and_currency(self):
        async def cursor():
            if False: yield None
        find = MagicMock(return_value=cursor())
        with patch("src.api.financial_transaction.DBfinancial_transaction", NS(find=find)):
            output = await get_financial_transactions_summary("Expense", "Rent", "USD", "2026-10-01", "2026-10-28")
        filters = find.call_args.args[0]
        self.assertEqual(filters["category"], {"$regex": "Rent", "$options": "i"})
        self.assertEqual(filters["currency"], {"$regex": "USD", "$options": "i"})
        self.assertEqual(output.by_currency, {"USD": {}})
