import type {
  lab_panel_changed,
  lab_test_changed,
  labPanel,
  labTest,
} from "../types";

export default function getTotalPrice(
  patient_insurance_company_rate: number,
  listOfLabTests: labTest[],
  listOfLabPanels: labPanel[],
  listOfLabTestsIdsChanged: lab_test_changed[] = [],
  listOfLabPanelsIdsChanged: lab_panel_changed[] = []
): number {
  const testOverrides = new Map<string, number>();
  listOfLabTestsIdsChanged.forEach((item) => {
    testOverrides.set(String(item.lab_test_id), item.new_price);
  });

  const panelOverrides = new Map<string, number>();
  listOfLabPanelsIdsChanged.forEach((item) => {
    panelOverrides.set(String(item.panel_id), item.new_price);
  });

  const totalTests = listOfLabTests.reduce((sum, test) => {
    const override = testOverrides.get(String(test.lab_test_id));
    if (override !== undefined) return sum + override;
    return sum + test.price * patient_insurance_company_rate;
  }, 0);

  const totalPanels = listOfLabPanels.reduce((sum, panel) => {
    const override = panelOverrides.get(String(panel.id));
    if (override !== undefined) return sum + override;
    return sum + (panel.lab_panel_price ?? 0) * patient_insurance_company_rate;
  }, 0);

  const total = totalTests + totalPanels;
  return total;
}
