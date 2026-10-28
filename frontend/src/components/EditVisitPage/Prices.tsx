import type { updateInvoiceData } from "../types";
import { FieldError, type FormValidation } from "../FormValidation";
import { invoiceGross } from "../Invoice/invoicePricing";
export { invoiceGross } from "../Invoice/invoicePricing";

type Props = {
  validation: FormValidation;
  updatedInvoiceData: updateInvoiceData;
  currency: string;
  adjustment: string;
  paid: string;
  onAdjustmentChange: (value: string) => void;
  onPaidChange: (value: string) => void;
};

export default function Prices({ validation, updatedInvoiceData, currency, adjustment, paid, onAdjustmentChange, onPaidChange }: Props) {
  const gross = invoiceGross(updatedInvoiceData);
  const net = Math.round((gross + Number(adjustment)) * 1000) / 1000;
  const format = (value: number) => Number.isFinite(value) ? `${value.toLocaleString("en-US", { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })} ${currency === "USD" ? "$" : currency}` : "—";
  return <div className="mt-8 overflow-x-auto"><table className="w-full border bg-white text-center shadow-sm">
    <thead className="bg-gray-100"><tr>{["Total Price", "Adjustment", "Net Total", "Paid", "Remaining"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
    <tbody><tr>
      <td className="border px-4 py-3 font-semibold">{format(gross)}</td>
      <td className="border px-4 py-3"><input {...validation.field("adjustment")} aria-label="Adjustment" type="number" step="0.001" value={adjustment} onChange={e => onAdjustmentChange(e.target.value)} className="w-32 rounded border border-gray-300 px-2 py-2 text-right" /><FieldError validation={validation} name="adjustment" /></td>
      <td className={`border px-4 py-3 font-semibold ${net < 0 ? "text-red-700" : ""}`}>{format(net)}</td>
      <td className="border px-4 py-3"><input {...validation.field("paid")} aria-label="Paid amount" type="number" min="0" step="0.001" value={paid} onChange={e => onPaidChange(e.target.value)} className="w-32 rounded border border-gray-300 px-2 py-2 text-right" /><FieldError validation={validation} name="paid" /></td>
      <td className="border px-4 py-3 font-semibold">{format(Math.max(0, net - Number(paid)))}</td>
    </tr></tbody>
  </table></div>;
}
