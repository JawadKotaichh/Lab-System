import type { labPanel, labTest, updateInvoiceData } from "../types";

export function invoiceTestPrice(invoice: updateInvoiceData, test: labTest): number {
  return invoice.list_of_lab_tests_ids_changed?.find(item => item.lab_test_id === test.lab_test_id)?.new_price
    ?? test.price * (invoice.patient_insurance_company_rate ?? 1);
}

export function invoicePanelPrice(invoice: updateInvoiceData, panel: labPanel): number {
  return invoice.list_of_lab_panels_ids_changed?.find(item => item.panel_id === panel.id)?.new_price
    ?? (panel.lab_panel_price ?? 0) * (invoice.patient_insurance_company_rate ?? 1);
}

export function invoiceGross(invoice: updateInvoiceData): number {
  return (invoice.list_of_tests ?? []).reduce((sum, test) => sum + invoiceTestPrice(invoice, test), 0)
    + (invoice.list_of_lab_panels ?? []).reduce((sum, panel) => sum + invoicePanelPrice(invoice, panel), 0);
}

export function invoiceNet(invoice: updateInvoiceData): number {
  return Math.round((invoiceGross(invoice) + (invoice.adjustment_minor ?? 0)) * 1000) / 1000;
}
