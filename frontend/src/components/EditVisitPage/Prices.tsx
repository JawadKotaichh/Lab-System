import React, { useEffect, useState } from "react";

import { type patientInfo, type updateInvoiceData } from "../types.js";
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
}) => {
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [patientInsuranceCompanyRate, setPatientInsuranceCompanyRate] =
    useState<number>(0);
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

  const handleDiscountPercentageChange = async (
    newDiscountPercentageStr: string,
    visit_id: string
  ) => {
    try {
      const discount = Number(newDiscountPercentageStr || 0);
      await updateInvoice(visit_id, { discount_percentage: discount });
      const fetched_invoice = await fetchInvoice(visit_id);
      setUpdatedInvoiceData(fetched_invoice.invoice_data);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
    }
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
            {totalPrice * patientInsuranceCompanyRate} $
          </td>
          <td className="border rounded-b-sm  px-4 py-2 font-bold">
            <label>
              <span>
                <input
                  value={updatedInvoiceData.discount_percentage}
                  type="number"
                  onChange={(e) =>
                    handleDiscountPercentageChange(e.target.value, visit_id)
                  }
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
            {totalPrice * patientInsuranceCompanyRate -
              totalPrice *
                patientInsuranceCompanyRate *
                (updatedInvoiceData.discount_percentage! / 100)}{" "}
            $
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Prices;
