"""Invoice regressions with an in-memory database boundary; no live records."""
import unittest
from contextlib import ExitStack
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace as NS
from unittest.mock import AsyncMock, MagicMock, patch

from beanie import PydanticObjectId
from fastapi import HTTPException
from src.api.Invoice import get_invoice, get_monthly_summary_invoice, rebuild_invoice, update_current_invoice
from src.schemas.schema_Invoice import LabTestChanged, LabPanelChanged, update_invoice
from src.models import lab_test_type as DBTestType


class InvoiceReadTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.visit_id, patient_id, insurance_id, self.test_id, self.panel_test_id, self.panel_id, category_id = [PydanticObjectId() for _ in range(7)]
        self.visit = NS(id=self.visit_id, patient_id=patient_id, visit_date=datetime(2026, 10, 27), posted=False, replace=AsyncMock())
        self.invoice = NS(invoice_number=864, list_of_tests=[], list_of_lab_panels=[],
                          list_of_lab_tests_ids_changed=[], list_of_lab_panels_ids_changed=[],
                          adjustment_minor=Decimal("-1"), total_paid=Decimal("2"), replace=AsyncMock())
        self.orders = [NS(lab_test_type_id=self.test_id, lab_panel_id=None, result=""),
                       NS(lab_test_type_id=self.panel_test_id, lab_panel_id=self.panel_id, result="")]
        test = NS(id=self.test_id, name="Standalone", nssf_id=1, unit="unit", price=Decimal("20"), lab_test_category_id=category_id, normal_value_list=[])
        panel_test = NS(**{**vars(test), "id": self.panel_test_id, "name": "Panel test"})
        panel = NS(id=self.panel_id, panel_name="Panel", nssf_id=2, lab_panel_price=Decimal("50"), lab_panel_category_id=category_id)
        patient = NS(id=patient_id, insurance_company_id=insurance_id, name="Sample Patient", gender="Female", DOB=datetime(2000, 1, 1), phone_number="00000000")
        insurance = NS(rate=Decimal("0.1"), currency="USD", insurance_company_name="Private")
        self.patient, self.insurance = patient, insurance
        self.invoice.visit_id = self.visit_id
        self.invoice.insurance_company_id = insurance_id
        self.invoice.visit_date = self.visit.visit_date
        for order in self.orders:
            order.visit_id = self.visit_id
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        models = {
            "DBVisit": NS(get=AsyncMock(return_value=self.visit)),
            "DBInvoice": NS(visit_id=0, find_one=AsyncMock(return_value=self.invoice)),
            "DBPatient": NS(id=0, find_one=AsyncMock(return_value=patient)),
            "DBInsurance_company": NS(id=0, find_one=AsyncMock(return_value=insurance)),
            "DBLab_test_result": NS(visit_id=0, find=MagicMock(return_value=NS(to_list=AsyncMock(side_effect=lambda: self.orders)))),
            "DBLab_test_type": NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=[test, panel_test])))),
            "DBLab_test_category": NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=[NS(id=category_id, lab_test_category_name="Category")])))),
            "DBLab_panel": NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=[panel])))),
        }
        for name, model in models.items():
            self.stack.enter_context(patch(f"src.api.Invoice.{name}", model))

    async def test_empty_snapshot_includes_all_saved_orders_even_with_blank_results(self):
        output = await get_invoice(str(self.visit_id), self.visit)
        data = output.invoice_data
        self.assertEqual([t.lab_test_id for t in data.list_of_tests], [str(self.test_id)])
        self.assertEqual([p.id for p in data.list_of_lab_panels], [str(self.panel_id)])
        self.assertEqual(data.list_of_lab_panels[0].lab_tests[0].lab_test_id, str(self.panel_test_id))
        self.assertEqual(data.patient_insurance_company_rate, Decimal("0.1"))
        self.assertEqual(data.adjustment_minor, Decimal("-1"))
        self.assertEqual(data.total_paid, Decimal("2"))
        self.assertEqual(data.invoice_number, 864)
        self.assertEqual(self.invoice.list_of_tests, [], "Reads must not repair the database by writing")
        self.invoice.replace.assert_not_awaited()
        self.visit.replace.assert_not_awaited()

    async def test_partial_snapshot_preserves_saved_price_and_overrides(self):
        first = await get_invoice(str(self.visit_id), self.visit)
        saved = first.invoice_data.list_of_tests[0].model_copy(update={"price": Decimal("15")})
        self.invoice.list_of_tests = [saved]
        self.invoice.list_of_lab_tests_ids_changed = [LabTestChanged(lab_test_id=str(self.test_id), new_price=Decimal("1.25"))]
        self.invoice.list_of_lab_panels_ids_changed = [LabPanelChanged(panel_id=str(self.panel_id), new_price=Decimal("3.5"))]
        data = (await get_invoice(str(self.visit_id), self.visit)).invoice_data
        self.assertEqual(data.list_of_tests[0].price, Decimal("15"))
        self.assertEqual(len(data.list_of_lab_panels), 1)
        self.assertEqual(data.list_of_lab_tests_ids_changed[0].new_price, Decimal("1.25"))
        self.assertEqual(data.list_of_lab_panels_ids_changed[0].new_price, Decimal("3.5"))
        self.invoice.replace.assert_not_awaited()

    async def test_removed_orders_do_not_remain_on_invoice(self):
        data = (await get_invoice(str(self.visit_id), self.visit)).invoice_data
        self.invoice.list_of_tests = data.list_of_tests
        self.invoice.list_of_lab_panels = data.list_of_lab_panels
        self.orders = []
        empty = (await get_invoice(str(self.visit_id), self.visit)).invoice_data
        self.assertEqual(empty.list_of_tests, [])
        self.assertEqual(empty.list_of_lab_panels, [])
        self.invoice.replace.assert_not_awaited()

    async def test_complete_snapshot_does_not_depend_on_current_catalog(self):
        data = (await get_invoice(str(self.visit_id), self.visit)).invoice_data
        test = data.list_of_tests[0]
        # Stored standalone snapshots are Beanie documents with ObjectId category
        # fields, unlike the string-based API response schemas.
        self.invoice.list_of_tests = [DBTestType.model_construct(
            **{**test.model_dump(), "lab_test_category_id": PydanticObjectId(test.lab_test_category_id)}
        )]
        self.invoice.list_of_lab_panels = data.list_of_lab_panels
        with patch("src.api.Invoice.DBLab_test_type", NS(find=MagicMock(side_effect=AssertionError("Must use the saved prices")))):
            output = await get_invoice(str(self.visit_id), self.visit)
        self.assertEqual(output.invoice_data.list_of_tests[0].price, Decimal("20"))
        self.assertEqual(output.invoice_data.list_of_lab_panels[0].lab_panel_price, Decimal("50"))
        self.invoice.replace.assert_not_awaited()

    async def test_only_explicit_rebuild_persists_snapshot(self):
        with patch("src.api.Invoice._validate_invoice_total", AsyncMock()):
            await rebuild_invoice(str(self.visit_id))
        self.assertEqual(len(self.invoice.list_of_tests), 1)
        self.assertEqual(len(self.invoice.list_of_lab_panels), 1)
        self.invoice.replace.assert_awaited_once()
        self.visit.replace.assert_not_awaited()

    async def test_save_cannot_clear_invoice_while_orders_exist(self):
        self.invoice.adjustment_minor = Decimal("0")
        for payload in (update_invoice(list_of_tests=[]), update_invoice(list_of_lab_panels=[])):
            with self.subTest(payload=payload):
                with self.assertRaises(HTTPException) as error:
                    await update_current_invoice(str(self.visit_id), payload)
                self.assertEqual(error.exception.status_code, 409)
        self.invoice.replace.assert_not_awaited()

    async def test_full_valid_save_preserves_orders_prices_and_payment_on_readback(self):
        data = (await get_invoice(str(self.visit_id), self.visit)).invoice_data
        payment = NS(amount=Decimal("0"), replace=AsyncMock())
        with (
            patch("src.api.Invoice.DBlab_test_category", NS(id=0, find_one=AsyncMock(return_value=NS(lab_test_category_name="Category")))),
            patch("src.api.Invoice.DBFinancial_transaction", NS(visit_id=0, find_one=AsyncMock(return_value=payment))),
        ):
            await update_current_invoice(str(self.visit_id), update_invoice(
                list_of_tests=data.list_of_tests, list_of_lab_panels=data.list_of_lab_panels,
                list_of_lab_tests_ids_changed=[LabTestChanged(lab_test_id=str(self.test_id), new_price=Decimal("1.25"))],
                total_paid=Decimal("2"), adjustment_minor=Decimal("-1"),
            ))
        self.invoice.replace.assert_awaited_once()
        payment.replace.assert_awaited_once()
        self.assertEqual(payment.amount, Decimal("2"))
        output = (await get_invoice(str(self.visit_id), self.visit)).model_dump(mode="json")
        self.assertEqual(output["invoice_data"]["list_of_lab_tests_ids_changed"][0]["new_price"], 1.25)
        self.assertEqual(output["invoice_data"]["list_of_tests"][0]["price"], 20)
        self.assertEqual(len(output["invoice_data"]["list_of_lab_panels"]), 1)
        self.assertEqual(output["invoice_data"]["total_paid"], 2)
        self.visit.replace.assert_not_awaited()

    async def test_monthly_summary_also_resolves_empty_invoice_snapshots_without_writes(self):
        query = lambda values: MagicMock(return_value=NS(to_list=AsyncMock(return_value=values)))
        with (
            patch("src.api.Invoice.DBInvoice", NS(find=query([self.invoice]))),
            patch("src.api.Invoice.DBVisit", NS(find=query([self.visit]))),
            patch("src.api.Invoice.DBPatient", NS(find=query([self.patient]))),
            patch("src.api.Invoice.DBInsurance_company", NS(get=AsyncMock(return_value=self.insurance))),
        ):
            invoices = await get_monthly_summary_invoice(str(self.patient.insurance_company_id), datetime(2026, 10, 1), datetime(2026, 10, 31))
        self.assertEqual(len(invoices), 1)
        self.assertEqual(len(invoices[0].invoice_data.list_of_tests), 1)
        self.assertEqual(len(invoices[0].invoice_data.list_of_lab_panels), 1)
        self.invoice.replace.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
