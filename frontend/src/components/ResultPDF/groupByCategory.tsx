import type { patientPanelResult, patientTestResult } from "../types";

type CategoryItem =
  | { type: "standalone"; test: patientTestResult }
  | { type: "panel"; panel: patientPanelResult };

type GroupedCategory = {
  category: string;
  items: CategoryItem[];
};

const CATEGORY_PRIORITY = [
  "hematology",
  "chemistry",
  "serology",
  "endocrino",
  "hormone",
  "parasitology",
  "bacteriology",
] as const;

const normalizeCategory = (s: string) => s.trim().toLowerCase();

const categoryRank = new Map<string, number>(
  CATEGORY_PRIORITY.map((c, i) => [c, i])
);
const getRank = (categoryName: string) => {
  const normalized_category = normalizeCategory(categoryName);
  return categoryRank.has(normalized_category)
    ? categoryRank.get(normalized_category)!
    : Number.POSITIVE_INFINITY;
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

  const groups: GroupedCategory[] = Object.entries(grouped).map(
    ([category, data]) => ({
      category,
      items: [
        ...data.standaloneTests.map(
          (test) => ({ type: "standalone", test } as const)
        ),
        ...data.panels.map((panel) => ({ type: "panel", panel } as const)),
      ],
    })
  );

  groups.sort((a, b) => {
    const ra = getRank(a.category);
    const rb = getRank(b.category);
    if (ra != rb) return ra - rb;
    if (ra === Number.POSITIVE_INFINITY) {
      return normalizeCategory(a.category).localeCompare(
        normalizeCategory(b.category)
      );
    }
    return 0;
  });

  return groups;
}
