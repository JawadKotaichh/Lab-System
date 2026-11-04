import { getApiErrorMessage } from "../../api";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import ShowWithSignature from "../ShowWithSignature";
import InvoiceSummaryList from "./InvoiceSummaryList";
import { getMonthlyInvoiceSummary } from "../utils";
import type { MonthlyInvoiceSummary } from "../types";
import LoadingPage from "../LoadingPage/LoadingPage";
import { invoiceNet } from "../Invoice/invoicePricing";
import { displayMoneyUnits } from "../Invoice/amountToWords";

export default function InvoiceSummaryContainer() {
  const { search } = useLocation();
  const { insurance_company_id } = useParams<{ insurance_company_id: string }>();
  const filters = new URLSearchParams(search);
  const startDate = filters.get("start_date");
  const endDate = filters.get("end_date");

  if (!insurance_company_id || !startDate || !endDate) {
    return <p className="p-4">Missing summary filters. Please run the report again.</p>;
  }
  if (!Number.isFinite(Date.parse(startDate)) || !Number.isFinite(Date.parse(endDate))) {
    return <p className="p-4">Invalid date range.</p>;
  }

  return <InvoiceSummaryReport
    key={JSON.stringify([insurance_company_id, startDate, endDate])}
    insurerId={insurance_company_id}
    startDate={startDate}
    endDate={endDate}
  />;
}

function InvoiceSummaryReport({ insurerId, startDate, endDate }: {
  insurerId: string;
  startDate: string;
  endDate: string;
}) {
  const [report, setReport] = useState<MonthlyInvoiceSummary>();
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [showSignature, setShowSignature] = useState(true);
  const [showSignatureOption, setShowSignatureOption] = useState(true);

  useEffect(() => {
    const request = new AbortController();
    getMonthlyInvoiceSummary({
      insurance_company_id: insurerId,
      start_date: startDate,
      end_date: endDate,
    }, request.signal).then(data => {
      if (!request.signal.aborted) setReport(data);
    }).catch(err => {
      if (!request.signal.aborted) setError(getApiErrorMessage(err, "Failed to load summary"));
    });
    return () => request.abort();
  }, [insurerId, startDate, endDate]);

  if (error) return <div role="alert" className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>;
  if (!report) return <LoadingPage title="Loading summary invoice ..." />;
  if (report.unavailable_invoice_numbers.length) {
    return (
      <p role="alert" className="m-4 rounded border border-red-300 bg-red-50 p-3">
        Could not generate the summary for invoices {report.unavailable_invoice_numbers.join(", ")}.
      </p>
    );
  }

  const billableInvoices = report.invoices.filter(invoice =>
    displayMoneyUnits(invoiceNet(invoice.invoice_data), invoice.currency) !== 0 ||
    Boolean(invoice.invoice_data.adjustment_minor)
  );
  const currencies = [...new Set(billableInvoices.map(invoice => invoice.currency))];
  const currency = selectedCurrency || currencies[0];
  const rows = billableInvoices.filter(invoice => invoice.currency === currency);

  return (
    <div>
      {!rows.length ? (
        <p className="p-4">{report.invoices.length
          ? "Invoices found, but none have a billable amount."
          : "No invoices found for this date range."}</p>
      ) : (
        <>
          {currencies.length > 1 && (
            <label className="m-4 block">Report currency{" "}
              <select value={currency} onChange={event => setSelectedCurrency(event.target.value)}>
                {currencies.map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
          )}
          {showSignatureOption ? (
            <ShowWithSignature
              setShowSignature={setShowSignature}
              setShowSignatureOption={setShowSignatureOption}
            />
          ) : (
            <div style={{ width: "100%", height: "800px" }}>
              <InvoiceSummaryList
                currency={currency}
                start_date={new Date(startDate)}
                end_date={new Date(endDate)}
                summaryData={rows}
                showSignature={showSignature}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
