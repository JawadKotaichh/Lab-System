import unittest
from decimal import Decimal
from types import SimpleNamespace as NS
from unittest.mock import AsyncMock, MagicMock, patch

from beanie import PydanticObjectId
from src.api.lab_panel import get_Lab_panel_with_page_size


class PanelPickerTests(unittest.IsolatedAsyncioTestCase):
    async def test_panel_picker_includes_real_distinct_test_ids_for_each_panel(self):
        category_id = PydanticObjectId()
        tests = [NS(id=PydanticObjectId(), name=f"Test {i}", nssf_id=i,
                    lab_test_category_id=category_id, price=Decimal("10"), unit="unit",
                    normal_value_list=[]) for i in range(4)]
        panels = [NS(id=PydanticObjectId(), panel_name=name,
                     list_of_test_type_ids=[test.id for test in tests[i * 2:i * 2 + 2]],
                     nssf_id=i, lab_panel_price=Decimal("20"), lab_panel_category_id=category_id)
                  for i, name in enumerate(["Urine Analysis", "Antibiotic Sensitivity"])]
        panel_query = MagicMock()
        panel_query.count = AsyncMock(return_value=2)
        panel_query.skip.return_value = panel_query
        panel_query.limit.return_value = panel_query
        panel_query.to_list = AsyncMock(return_value=panels)
        with (
            patch("src.api.lab_panel.DBLab_panel", NS(find=MagicMock(return_value=panel_query))),
            patch("src.api.lab_panel.DBLab_test_type", NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=tests))))),
            patch("src.api.lab_panel.DBLab_test_category", NS(find=MagicMock(return_value=NS(to_list=AsyncMock(return_value=[NS(id=category_id, lab_test_category_name="Category")]))))),
        ):
            output = await get_Lab_panel_with_page_size(50, 1, None)
        self.assertEqual(output.TotalNumberOfLabPanels, 2)
        for actual, expected in zip(output.lab_panels, panels):
            self.assertEqual([test.lab_test_id for test in actual.lab_tests], [str(test_id) for test_id in expected.list_of_test_type_ids])
        self.assertTrue(set(t.lab_test_id for t in output.lab_panels[0].lab_tests).isdisjoint(
            t.lab_test_id for t in output.lab_panels[1].lab_tests))


if __name__ == "__main__":
    unittest.main()
