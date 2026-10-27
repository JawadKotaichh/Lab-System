import { getApiErrorMessage } from "../../api";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { AuthUser, fetchedInvoiceData } from "../types";
import { fetchInvoice } from "../utils";
import { invoiceGross } from "./invoicePricing";
import Invoice from "./Invoice";
import ShowWithSignature from "../ShowWithSignature";
import LoadingPage from "../LoadingPage/LoadingPage";

export default function InvoiceContainer() {
  const { visit_id } = useParams<{ visit_id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<fetchedInvoiceData | null>(null);
  const [error, setError] = useState("");
  const [showSignature, setShowSignature] = useState(true);
  const [showSignatureOption, setShowSignatureOption] = useState(true);
  const [user] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "null") as AuthUser | null; }
    catch { return null; }
  });
  const isPatient = user?.role === "patient";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError("");
    setShowSignatureOption(!isPatient);
    setShowSignature(true);
    if (!visit_id) {
      setError("Visit not found");
      setLoading(false);
      return;
    }
    fetchInvoice(visit_id).then(response => {
      if (!cancelled) setData(response);
    }).catch(err => {
      if (!cancelled) setError(getApiErrorMessage(err, "Could not load the invoice"));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [visit_id, isPatient]);

  if (loading) return <LoadingPage title="Loading invoice ..." />;
  if (error || !data) return <div role="alert">{error || "Invoice not found"}</div>;
  const invoice = data.invoice_data;
  return (
    <div style={{ width: "100%", height: "800px" }}>
      {!isPatient && showSignatureOption && (
        <ShowWithSignature setShowSignature={setShowSignature} setShowSignatureOption={setShowSignatureOption} />
      )}
      {!showSignatureOption && (
        <Invoice
          invoiceData={invoice}
          invoice_number={invoice.invoice_number}
          adjustment_minor={invoice.adjustment_minor}
          showSignature={showSignature}
          list_of_lab_panels={invoice.list_of_lab_panels}
          patient_insurance_company_rate={invoice.patient_insurance_company_rate}
          patient={data.patient}
          list_of_tests={invoice.list_of_tests}
          total_price={invoiceGross(invoice)}
          visit_date={invoice.visit_date}
          currency={data.currency}
        />
      )}
    </div>
  );
}
