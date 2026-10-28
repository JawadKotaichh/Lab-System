import unittest
from types import SimpleNamespace as NS
from unittest.mock import AsyncMock, MagicMock, patch
from tempfile import TemporaryDirectory
from pathlib import Path
from beanie import PydanticObjectId as OID
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pymongo.errors import AutoReconnect
from src.catalog_read import expand_tests, panel_tests
from src.visit_read import load_catalog
from src.api.visit_editor import ResultBatch, save_result_batch
from src.api import branding_router
from fastapi import FastAPI


def model(rows):
    return NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=rows))))


class CatalogTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.category = NS(id=OID(), lab_test_category_name="Category")
        self.tests = [NS(id=OID(), lab_test_category_id=self.category.id, name=str(i), nssf_id=i,
                         unit="unit", price=20, normal_value_list=[]) for i in range(50)]

    async def test_fifty_tests_share_one_category_query_preserving_every_field(self):
        categories = model([self.category])
        rows = await expand_tests(self.tests, categories)
        categories.find.assert_called_once_with({"_id": {"$in": [self.category.id]}})
        self.assertEqual([row.lab_test_id for row in rows], [str(test.id) for test in self.tests])
        self.assertTrue(all(row.price == 20 and row.lab_test_category_name == "Category" for row in rows))

    async def test_panel_fetches_unique_tests_once_and_preserves_membership_order(self):
        tests, categories = model(list(reversed(self.tests))), model([self.category])
        ids = [self.tests[4].id, self.tests[1].id, self.tests[4].id]
        rows = await panel_tests(ids, tests, categories)
        self.assertEqual([row.lab_test_id for row in rows], list(map(str, ids)))
        tests.find.assert_called_once_with({"_id": {"$in": ids[:2]}})
        categories.find.assert_called_once()

    async def test_missing_members_fail_and_empty_panels_need_no_queries(self):
        tests, categories = model([]), model([])
        self.assertEqual(await panel_tests([], tests, categories), [])
        tests.find.assert_not_called()
        categories.find.assert_not_called()
        with self.assertRaises(HTTPException) as error:
            await panel_tests([OID()], tests, categories, missing_status=400)
        self.assertEqual(error.exception.status_code, 400)
        with self.assertRaises(HTTPException):
            await expand_tests(self.tests, categories)

    async def test_shared_catalog_deduplicates_orders_across_many_invoices(self):
        panel = NS(id=OID(), lab_panel_category_id=self.category.id)
        orders = [NS(lab_test_type_id=self.tests[0].id, lab_panel_id=panel.id)] * 100
        tests, panels, categories = model(self.tests[:1]), model([panel]), model([self.category])
        with (patch("src.visit_read.lab_test_type", tests), patch("src.visit_read.lab_panel", panels),
              patch("src.visit_read.lab_test_category", categories)):
            result = await load_catalog(orders)
        tests.find.assert_called_once_with({"_id": {"$in": [self.tests[0].id]}})
        panels.find.assert_called_once_with({"_id": {"$in": [panel.id]}})
        categories.find.assert_called_once_with({"_id": {"$in": [self.category.id]}})
        self.assertEqual(len(result[0]), 1)


class BulkSaveTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.visit = NS(id=OID())
        self.panel = OID()
        self.rows = [NS(id=OID(), lab_test_type_id=OID(), lab_panel_id=panel, result="") for panel in [None, self.panel]]
        self.payload = {"updates": [dict(result_id=str(row.id), test_id=str(row.lab_test_type_id),
                        panel_id=str(row.lab_panel_id) if row.lab_panel_id else None, expected="", value="12") for row in self.rows]}
        self.collection = NS(bulk_write=AsyncMock(return_value=NS(matched_count=2)))
        self.db = model(self.rows)
        self.db.get_motor_collection = MagicMock(return_value=self.collection)
        self.mock = patch("src.api.visit_editor.DBResult", self.db)
        self.mock.start()
        self.addCleanup(self.mock.stop)

    async def save(self):
        return await save_result_batch(str(self.visit.id), ResultBatch(**self.payload), self.visit)

    async def test_one_bulk_write_scopes_each_update_and_compares_expected_value(self):
        self.assertEqual(await self.save(), {"updated": 2})
        self.db.find.assert_called_once_with({"visit_id": self.visit.id, "_id": {"$in": [row.id for row in self.rows]}})
        self.collection.bulk_write.assert_awaited_once()
        operations = self.collection.bulk_write.call_args.args[0]
        self.assertTrue(self.collection.bulk_write.call_args.kwargs["ordered"])
        for operation, row in zip(operations, self.rows):
            self.assertEqual(operation._filter, dict(_id=row.id, visit_id=self.visit.id,
                             lab_test_type_id=row.lab_test_type_id, lab_panel_id=row.lab_panel_id, result=""))
            self.assertEqual(operation._doc, {"$set": {"result": "12"}})
            self.assertFalse(operation._upsert)

    async def test_duplicate_wrong_scope_stale_or_missing_rows_write_nothing(self):
        for fault in ["duplicate", "panel", "test", "stale", "missing"]:
            with self.subTest(fault=fault):
                payload = ResultBatch(**self.payload)
                if fault == "duplicate": payload.updates.append(payload.updates[0])
                if fault == "panel": payload.updates[1].panel_id = OID()
                if fault == "test": payload.updates[1].test_id = OID()
                if fault == "stale": payload.updates[1].expected = "old"
                if fault == "missing": payload.updates[1].result_id = OID()
                with self.assertRaises(HTTPException):
                    await save_result_batch(str(self.visit.id), payload, self.visit)
                self.collection.bulk_write.assert_not_awaited()

    async def test_race_or_interruption_never_reports_full_success(self):
        self.collection.bulk_write.return_value = NS(matched_count=1)
        with self.assertRaises(HTTPException) as error: await self.save()
        self.assertEqual(error.exception.status_code, 409)
        self.collection.bulk_write.side_effect = AutoReconnect("lost")
        with self.assertRaises(HTTPException) as error: await self.save()
        self.assertEqual(error.exception.status_code, 503)
        self.assertIn("Some may be saved", error.exception.detail)

    def test_bulk_route_is_admin_only_and_rejects_invalid_batches(self):
        from src.main_app import app
        from src.api.deps import get_current_principal, require_visit_access
        client = TestClient(app)
        url = f"/visits/{self.visit.id}/results"
        self.assertEqual(client.put(url, json=self.payload).status_code, 401)
        app.dependency_overrides[get_current_principal] = lambda: {"role": "patient", "id": str(OID())}
        try:
            self.assertEqual(client.put(url, json=self.payload).status_code, 403)
            app.dependency_overrides[get_current_principal] = lambda: {"role": "admin", "id": str(OID())}
            app.dependency_overrides[require_visit_access] = lambda: self.visit
            self.assertEqual(client.put(url, json={"updates": []}).status_code, 422)
            malformed = {"updates": [{**self.payload["updates"][0], "result_id": "invalid"}]}
            self.assertEqual(client.put(url, json=malformed).status_code, 422)
            self.collection.bulk_write.assert_not_awaited()
        finally:
            app.dependency_overrides.pop(get_current_principal, None)
            app.dependency_overrides.pop(require_visit_access, None)


class BrandingTests(unittest.TestCase):
    def test_existing_urls_redirect_to_content_version_and_support_revalidation(self):
        app = FastAPI()
        app.include_router(branding_router.router)
        client = TestClient(app)
        with TemporaryDirectory() as directory, patch.object(branding_router, "BRANDING_DIR", Path(directory)):
            path = Path(directory) / "logo.png"
            path.write_bytes(b"original image")
            (Path(directory) / "signature.png").write_bytes(b"new signature")
            self.assertEqual(client.get("/branding/signature").content, b"new signature")
            redirect = client.get("/branding/logo", follow_redirects=False)
            self.assertEqual(redirect.status_code, 307)
            url = redirect.headers["location"]
            response = client.get(url)
            self.assertEqual(response.content, b"original image")
            self.assertIn("immutable", response.headers["cache-control"])
            self.assertEqual(client.get(url, headers={"If-None-Match": response.headers["etag"]}).status_code, 304)
            path.write_bytes(b"new image content")
            self.assertNotEqual(client.get("/branding/logo", follow_redirects=False).headers["location"], url)
            self.assertEqual(client.get(url).status_code, 404)
            self.assertEqual(client.get("/branding/unknown").status_code, 404)
            self.assertEqual(client.get("/branding/lab_header").status_code, 404)
