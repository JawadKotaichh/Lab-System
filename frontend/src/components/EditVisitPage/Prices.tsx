import React, { useEffect, useRef, useState } from "react";
import { type patientInfo, type updateInvoiceData } from "../types.js";
import { useDebounce } from "../react-table/Debounce";
import {
  fetchInvoice,
  getInsuranceCompanyRate,
  updateInvoice,
} from "../utils.js";

interface PricesParams {
  updatedInvoiceData: updateInvoiceData;
  setUpdatedInvoiceData: React.Dispatch<
    React.SetStateAction<updateInvoiceData>
  >;
  currency: string;
  visit_id: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  patientData: patientInfo;
}
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const Prices: React.FC<PricesParams> = ({
  updatedInvoiceData,
  setError,
  visit_id,
  patientData,
  setUpdatedInvoiceData,
  currency,
}) => {
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [patientInsuranceCompanyRate, setPatientInsuranceCompanyRate] =
    useState<number>(0);

  const [draftAdjustment, setDraftAdjustment] = useState<number>(
    updatedInvoiceData.adjustment_minor ?? 0
  );
  const prevSyncedAdjustment = useRef<number>(
    updatedInvoiceData.adjustment_minor ?? 0
  );
  const debouncedAdjustment = useDebounce(draftAdjustment, 1500);

  const [draftTotalPaid, setDraftTotalPaid] = useState<number>(
    updatedInvoiceData.total_paid ?? 0
  );
  const prevSyncedTotalPaid = useRef<number>(
    updatedInvoiceData.total_paid ?? 0
  );
  const debouncedTotalPaid = useDebounce(draftTotalPaid, 1500);

  const roundTo = (value: number, decimals: number) =>
    Number(value.toFixed(decimals));

  const gross = totalPrice * patientInsuranceCompanyRate;

  const netTotal = gross + draftAdjustment;
  console.log("netTotal: ", netTotal);
  console.log("gross: ", gross);
  console.log("patientInsuranceCompanyRate: ", patientInsuranceCompanyRate);
  console.log("totalPrice: ", totalPrice);

  const safePaid = Math.max(0, draftTotalPaid);
  const remaining = netTotal - safePaid;

  const formatMoney = (value: number) => {
    if (currency === "USD") return `${roundTo(value, 2)} $`;
    return `${Math.round(value).toLocaleString("en-US")} LBP`;
  };

  useEffect(() => {
    const tests = updatedInvoiceData.list_of_tests ?? [];
    const panels = updatedInvoiceData.list_of_lab_panels ?? [];

    const testsTotal = tests.reduce(
      (sum, t) => sum + (Number(t?.price) || 0),
      0
    );
    const panelsTotal = panels.reduce(
      (sum, p) => sum + (Number(p?.lab_panel_price) || 0),
      0
    );

    setTotalPrice(testsTotal + panelsTotal);
  }, [updatedInvoiceData.list_of_tests, updatedInvoiceData.list_of_lab_panels]);

  useEffect(() => {
    const loadRate = async () => {
      setError("");
      try {
        const rate = await getInsuranceCompanyRate(patientData.patient_id);
        setPatientInsuranceCompanyRate(rate);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load insurance rate"
        );
      }
    };
    loadRate();
  }, [patientData.patient_id, setError]);

  useEffect(() => {
    const synced = updatedInvoiceData.adjustment_minor ?? 0;
    prevSyncedAdjustment.current = synced;
    setDraftAdjustment(synced);
  }, [updatedInvoiceData.adjustment_minor]);

  useEffect(() => {
    const synced = updatedInvoiceData.total_paid ?? 0;
    prevSyncedTotalPaid.current = synced;
    setDraftTotalPaid(synced);
  }, [updatedInvoiceData.total_paid]);

  useEffect(() => {
    const sync = async () => {
      const payload: Partial<updateInvoiceData> = {};

      const safeDebouncedAdjustement = Math.min(
        100,
        Math.max(0, debouncedAdjustment)
      );
      const safeDebouncedPaid = Math.max(0, debouncedTotalPaid);

      if (safeDebouncedAdjustement !== prevSyncedAdjustment.current) {
        payload.adjustment_minor = safeDebouncedAdjustement;
      }
      if (safeDebouncedPaid !== prevSyncedTotalPaid.current) {
        payload.total_paid = safeDebouncedPaid;
      }

      if (Object.keys(payload).length === 0) return;

      try {
        await updateInvoice(visit_id, payload);
        const fetched = await fetchInvoice(visit_id);
        setUpdatedInvoiceData(fetched.invoice_data);

        prevSyncedAdjustment.current =
          fetched.invoice_data.adjustment_minor ?? 0;
        prevSyncedTotalPaid.current = fetched.invoice_data.total_paid ?? 0;
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) setError(err.message);
      }
    };

    sync();
  }, [
    debouncedAdjustment,
    debouncedTotalPaid,
    visit_id,
    setError,
    setUpdatedInvoiceData,
  ]);

  const handleAdjustmentInputChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return setDraftAdjustment(0);

    setDraftAdjustment(clamp(parsed, 0, 100));
  };
  const handleTotalPaidChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return setDraftTotalPaid(0);

    setDraftTotalPaid(clamp(parsed, 0, netTotal));
  };

  return (
    <table className="border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-10">
      <thead className="bg-gray-300 border-b border-black top-0 z-10">
        <tr>
          <th className="h-8 px-0 py-2">Total Price</th>
          <th className="h-8 px-0 py-2">Adjustment</th>
          <th className="h-8 px-0 py-2">Net Total</th>
          <th className="h-8 px-0 py-2">Paid</th>
          <th className="h-8 px-0 py-2">Remaining</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border rounded-b-sm px-4 py-2 font-bold">
            {formatMoney(gross)}
          </td>

          <td className="border rounded-b-sm px-4 py-2 font-bold">
            <label>
              <span>
                <input
                  value={draftAdjustment}
                  type="number"
                  onChange={(e) => handleAdjustmentInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="w-16 text-right"
                />
              </span>
              <span className="ml-1 select-none">
                {currency === "USD" ? "$" : "LBP"}
              </span>
            </label>
          </td>

          <td className="border rounded-b-sm px-4 py-2 font-bold">
            {formatMoney(netTotal)}
          </td>

          <td className="border rounded-b-sm px-4 py-2 font-bold">
            <label>
              <span>
                <input
                  value={draftTotalPaid}
                  type="number"
                  onChange={(e) => handleTotalPaidChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="w-24 text-right"
                  min={0}
                  max={netTotal}
                  step={currency === "USD" ? 0.01 : 1}
                />
              </span>
              <span className="ml-2 select-none">
                {currency === "USD" ? "$" : "LBP"}
              </span>
            </label>
          </td>

          <td className="border rounded-b-sm px-4 py-2 font-bold">
            {formatMoney(remaining)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Prices;
