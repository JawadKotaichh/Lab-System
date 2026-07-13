import unittest
from collections import Counter
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from beanie import PydanticObjectId
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from src.api.Invoice import override_test_price
from src.api.auth import update_own_account
from src.main_app import app
from src.models import Admin as DBAdmin
from src.models import Invoice as DBInvoice
from src.models import User as DBUser
from src.models import Visit as DBVisit
from src.schemas.financial_types import Money, round_money
from src.schemas.schema_Invoice import LabTestChanged
from src.schemas.schema_Invoice import PaginatedInvoices
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
            patch("src.api.Invoice._sync_visit_paid_status", AsyncMock()) as sync,
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
