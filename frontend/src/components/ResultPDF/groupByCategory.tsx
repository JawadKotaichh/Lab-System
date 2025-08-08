import type { patientPanelResult, patientTestResult } from "../types";

type CategoryItem =
  | { type: "standalone"; test: patientTestResult }
  | { type: "panel"; panel: patientPanelResult };

type GroupedCategory = {
  category: string;
  items: CategoryItem[];
};
export default function groupByCategory(
  list_of_standalone_test_results: patientTestResult[],
  list_of_panel_results: patientPanelResult[]
): GroupedCategory[] {
  const grouped: Record<
    string,
    { standaloneTests: patientTestResult[]; panels: patientPanelResult[] }
  > = {};
  list_of_standalone_test_results.forEach((standAloneTest) => {
    const category_name = standAloneTest.lab_test_type.lab_test_category_name!;
    if (!grouped[category_name]) {
      grouped[category_name] = {
        standaloneTests: [],
        panels: [],
      };
    }
    grouped[category_name].standaloneTests.push(standAloneTest);
  });

  list_of_panel_results.forEach((panel) => {
    const category_name = panel.lab_panel_category_name!;
    if (!grouped[category_name]) {
      grouped[category_name] = {
        standaloneTests: [],
        panels: [],
      };
    }
    grouped[category_name].panels.push(panel);
  });
  return Object.entries(grouped).map(([category, data]) => ({
    category,
    items: [
      ...data.standaloneTests.map(
        (test) => ({ type: "standalone", test } as const)
      ),
      ...data.panels.map((panel) => ({ type: "panel", panel } as const)),
    ],
  }));
}
