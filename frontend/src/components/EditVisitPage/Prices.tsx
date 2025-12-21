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
  const [draftDiscount, setDraftDiscount] = useState<number>(
    updatedInvoiceData.discount_percentage ?? 0
  );
  const prevSyncedDiscount = useRef<number>(
    updatedInvoiceData.discount_percentage ?? 0
  );
  const debouncedDiscount = useDebounce(draftDiscount, 1500);
  const roundTo = (value: number, decimals: number) =>
    Number(value.toFixed(decimals));
  useEffect(() => {
    const load = async () => {
      setError("");
      try {
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

        const rate = await getInsuranceCompanyRate(patientData.patient_id);
        setPatientInsuranceCompanyRate(rate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    };
    load();
  }, [updatedInvoiceData, patientData.patient_id, setError]);

  useEffect(() => {
    const synced = updatedInvoiceData.discount_percentage ?? 0;
    prevSyncedDiscount.current = synced;
    setDraftDiscount(synced);
  }, [updatedInvoiceData.discount_percentage]);

  useEffect(() => {
    const applyDiscountUpdate = async () => {
      if (debouncedDiscount === prevSyncedDiscount.current) return;
      try {
        const discount = debouncedDiscount;
        await updateInvoice(visit_id, { discount_percentage: discount });
        const fetched_invoice = await fetchInvoice(visit_id);
        setUpdatedInvoiceData(fetched_invoice.invoice_data);
        prevSyncedDiscount.current =
          fetched_invoice.invoice_data.discount_percentage ?? 0;
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) setError(err.message);
      }
    };
    applyDiscountUpdate();
  }, [debouncedDiscount, visit_id, setError, setUpdatedInvoiceData]);

  const handleDiscountInputChange = (value: string) => {
    const parsed = Number(value);
    setDraftDiscount(Number.isNaN(parsed) ? 0 : parsed);
  };

  return (
    <table className="border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-10">
      <thead className="bg-gray-300 border-b border-black top-0 z-10">
        <tr>
          <th className="h-8 px-0 py-2">Total Price</th>
          <th className="h-8 px-0 py-2">Discount</th>
          <th className="h-8 px-0 py-2">Net Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border rounded-b-sm  px-4 py-2 font-bold">
            {currency === "USD"
              ? `${roundTo(totalPrice * patientInsuranceCompanyRate, 2)} $`
              : `${totalPrice * patientInsuranceCompanyRate} LBP`}
          </td>
          <td className="border rounded-b-sm  px-4 py-2 font-bold">
            <label>
              <span>
                <input
                  value={draftDiscount}
                  type="number"
                  onChange={(e) => handleDiscountInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-13 text-right"
                />
              </span>
              <span className="ml-1 select-none">%</span>
            </label>
          </td>
          <td className="border rounded-b-sm  px-4 py-2 font-bold">
            {currency === "USD"
              ? `${roundTo(
                  totalPrice * patientInsuranceCompanyRate -
                    totalPrice *
                      patientInsuranceCompanyRate *
                      (updatedInvoiceData.discount_percentage! / 100),
                  2
                )} $`
              : `${
                  totalPrice * patientInsuranceCompanyRate -
                  totalPrice *
                    patientInsuranceCompanyRate *
                    (updatedInvoiceData.discount_percentage! / 100)
                } LBP`}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Prices;
