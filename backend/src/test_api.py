import unittest
from collections import Counter

from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from src.main_app import app
from src.schemas.schema_Invoice import PaginatedInvoices


class ApiContractTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
