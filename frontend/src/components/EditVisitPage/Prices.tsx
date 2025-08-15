import React, { useEffect, useState } from "react";

import {
  type patientInfo,
  type patientPanelResult,
  type patientTestResult,
  type updateInvoiceData,
} from "../types.js";
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
  panelResults: patientPanelResult[];
  standAloneTestResults: patientTestResult[];
  patientData: patientInfo;
}
const Prices: React.FC<PricesParams> = ({
  updatedInvoiceData,
  setError,
  visit_id,
  standAloneTestResults,
  panelResults,
  patientData,
  setUpdatedInvoiceData,
}) => {
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [patientInsuranceCompanyRate, setPatientInsuranceCompanyRate] =
    useState<number>(0);
  useEffect(() => {
    const loadPage = async () => {
      // setLoading(true);
      setError("");
      try {
        const testsTotal = standAloneTestResults.reduce(
          (sum, t) => sum + (Number(t?.lab_test_type?.price) || 0),
          0
        );

        const panelsTotal = panelResults.reduce(
          (sum, p) => sum + (Number(p?.lab_panel_price) || 0),
          0
        );
        setTotalPrice(testsTotal + panelsTotal);
        const patient_insurance_rate = await getInsuranceCompanyRate(
          patientData.patient_id
        );
        setPatientInsuranceCompanyRate(patient_insurance_rate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
      // finally {
      //   setLoading(false);
      // }
    };

    loadPage();
  }, [
    panelResults,
    patientData.patient_id,
    setError,
    standAloneTestResults,
    visit_id,
  ]);

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
