import type { labPanel, labTest } from "../types";

export default function getTotalPrice(
  patient_insurance_company_rate:number,
  discount_percentage:number,
    listOfLabTests: labTest[],
  listOfLabPanels: labPanel[]
): number {
  const totalTests = listOfLabTests.reduce((sum, test) => sum + test.price, 0) * patient_insurance_company_rate;
  const totalPanels = listOfLabPanels.reduce((sum, panel) => sum + panel.lab_panel_price!, 0) * patient_insurance_company_rate;
  const total = totalTests + totalPanels;
  const total_after_discount = total - (total*(discount_percentage/100));
  return total_after_discount;
}