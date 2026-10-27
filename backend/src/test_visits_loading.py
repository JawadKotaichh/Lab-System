import asyncio
import unittest
from contextlib import ExitStack
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace as NS
from unittest.mock import MagicMock, patch
from beanie import PydanticObjectId
from beanie.odm.utils.projection import get_projection
from fastapi import HTTPException
from src.api.visits import get_visits_with_page_size, _InvoiceSummary, _TestPrice, _PanelPrice


class VisitsLoadingTests(unittest.IsolatedAsyncioTestCase):
    async def read(self, *, patient=False, empty=False, missing_panel=False):
        visit_id, patient_id, other_patient, insurance_id, test_id, panel_test_id, panel_id = [PydanticObjectId() for _ in range(7)]
        visit = NS(id=visit_id, patient_id=patient_id, posted=True, visit_date=datetime(2026, 10, 28), report_date=datetime(2026, 10, 28))
        person = NS(id=patient_id, name="Sample", gender="Female", DOB=datetime(2000, 1, 1), phone_number="00000000", insurance_company_id=insurance_id)
        events, projections, filters = [], {}, []
        rows = {
            "visits": [] if empty else [visit], "patients": [person],
            "insurance": [NS(id=insurance_id, rate=Decimal("0.1"), currency="USD", insurance_company_name="Private")],
            "tests": [NS(id=test_id, price=Decimal("20"))],
            "panels": [] if missing_panel else [NS(id=panel_id, lab_panel_price=Decimal("30"))],
            "invoices": [NS(visit_id=visit_id, adjustment_minor=Decimal("-1"), total_paid=Decimal("2"))],
        }
        groups = [
            {"_id": {"visit_id": visit_id, "lab_test_type_id": test_id, "lab_panel_id": None}, "total": 2, "completed": 1},
            {"_id": {"visit_id": visit_id, "lab_test_type_id": None, "lab_panel_id": panel_id}, "total": 3, "completed": 2},
        ]

        class Query:
            def __init__(self, name): self.name, self.projection = name, None
            def sort(self, value): return self
            def skip(self, value): return self
            def limit(self, value): return self
            def project(self, model):
                self.projection = model
                projections[self.name] = get_projection(model)
                return self
            async def count(self):
                events.append("count")
                await asyncio.sleep(0)
                self_test.assertIn("visits", events, "Count and page queries must run together")
                return len(rows["visits"])
            async def to_list(self):
                events.append(self.name)
                await asyncio.sleep(0)
                if self.name in {"patients", "groups", "invoices"}:
                    self_test.assertTrue({"patients", "groups", "invoices"}.issubset(events))
                if self.name in {"insurance", "tests", "panels"}:
                    self_test.assertTrue({"insurance", "tests", "panels"}.issubset(events))
                if self.name in {"tests", "panels", "invoices"}:
                    self_test.assertIsNotNone(self.projection, "Do not fetch full catalogue/invoice documents")
                return groups if self.name == "groups" else rows[self.name]

        self_test = self
        def visits_find(value):
            filters.append(value)
            return Query("visits")
        def aggregate(pipeline):
            self.assertEqual(pipeline[0], {"$match": {"visit_id": {"$in": [visit_id]}}})
            group = pipeline[1]["$group"]
            self.assertEqual(group["completed"], {"$sum": {"$cond": [{"$ne": ["$result", ""]}, 1, 0]}})
            self.assertEqual(group["_id"]["lab_panel_id"], {"$ifNull": ["$lab_panel_id", None]})
            self.assertEqual(group["_id"]["lab_test_type_id"], {"$cond": [
                {"$eq": [{"$ifNull": ["$lab_panel_id", None]}, None]}, "$lab_test_type_id", None,
            ]})
            return Query("groups")
        with ExitStack() as stack:
            stack.enter_context(patch("src.api.visits.DBVisit", NS(find=visits_find)))
            for name, key in [("DBPatient", "patients"), ("DBInsurance_company", "insurance"), ("DBLab_test_type", "tests"), ("DBLab_panel", "panels"), ("DBInvoice", "invoices")]:
                stack.enter_context(patch(f"src.api.visits.{name}", NS(find=MagicMock(side_effect=lambda *args, key=key: Query(key)))))
            stack.enter_context(patch("src.api.visits.DBLab_test_result", NS(aggregate=aggregate)))
            result = await get_visits_with_page_size(
                page_number=1, page_size=50, start_date=None, end_date=None, patient_name=None,
                insurance_company_name=None, patient_phone_number=None,
                patient_id=str(other_patient) if patient else None,
                principal={"role": "patient" if patient else "admin", "id": str(patient_id)},
            )
        return result, events, projections, filters, patient_id

    async def test_three_query_stages_preserve_counts_billing_and_panel_charging(self):
        result, events, projections, _, _ = await self.read()
        visit = result.visitsData[0]
        self.assertEqual((visit.total_tests_results, visit.completed_tests_results), (5, 3))
        self.assertEqual(visit.total_price, Decimal("70"), "Standalone occurrences count individually; a panel is charged once")
        self.assertEqual(visit.total_price_with_insurance, Decimal("6"))
        self.assertEqual(visit.total_paid, Decimal("2"))
        self.assertEqual(result.TotalNumberOfVisits, 1)
        self.assertEqual(len(events), 8)
        self.assertEqual(projections["invoices"], {"visit_id": 1, "adjustment_minor": 1, "total_paid": 1})
        self.assertEqual(projections["tests"], {"_id": 1, "price": 1})
        self.assertEqual(projections["panels"], {"_id": 1, "lab_panel_price": 1})

    async def test_patient_queries_remain_scoped_to_owner_and_posted_visits(self):
        _, _, _, filters, owner_id = await self.read(patient=True)
        self.assertTrue(all(item == {"patient_id": owner_id, "posted": True} for item in filters))

    async def test_empty_page_stops_before_related_collection_reads(self):
        result, events, _, _, _ = await self.read(empty=True)
        self.assertEqual(result.visitsData, [])
        self.assertEqual(set(events), {"count", "visits"})

    async def test_missing_panel_still_reports_an_error(self):
        with self.assertRaises(HTTPException) as error:
            await self.read(missing_panel=True)
        self.assertEqual(error.exception.status_code, 400)

    def test_price_projections_decode_stored_bson_decimals(self):
        from bson import Decimal128
        item_id = PydanticObjectId()
        self.assertEqual(_TestPrice.model_validate({"_id": item_id, "price": Decimal128("12.125")}).price, Decimal("12.125"))
        self.assertEqual(_PanelPrice.model_validate({"_id": item_id, "lab_panel_price": Decimal128("30")}).lab_panel_price, Decimal("30"))
        self.assertEqual(_InvoiceSummary.model_validate({"visit_id": item_id, "adjustment_minor": Decimal128("-1"), "total_paid": Decimal128("2")}).total_paid, Decimal("2"))
