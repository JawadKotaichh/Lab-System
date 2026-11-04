import type { updateInvoiceData } from "../types";
import { FieldError, type FormValidation } from "../FormValidation";
import { invoiceNet } from "../Invoice/invoicePricing";
export { invoiceGross, invoiceNet } from "../Invoice/invoicePricing";

type Props = {
  validation: FormValidation;
  updatedInvoiceData: updateInvoiceData;
  currency: string;
  finalTotal?: string;
  paid: string;
  onFinalTotalChange: (value: string) => void;
  onResetTotal: () => void;
  onPaidChange: (value: string) => void;
};

export default function Prices({ validation, updatedInvoiceData, currency, finalTotal, paid, onFinalTotalChange, onResetTotal, onPaidChange }: Props) {
  const gross = invoiceNet({ ...updatedInvoiceData, adjustment_minor: 0 });
  const totalInput = finalTotal ?? String(invoiceNet(updatedInvoiceData));
  const net = totalInput.trim() ? Number(totalInput) : NaN;
  const difference = (Math.round(net * 1000) - Math.round(gross * 1000)) / 1000;
  const format = (value: number) => Number.isFinite(value) ? `${value.toLocaleString("en-US", { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: 3 })} ${currency === "USD" ? "$" : currency}` : "—";
  return <div className="mt-8 overflow-x-auto"><table className="w-full border bg-white text-center shadow-sm">
    <thead className="bg-gray-100"><tr>{["Subtotal", "Final invoice total", "Discount / Surcharge", "Paid", "Remaining"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
    <tbody><tr>
      <td className="border px-4 py-3 font-semibold">{format(gross)}</td>
      <td className="border px-4 py-3">
        <input {...validation.field("finalTotal")} aria-label="Final invoice total" type="number" min="0.001" step="0.001" value={totalInput} onChange={e => onFinalTotalChange(e.target.value)} className="w-32 rounded border border-gray-300 px-2 py-2 text-right" />
        <FieldError validation={validation} name="finalTotal" />
        <button type="button" onClick={onResetTotal} className="mt-1 block w-full text-sm text-blue-700">Reset to subtotal</button>
      </td>
      <td className="border px-4 py-3">{difference < 0 ? `Discount: ${format(-difference)}` : difference > 0 ? `Surcharge: ${format(difference)}` : "—"}</td>
      <td className="border px-4 py-3"><input {...validation.field("paid")} aria-label="Paid amount" type="number" min="0" step="0.001" value={paid} onChange={e => onPaidChange(e.target.value)} className="w-32 rounded border border-gray-300 px-2 py-2 text-right" /><FieldError validation={validation} name="paid" /></td>
      <td className="border px-4 py-3 font-semibold">{format(Math.max(0, net - Number(paid)))}</td>
    </tr></tbody>
  </table></div>;
}
