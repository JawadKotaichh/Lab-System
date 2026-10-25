import React, { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../../api.js";
import SaveFeedback, { type SaveState } from "./SaveFeedback.js";
import {
  type lab_panel_changed,
  type lab_test_changed,
  type patientInfo,
  type updateInvoiceData,
} from "../types.js";
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
  const [billingSave, setBillingSave] = useState<SaveState>({ status: "idle" });
  const [savingBilling, setSavingBilling] = useState(false);
  const [retrySave, setRetrySave] = useState(0);

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
  const moneyDecimals = 3;
  const roundMoney = (value: number) => roundTo(value, moneyDecimals);

  const gross = roundMoney(totalPrice * patientInsuranceCompanyRate);

  const netTotal = roundMoney(gross + draftAdjustment);
  const safePaid = roundMoney(Math.max(0, draftTotalPaid));
  const remaining = roundMoney(Math.max(0, netTotal - safePaid));

  const formatMoney = (value: number) => {
    if (currency === "USD") return `${roundMoney(value).toFixed(3)} $`;
    return `${roundMoney(value).toLocaleString("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} LBP`;
  };

  useEffect(() => {
    const tests = updatedInvoiceData.list_of_tests ?? [];
    const panels = updatedInvoiceData.list_of_lab_panels ?? [];
    const testOverrides = new Map<string, number>();
    (updatedInvoiceData.list_of_lab_tests_ids_changed ?? []).forEach(
      (item: lab_test_changed) => {
        testOverrides.set(String(item.lab_test_id), Number(item.new_price) || 0);
      },
    );
    const panelOverrides = new Map<string, number>();
    (updatedInvoiceData.list_of_lab_panels_ids_changed ?? []).forEach(
      (item: lab_panel_changed) => {
        panelOverrides.set(String(item.panel_id), Number(item.new_price) || 0);
      },
    );

    const testsTotal = tests.reduce((sum, t) => {
      const base = Number(t?.price) || 0;
      const override = testOverrides.get(String(t?.lab_test_id));
      return sum + (override ?? base);
    }, 0);

    const panelsTotal = panels.reduce((sum, p) => {
      const base = Number(p?.lab_panel_price) || 0;
      const override = panelOverrides.get(String(p?.id));
      return sum + (override ?? base);
    }, 0);

    setTotalPrice(testsTotal + panelsTotal);
  }, [
    updatedInvoiceData.list_of_tests,
    updatedInvoiceData.list_of_lab_panels,
    updatedInvoiceData.list_of_lab_tests_ids_changed,
    updatedInvoiceData.list_of_lab_panels_ids_changed,
  ]);

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

      const safeDebouncedPaid = Math.max(0, debouncedTotalPaid);
      if (debouncedAdjustment !== prevSyncedAdjustment.current) {
        payload.adjustment_minor = debouncedAdjustment;
      }

      if (safeDebouncedPaid !== prevSyncedTotalPaid.current) {
        payload.total_paid = safeDebouncedPaid;
      }

      if (Object.keys(payload).length === 0) {
        setBillingSave((previous) => previous.status === "saving"
          ? { status: "saved", message: "Billing is up to date" }
          : previous);
        return;
      }

      setSavingBilling(true);
      setBillingSave({ status: "saving", message: "Saving billing changes…" });
      try {
        await updateInvoice(visit_id, payload);
        const fetched = await fetchInvoice(visit_id);
        setUpdatedInvoiceData(fetched.invoice_data);

        prevSyncedAdjustment.current =
          fetched.invoice_data.adjustment_minor ?? 0;
        prevSyncedTotalPaid.current = fetched.invoice_data.total_paid ?? 0;
        setBillingSave({ status: "saved", message: "Billing changes saved" });
      } catch (err: unknown) {
        console.error(err);
        setBillingSave({ status: "error", message: getApiErrorMessage(err, "Billing changes could not be saved. Your edits are kept.") });
      } finally {
        setSavingBilling(false);
      }
    };

    sync();
  }, [
    debouncedAdjustment,
    debouncedTotalPaid,
    visit_id,
    setError,
    setUpdatedInvoiceData,
    retrySave,
  ]);

  const handleAdjustmentInputChange = (value: string) => {
    const parsed = Number(value);
    const next = Number.isFinite(parsed) ? parsed : 0;
    setDraftAdjustment(next);
    setBillingSave(next === prevSyncedAdjustment.current && draftTotalPaid === prevSyncedTotalPaid.current
      ? { status: "saved", message: "Billing is up to date" }
      : { status: "saving", message: "Waiting to save billing changes…" });
  };
  const handleTotalPaidChange = (value: string) => {
    const parsed = Number(value);
    const next = Number.isFinite(parsed) ? clamp(parsed, 0, netTotal) : 0;
    setDraftTotalPaid(next);
    setBillingSave(next === prevSyncedTotalPaid.current && draftAdjustment === prevSyncedAdjustment.current
      ? { status: "saved", message: "Billing is up to date" }
      : { status: "saving", message: "Waiting to save billing changes…" });
  };

  return (
    <table className="border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-10">
      <caption className="caption-bottom p-3 text-left">
        <span className="mr-3 text-sm text-gray-500">Adjustment and payment save automatically.</span>
        <SaveFeedback state={billingSave} onRetry={() => setRetrySave((attempt) => attempt + 1)} />
      </caption>
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
                  disabled={savingBilling}
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
                  disabled={savingBilling}
                  onChange={(e) => handleTotalPaidChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="w-24 text-right"
                  min={0}
                  max={netTotal + 0.1}
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
