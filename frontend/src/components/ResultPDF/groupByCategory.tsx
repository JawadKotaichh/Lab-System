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
  "blood bank",
  "chemistry",
  "coagulation",
  "serology",
  "endocrinology",
  "immunology",
  "tumor marker",
  "histocompatibility",
  "drugs",
  "histopathology",
  "parasitology",
  "bacteriology",
  "spermograme",
] as const;

const normalizeKey = (s: string) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const categoryRank = new Map<string, number>(
  CATEGORY_PRIORITY.map((c, i) => [normalizeKey(c), i]),
);

const getCategoryRank = (categoryName: string) => {
  const key = normalizeKey(categoryName);
  return categoryRank.has(key)
    ? categoryRank.get(key)!
    : Number.POSITIVE_INFINITY;
};

type PriorityEntry = string | { name: string; type: "panel" | "standalone" };

const ITEM_PRIORITY: Record<string, PriorityEntry[]> = {
  hematology: [
    { name: "cbcd (automated and differential)", type: "panel" },
    "esrytrocytes sedimentation rate(esr)",
    "esr (after 2hrs)",
    "blood film inspection",
    "bleeding time",
    "clotting time",
  ],
  "blood bank": [
    "hiv(i+ii)",
    "hepatitis b surface antigen (hbs ag)",
    "hepatitis c (hcv)",
    "malaria smear",
    "vdrl",
    "ppd test",
  ],
  chemistry: [
    "glucose(fbs)",
    "hba1c",
    "bloo urea nitrogen(bun)",
    "creatinine",
    { name: "electrolyte(na-k-cl-co2)", type: "panel" },
    "uric acid",
    { name: "lipid-profile (chol-tg-hdl)", type: "panel" },
    "cholesterol total",
    "triglycerides",
    "cholesterol hdl",
    "cholesterol ldl",
    "sgot",
    "sgpt",
    "gamma gt",
    "phosphatase alk",
    "amylase",
    "lipase",
    "calcium",
    "magnesium",
    "phosphorus",
  ],
  coagulation: [
    { name: "prothrombin time", type: "panel" },
    "ptt",
    "fibrinogen",
  ],
  serology: ["aso", "crp", "r.a latex"],
  endocrinology: [
    "tsh",
    "freet3 (ft3)",
    "freet4 (ft4)",
    "fsh (follicle stimulating hormone)",
    "lh (luteinizing hormone)",
    "prolactin",
    "testosterone total",
    "testosterone free",
    "psa total",
    "psa free",
    "betta human chronic gonadotropin (bhcg)",
  ],
  immunology: [
    "toxoplasma antibody (igg)",
    "toxoplasma antibody (igm)",
    "rubella antibody igg",
    "rubella antibody igm",
    "cmv igg ab (cytomegalovirus)",
    "cmv igm ab (cytomegalovirus igm)",
    "epsein-barr virus (ebv) igg",
    "epsein-barr virus (ebv) igm",
  ],
  parasitology: [
    { name: "urine analysis", type: "panel" },
    "stool analysis",
    "stool occult blood",
    "fit test",
    "calprotectin (quantitative)",
    "calprotectin (qualitative)",
    "h.pylori in stool",
  ],
  bacteriology: [
    "urine culture",
    "antibiogram (atb)",

    "gram stain",
    "stool culture",
  ],
  spermograme: [{ name: "spermogram", type: "panel" }, "sperme culture"],
};

const itemRankByCategory = new Map<string, Map<string, number>>();

for (const [rawCat, entries] of Object.entries(ITEM_PRIORITY)) {
  const catKey = normalizeKey(rawCat);
  const m = new Map<string, number>();

  entries.forEach((entry, idx) => {
    const type = typeof entry === "string" ? "*" : entry.type;
    const name = typeof entry === "string" ? entry : entry.name;

    const put = (rawName: string) => {
      const k = `${type}|${normalizeKey(rawName)}`;
      if (!m.has(k)) m.set(k, idx);
    };

    put(name);
  });

  itemRankByCategory.set(catKey, m);
}

const hasItemPriority = (categoryName: string) =>
  itemRankByCategory.has(normalizeKey(categoryName));

const getItemRank = (categoryName: string, item: CategoryItem) => {
  const catKey = normalizeKey(categoryName);
  const m = itemRankByCategory.get(catKey);
  if (!m) return Number.POSITIVE_INFINITY;

  const nameKey = normalizeKey(getItemName(item));
  const typedKey = `${item.type}|${nameKey}`;
  const anyKey = `*|${nameKey}`;

  if (m.has(typedKey)) return m.get(typedKey)!;
  if (m.has(anyKey)) return m.get(anyKey)!;
  return Number.POSITIVE_INFINITY;
};

const getItemName = (item: CategoryItem): string => {
  if (item.type === "standalone") {
    return item.test.lab_test_type.name;
  }
  return item.panel.lab_panel_name;
};

export default function groupByCategory(
  list_of_standalone_test_results: patientTestResult[],
  list_of_panel_results: patientPanelResult[],
): GroupedCategory[] {
  const grouped: Record<
    string,
    { standaloneTests: patientTestResult[]; panels: patientPanelResult[] }
  > = {};

  list_of_standalone_test_results.forEach((standAloneTest) => {
    const category_name = standAloneTest.lab_test_type.lab_test_category_name!;
    if (!grouped[category_name]) {
      grouped[category_name] = { standaloneTests: [], panels: [] };
    }
    grouped[category_name].standaloneTests.push(standAloneTest);
  });

  list_of_panel_results.forEach((panel) => {
    const category_name = panel.lab_panel_category_name!;
    if (!grouped[category_name]) {
      grouped[category_name] = { standaloneTests: [], panels: [] };
    }
    grouped[category_name].panels.push(panel);
  });

  const groups: GroupedCategory[] = Object.entries(grouped).map(
    ([category, data]) => {
      const items: CategoryItem[] = [
        ...data.standaloneTests.map(
          (test) => ({ type: "standalone", test }) as const,
        ),
        ...data.panels.map((panel) => ({ type: "panel", panel }) as const),
      ];

      if (hasItemPriority(category)) {
        items.sort((a, b) => {
          const ra = getItemRank(category, a);
          const rb = getItemRank(category, b);
          if (ra !== rb) return ra - rb;

          return normalizeKey(getItemName(a)).localeCompare(
            normalizeKey(getItemName(b)),
          );
        });
      }

      return { category, items };
    },
  );

  groups.sort((a, b) => {
    const ra = getCategoryRank(a.category);
    const rb = getCategoryRank(b.category);
    if (ra !== rb) return ra - rb;

    if (ra === Number.POSITIVE_INFINITY) {
      return normalizeKey(a.category).localeCompare(normalizeKey(b.category));
    }
    return 0;
  });

  return groups;
}
