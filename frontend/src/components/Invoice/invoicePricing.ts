import type { labPanel, labTest, updateInvoiceData } from "../types";

export function invoiceTestPrice(invoice: updateInvoiceData, test: labTest): number {
  const basePrice = test.price * (invoice.patient_insurance_company_rate ?? 1);
  // Match the backend and the original Monthly Summary when an override appears twice.
  return invoice.list_of_lab_tests_ids_changed?.reduce(
    (price, item) => String(item.lab_test_id) === String(test.lab_test_id) ? item.new_price : price,
    basePrice,
  ) ?? basePrice;
}

export function invoicePanelPrice(invoice: updateInvoiceData, panel: labPanel): number {
  const basePrice = (panel.lab_panel_price ?? 0) * (invoice.patient_insurance_company_rate ?? 1);
  return invoice.list_of_lab_panels_ids_changed?.reduce(
    (price, item) => String(item.panel_id) === String(panel.id) ? item.new_price : price,
    basePrice,
  ) ?? basePrice;
}

export function invoiceGross(invoice: updateInvoiceData): number {
  return (invoice.list_of_tests ?? []).reduce((sum, test) => sum + invoiceTestPrice(invoice, test), 0)
    + (invoice.list_of_lab_panels ?? []).reduce((sum, panel) => sum + invoicePanelPrice(invoice, panel), 0);
}

export function invoiceNet(invoice: updateInvoiceData): number {
  const gross = invoiceGross(invoice);
  const adjustment = invoice.adjustment_minor ?? 0;
  const net = gross + adjustment;
  // Allow for floating-point error when the subtotal and discount nearly cancel.
  const tolerance = Math.min(1e-8, Number.EPSILON * (Math.abs(gross) + Math.abs(adjustment)) * 1000);
  const scaled = Math.abs(net) * 1000;
  const half = Math.floor(scaled) + 0.5;
  const rounded = Math.abs(scaled - half) <= tolerance ? Math.ceil(half) : Math.round(scaled);
  return Math.sign(net) * rounded / 1000;
}
