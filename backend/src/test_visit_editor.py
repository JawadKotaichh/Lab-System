import unittest
from contextlib import ExitStack
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace as NS
from unittest.mock import AsyncMock, MagicMock, patch
from beanie import PydanticObjectId
from fastapi.testclient import TestClient
from src.api.visit_editor import get_visit_editor
from src.api.Invoice import get_invoice
from src.api.lab_test_results import get_result_list
from src.api.deps import get_current_principal, require_visit_access
from src.main_app import app
from src.schemas.schema_Lab_Test_Type import Lab_test_type
from src.schemas.schema_Invoice import LabTestChanged, LabPanelChanged


class VisitEditorTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.visit_id, patient_id, insurance_id, test_id, panel_test_id, panel_id, category_id = [PydanticObjectId() for _ in range(7)]
        self.visit = NS(id=self.visit_id, patient_id=patient_id, visit_date=datetime(2026, 10, 28), report_date=datetime(2026, 10, 28), posted=False, replace=AsyncMock())
        self.patient = NS(id=patient_id, insurance_company_id=insurance_id, name="Sample", gender="Male", phone_number="00000000", DOB=datetime(2000, 1, 1))
        self.insurance = NS(insurance_company_name="Private", currency="USD", rate=Decimal("0.07"))
        tests = [NS(id=item_id, name=name, nssf_id=1, unit="unit", price=Decimal("20"), lab_test_category_id=category_id, normal_value_list=[])
                 for item_id, name in [(test_id, "Standalone"), (panel_test_id, "Panel test")]]
        panels = [NS(id=panel_id, panel_name="Panel", nssf_id=2, lab_panel_price=Decimal("50"), lab_panel_category_id=category_id)]
        self.orders = [NS(id=PydanticObjectId(), lab_test_type_id=test_id, lab_panel_id=None, result=""),
                       NS(id=PydanticObjectId(), lab_test_type_id=panel_test_id, lab_panel_id=panel_id, result="")]
        snapshot = Lab_test_type(lab_test_id=str(test_id), name="Saved name", nssf_id=1, unit="unit", price=Decimal("15"), lab_test_category_id=str(category_id), normal_value_list=[])
        self.invoice = NS(invoice_number=1, list_of_tests=[snapshot], list_of_lab_panels=[],
                          list_of_lab_tests_ids_changed=[LabTestChanged(lab_test_id=str(test_id), new_price=Decimal("0"))],
                          list_of_lab_panels_ids_changed=[LabPanelChanged(panel_id=str(panel_id), new_price=Decimal("3"))],
                          adjustment_minor=Decimal("-1"), total_paid=Decimal("2"), replace=AsyncMock())
        async def previous_results(*args):
            yield {"_id": test_id, "prev_result": "Previous", "prev_date": datetime(2026, 1, 1)}
        self.models = {
            "Patient": NS(id=0, find_one=AsyncMock(return_value=self.patient)),
            "insurance_company": NS(id=0, find_one=AsyncMock(return_value=self.insurance)),
            "lab_test_result": NS(visit_id=0, find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=self.orders))), aggregate=previous_results),
            "lab_test_type": NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=tests)))),
            "lab_panel": NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=panels)))),
            "lab_test_category": NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=[NS(id=category_id, lab_test_category_name="Category")])))),
        }
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        for name, model in self.models.items():
            self.stack.enter_context(patch(f"src.visit_read.{name}", model))
        aliases = {"DBPatient": "Patient", "DBInsurance_company": "insurance_company", "DBLab_test_result": "lab_test_result", "DBLab_test_type": "lab_test_type", "DBLab_panel": "lab_panel", "DBLab_test_category": "lab_test_category"}
        for module in ["src.api.Invoice", "src.api.lab_test_results"]:
            for alias, name in aliases.items():
                self.stack.enter_context(patch(f"{module}.{alias}", self.models[name]))
        self.invoice_model = NS(visit_id=0, find_one=AsyncMock(return_value=self.invoice))
        self.stack.enter_context(patch("src.api.visit_editor.DBInvoice", self.invoice_model))
        self.stack.enter_context(patch("src.api.Invoice.DBInvoice", self.invoice_model))

    async def test_shared_response_matches_existing_reads_without_duplicate_lookups_or_writes(self):
        expected_results = await get_result_list(str(self.visit_id), self.visit, True, {"role": "admin"})
        expected_invoice = await get_invoice(str(self.visit_id), self.visit)
        for model in self.models.values():
            for name in ["find_one", "find"]:
                method = getattr(model, name, None)
                if method is not None: method.reset_mock()
        self.invoice_model.find_one.reset_mock()
        output = await get_visit_editor(str(self.visit_id), self.visit)
        self.assertEqual(output.results.model_dump(), expected_results.model_dump())
        self.assertEqual(output.invoice.model_dump(), expected_invoice.model_dump())
        self.assertEqual(output.results.list_of_standalone_test_results[0].result, "")
        self.assertEqual(output.results.list_of_standalone_test_results[0].prev_result, "Previous")
        self.assertEqual(output.invoice.invoice_data.list_of_tests[0].price, Decimal("15"))
        self.assertEqual(output.invoice.invoice_data.list_of_lab_tests_ids_changed[0].new_price, 0)
        self.assertEqual(output.invoice.invoice_data.list_of_lab_panels_ids_changed[0].new_price, 3)
        for model in self.models.values():
            for name in ["find_one", "find"]:
                method = getattr(model, name, None)
                if method is not None: method.assert_called_once()
        self.invoice_model.find_one.assert_awaited_once()
        self.invoice.replace.assert_not_awaited()
        self.visit.replace.assert_not_awaited()

    async def test_missing_invoice_is_reported_without_writes(self):
        from fastapi import HTTPException
        self.invoice_model.find_one.return_value = None
        with self.assertRaises(HTTPException) as error:
            await get_visit_editor(str(self.visit_id), self.visit)
        self.assertEqual(error.exception.status_code, 404)
        self.visit.replace.assert_not_awaited()

    def test_editor_requires_authentication_and_admin_role(self):
        client = TestClient(app)
        url = f"/visits/{self.visit_id}/editor"
        self.assertEqual(client.get(url).status_code, 401)
        app.dependency_overrides[get_current_principal] = lambda: {"role": "patient", "id": str(self.visit.patient_id)}
        try:
            self.assertEqual(client.get(url).status_code, 403)
            self.models["Patient"].find_one.assert_not_awaited()
        finally:
            app.dependency_overrides.pop(get_current_principal, None)

    def test_admin_http_response_keeps_numeric_money_and_blank_results(self):
        app.dependency_overrides[get_current_principal] = lambda: {"role": "admin", "id": str(PydanticObjectId())}
        app.dependency_overrides[require_visit_access] = lambda: self.visit
        try:
            response = TestClient(app).get(f"/visits/{self.visit_id}/editor")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["results"]["list_of_standalone_test_results"][0]["result"], "")
            self.assertEqual(data["invoice"]["invoice_data"]["list_of_tests"][0]["price"], 15)
            self.assertEqual(data["invoice"]["invoice_data"]["adjustment_minor"], -1)
            self.assertEqual(data["invoice"]["invoice_data"]["list_of_lab_panels_ids_changed"][0]["new_price"], 3)
            self.invoice.replace.assert_not_awaited()
        finally:
            app.dependency_overrides.pop(get_current_principal, None)
            app.dependency_overrides.pop(require_visit_access, None)
