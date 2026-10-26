import unittest
from collections import Counter
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from beanie import PydanticObjectId
from beanie.odm.utils.encoder import Encoder
from bson import Decimal128
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from src.api.Invoice import override_test_price
from src.api.Invoice import _validate_invoice_total
from src.api.Invoice import update_current_invoice
from src.api.lab_test_results import get_result_list, create_lab_panel_result, create_lab_test_result
from fastapi import HTTPException
from src.api.auth import update_own_account
from src.main_app import app
from src.db import init_db
from src.models import Admin as DBAdmin
from src.models import Invoice as DBInvoice
from src.models import User as DBUser
from src.models import Visit as DBVisit
from src.models import lab_panel as DBLabPanel
from src.schemas.financial_types import Money, Rate, SignedMoney, round_money
from src.schemas.schema_Invoice import LabTestChanged
from src.schemas.schema_Invoice import PaginatedInvoices
from src.schemas.schema_Invoice import update_invoice
from src.schemas.schema_Lab_Test_Result import Lab_test_result
from src.schemas.schema_users import self_update_user


class ApiContractTests(unittest.TestCase):
    bounded_list_paths = {
        "/users/all",
        "/patients/all",
        "/visits/all",
        "/insurance_company/all",
        "/insurance_company/get_currencies",
        "/lab_test_category/all",
        "/lab_panel/all",
        "/lab_test_type/all",
        "/financial_transaction/all",
        "/financial_transaction/get_all_currencies",
        "/financial_transaction/get_all_categories",
        "/financial_transaction/get_all_types",
    }

    def test_health_check_does_not_require_database_or_authentication(self):
        response = TestClient(app).get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_protected_route_requires_authentication(self):
        response = TestClient(app).get("/patients/all")

        self.assertEqual(response.status_code, 401)

    def test_method_and_path_pairs_are_unique(self):
        registered_routes = [
            (method, route.path)
            for route in app.routes
            if isinstance(route, APIRoute)
            for method in route.methods
        ]
        duplicates = [
            route
            for route, count in Counter(registered_routes).items()
            if count > 1
        ]

        self.assertEqual(duplicates, [])

    def test_invoice_page_uses_paginated_response_contract(self):
        route = next(
            route
            for route in app.routes
            if isinstance(route, APIRoute)
            and route.path == "/invoices/page/{page_size}/{page_number}"
            and "GET" in route.methods
        )

        self.assertIs(route.response_model, PaginatedInvoices)

    def test_self_service_account_route_requires_authentication(self):
        route = next(
            route
            for route in app.routes
            if isinstance(route, APIRoute)
            and route.path == "/auth/me"
            and "PUT" in route.methods
        )
        dependency_names = {
            dependency.call.__name__ for dependency in route.dependant.dependencies
        }

        self.assertIn("get_current_principal", dependency_names)

    def test_bounded_list_routes_support_offset_pagination(self):
        routes_by_path = {
            route.path: route
            for route in app.routes
            if isinstance(route, APIRoute) and "GET" in route.methods
        }

        for path in self.bounded_list_paths:
            with self.subTest(path=path):
                route = routes_by_path[path]
                params = {
                    param.name: param for param in route.dependant.query_params
                }
                limit = params["limit"]
                offset = params["offset"]

                self.assertEqual(limit.default, 100)
                self.assertTrue(
                    any(
                        getattr(constraint, "le", None) == 100
                        for constraint in limit.field_info.metadata
                    )
                )
                self.assertEqual(offset.default, 0)
                self.assertTrue(
                    any(
                        getattr(constraint, "ge", None) == 0
                        for constraint in offset.field_info.metadata
                    )
                )


class RegressionTests(unittest.IsolatedAsyncioTestCase):
    async def test_editor_includes_blank_results_while_reports_exclude_them(self):
        visit_id, patient_id, test_id, category_id, insurance_id = [PydanticObjectId() for _ in range(5)]
        visit = SimpleNamespace(id=visit_id, patient_id=patient_id, visit_date=datetime(2026, 10, 26), report_date=datetime(2026, 10, 26))
        patient = SimpleNamespace(id=patient_id, insurance_company_id=insurance_id, name="Sample Patient", gender="Male", phone_number="00000000", DOB=datetime(2000, 1, 1))
        result = SimpleNamespace(id=PydanticObjectId(), lab_test_type_id=test_id, lab_panel_id=None, result="")
        test_type = SimpleNamespace(id=test_id, name="Sample test", nssf_id=1, lab_test_category_id=category_id, unit="unit", price=Decimal("20"), normal_value_list=[])
        async def no_previous_results(*args):
            if False:
                yield None
        result_model = SimpleNamespace(visit_id=0, find=MagicMock(return_value=SimpleNamespace(to_list=AsyncMock(return_value=[result]))), aggregate=no_previous_results)
        for include_incomplete, expected_count in ((False, 0), (True, 1)):
            with (
                self.subTest(include_incomplete=include_incomplete),
                patch("src.api.lab_test_results.DBPatient", SimpleNamespace(id=0, find_one=AsyncMock(return_value=patient))),
                patch("src.api.lab_test_results.DBLab_test_result", result_model),
                patch("src.api.lab_test_results.DBLab_test_type", SimpleNamespace(find=MagicMock(return_value=SimpleNamespace(to_list=AsyncMock(return_value=[test_type]))))),
                patch("src.api.lab_test_results.DBLab_test_category", SimpleNamespace(find=MagicMock(return_value=SimpleNamespace(to_list=AsyncMock(return_value=[SimpleNamespace(id=category_id, lab_test_category_name="Category")]))))),
                patch("src.api.lab_test_results.DBInsurance_company", SimpleNamespace(id=0, find_one=AsyncMock(return_value=SimpleNamespace(insurance_company_name="Private")))),
            ):
                result_list = await get_result_list(str(visit_id), visit, include_incomplete, {"role": "admin"})
            self.assertEqual(len(result_list.list_of_standalone_test_results), expected_count)

    async def test_patient_cannot_request_incomplete_results(self):
        with self.assertRaises(HTTPException) as error:
            await get_result_list(str(PydanticObjectId()), SimpleNamespace(), True, {"role": "patient"})
        self.assertEqual(error.exception.status_code, 403)

    async def test_panel_save_retry_inserts_only_missing_members(self):
        visit_id, panel_id, first_test, second_test = [PydanticObjectId() for _ in range(4)]
        panel = SimpleNamespace(id=panel_id, list_of_test_type_ids=[first_test, second_test])
        result_model = MagicMock(return_value=SimpleNamespace(insert=AsyncMock(return_value=True)))
        result_model.find.return_value.to_list = AsyncMock(return_value=[SimpleNamespace(lab_panel_id=panel_id, lab_test_type_id=first_test)])
        with (
            patch("src.api.lab_test_results.DBLab_panel", SimpleNamespace(id=0, find_one=AsyncMock(return_value=panel))),
            patch("src.api.lab_test_results.DBLab_test_result", result_model),
        ):
            await create_lab_panel_result(str(visit_id), str(panel_id))
        result_model.assert_called_once()
        self.assertEqual(result_model.call_args.kwargs["lab_test_type_id"], second_test)

    async def test_standalone_save_retry_returns_existing_result(self):
        visit_id, test_id = PydanticObjectId(), PydanticObjectId()
        existing = SimpleNamespace(lab_panel_id=None)
        result_model = MagicMock()
        result_model.find_one = AsyncMock(return_value=existing)
        with (
            patch("src.api.lab_test_results.DBVisit", SimpleNamespace(get=AsyncMock(return_value=SimpleNamespace(id=visit_id)))),
            patch("src.api.lab_test_results.DBLab_test_type", SimpleNamespace(get=AsyncMock(return_value=object()))),
            patch("src.api.lab_test_results.DBLab_test_result", result_model),
        ):
            saved = await create_lab_test_result(str(visit_id), Lab_test_result(lab_test_type_id=str(test_id), visit_id=str(visit_id), result=""))
        self.assertIs(saved, existing)
        result_model.assert_not_called()

    async def test_invoice_save_does_not_publish_and_rejects_negative_total_before_payment(self):
        for adjustment, posted in (("0", False), ("0", True), ("-5", False)):
            with self.subTest(adjustment=adjustment, posted=posted):
                visit_id, patient_id, insurance_id = [PydanticObjectId() for _ in range(3)]
                visit = SimpleNamespace(id=visit_id, patient_id=patient_id, posted=posted, replace=AsyncMock())
                invoice = SimpleNamespace(list_of_tests=[SimpleNamespace(lab_test_id="test", price=Decimal("20"))], list_of_lab_panels=[], list_of_lab_tests_ids_changed=[], list_of_lab_panels_ids_changed=[], adjustment_minor=Decimal("0"), total_paid=Decimal("0"), replace=AsyncMock())
                payment = SimpleNamespace(amount=Decimal("0"), replace=AsyncMock())
                with (
                    patch("src.api.Invoice.DBVisit", SimpleNamespace(get=AsyncMock(return_value=visit))),
                    patch("src.api.Invoice.DBInvoice", SimpleNamespace(visit_id=0, find_one=AsyncMock(return_value=invoice))),
                    patch("src.api.Invoice.DBPatient", SimpleNamespace(id=0, find_one=AsyncMock(return_value=SimpleNamespace(insurance_company_id=insurance_id)))),
                    patch("src.api.Invoice.DBInsurance_company", SimpleNamespace(id=0, find_one=AsyncMock(return_value=SimpleNamespace(rate=Decimal("0.2"))))),
                    patch("src.api.Invoice.DBFinancial_transaction", SimpleNamespace(visit_id=0, find_one=AsyncMock(return_value=payment))),
                ):
                    payload = update_invoice(total_paid=Decimal("2"), adjustment_minor=Decimal(adjustment))
                    if adjustment == "-5":
                        with self.assertRaises(HTTPException):
                            await update_current_invoice(str(visit_id), payload)
                        payment.replace.assert_not_awaited()
                        invoice.replace.assert_not_awaited()
                    else:
                        await update_current_invoice(str(visit_id), payload)
                        self.assertEqual(payment.amount, Decimal("2"))
                        invoice.replace.assert_awaited_once()
                self.assertEqual(visit.posted, posted)
                visit.replace.assert_not_awaited()

    async def test_saving_billing_never_changes_result_publication(self):
        for posted in (True, False):
            visit = SimpleNamespace(posted=posted, replace=AsyncMock())
            invoice = SimpleNamespace(total_paid=Decimal("100"))
            with patch("src.api.Invoice._calculate_invoice_total", AsyncMock(return_value=Decimal("10"))):
                await _validate_invoice_total(invoice, visit)
            self.assertEqual(visit.posted, posted)
            visit.replace.assert_not_awaited()

    async def test_negative_net_total_is_rejected_before_publication_changes(self):
        visit = SimpleNamespace(posted=False, replace=AsyncMock())
        with patch("src.api.Invoice._calculate_invoice_total", AsyncMock(return_value=Decimal("-1"))):
            with self.assertRaises(HTTPException) as error:
                await _validate_invoice_total(SimpleNamespace(), visit)
        self.assertEqual(error.exception.status_code, 422)
        self.assertFalse(visit.posted)
        visit.replace.assert_not_awaited()

    def test_financial_values_round_trip_through_beanie_bson_encoding(self):
        for field_type, value in (
            (Money, Decimal("45.125")),
            (SignedMoney, Decimal("-10.250")),
            (Rate, Decimal("0.07")),
            (Rate, Decimal("8500")),
        ):
            with self.subTest(value=value):
                stored = Encoder(to_db=True).encode({"value": value})["value"]
                self.assertIsInstance(stored, Decimal128)
                adapter = TypeAdapter(field_type)
                decoded = adapter.validate_python(stored)
                self.assertEqual(decoded, value)
                self.assertEqual(adapter.dump_python(decoded, mode="json"), float(value))

    def test_saved_lab_panel_with_bson_price_can_be_loaded(self):
        with patch.object(DBLabPanel, "get_motor_collection", return_value=object()):
            panel = DBLabPanel.model_validate({
                "_id": PydanticObjectId(),
                "nssf_id": 123,
                "panel_name": "Example panel",
                "lab_panel_price": Decimal128("45"),
                "lab_panel_category_id": PydanticObjectId(),
                "list_of_test_type_ids": [PydanticObjectId()],
            })
        self.assertEqual(panel.lab_panel_price, Decimal("45"))
        self.assertEqual(panel.model_dump(mode="json")["lab_panel_price"], 45.0)

    def test_bson_money_still_enforces_amount_and_precision_limits(self):
        adapter = TypeAdapter(Money)
        for invalid in ("-1", "1.0001", "1000000000001", "NaN", "Infinity"):
            with self.subTest(value=invalid):
                with self.assertRaises(ValueError):
                    adapter.validate_python(Decimal128(invalid))

    def test_insurance_rates_support_currency_conversion_multipliers(self):
        adapter = TypeAdapter(Rate)
        for rate in ("0.2", "1", "7200", "90000"):
            with self.subTest(rate=rate):
                value = adapter.validate_python(rate)
                self.assertEqual(value, Decimal(rate))
                self.assertEqual(adapter.dump_python(value, mode="json"), float(rate))
        for rate in ("-1", "NaN", "Infinity", "1000000000001"):
            with self.subTest(invalid_rate=rate):
                with self.assertRaises(ValueError):
                    adapter.validate_python(rate)

    async def test_database_initialization_respects_index_management_setting(self):
        database = object()
        for manage_indexes in (True, False):
            with self.subTest(manage_indexes=manage_indexes):
                with (
                    patch("src.db.AsyncIOMotorClient", return_value={"lab_system": database}),
                    patch("src.db.init_beanie", new_callable=AsyncMock) as initialize,
                    patch(
                        "src.db.settings",
                        SimpleNamespace(
                            MONGODB_URL="mongodb://localhost:27017",
                            MANAGE_DB_INDEXES=manage_indexes,
                        ),
                    ),
                ):
                    await init_db()

                self.assertEqual(initialize.await_count, 1)
                self.assertIs(initialize.await_args.kwargs["database"], database)
                self.assertEqual(
                    initialize.await_args.kwargs["skip_indexes"], not manage_indexes
                )

    async def test_first_invoice_override_uses_validated_model(self):
        visit_id = PydanticObjectId()
        visit = SimpleNamespace(id=visit_id)
        invoice = SimpleNamespace(
            list_of_lab_tests_ids_changed=[],
            replace=AsyncMock(),
        )
        body = LabTestChanged(
            lab_test_id=str(PydanticObjectId()),
            new_price=Decimal("12.345"),
        )

        with (
            patch.object(DBVisit, "get", AsyncMock(return_value=visit)),
            patch.object(DBInvoice, "find_one", AsyncMock(return_value=invoice)),
            patch("src.api.Invoice._validate_invoice_total", AsyncMock()) as sync,
        ):
            await override_test_price(str(visit_id), body)

        self.assertEqual(len(invoice.list_of_lab_tests_ids_changed), 1)
        self.assertIsInstance(
            invoice.list_of_lab_tests_ids_changed[0], LabTestChanged
        )
        sync.assert_awaited_once_with(invoice, visit)
        invoice.replace.assert_awaited_once()

    async def test_patient_can_update_only_token_owned_account(self):
        patient_id = PydanticObjectId()
        user = SimpleNamespace(
            user_id=patient_id,
            username="old",
            password_hashed="old-hash",
            replace=AsyncMock(),
        )
        data = self_update_user(username="NewName", password="new-password")

        with (
            patch.object(
                DBUser,
                "find_one",
                AsyncMock(side_effect=[user, user]),
            ),
            patch.object(DBAdmin, "find_one", AsyncMock(return_value=None)),
            patch("src.api.auth.pwd_context.hash", return_value="new-hash"),
        ):
            result = await update_own_account(
                data,
                principal={"id": str(patient_id), "role": "patient"},
            )

        self.assertEqual(result, {"ok": True, "username": "newname"})
        self.assertEqual(user.username, "newname")
        self.assertEqual(user.password_hashed, "new-hash")
        user.replace.assert_awaited_once()

    def test_money_rounds_half_up_to_three_decimals(self):
        self.assertEqual(round_money(Decimal("3.3334")), Decimal("3.333"))
        self.assertEqual(round_money(Decimal("3.3335")), Decimal("3.334"))
        self.assertEqual(
            TypeAdapter(Money).validate_python(Decimal("3.333")),
            Decimal("3.333"),
        )


if __name__ == "__main__":
    unittest.main()
