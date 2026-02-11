import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import ShowWithSignature from "../ShowWithSignature";
import InvoiceSummaryList from "./InvoiceSummaryList";
import { getMonthlyInvoiceSummary } from "../utils";
import type { fetchedInvoiceData } from "../types";
import LoadingPage from "../LoadingPage/LoadingPage";

type SummaryState = {
  summaryData?: fetchedInvoiceData[];
  currency?: string;
  start_date?: Date | string;
  end_date?: Date | string;
};

const toDate = (value: Date | string | undefined): Date | undefined => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export default function InvoiceSummaryContainer() {
  const location = useLocation();
  const { insurance_company_id } = useParams<{
    insurance_company_id: string;
  }>();
  const state = useMemo(
    () => (location.state || {}) as SummaryState,
    [location.state],
  );

  const stateSummary = useMemo(
    () => (Array.isArray(state.summaryData) ? state.summaryData : []),
    [state.summaryData],
  );
  console.log("summary data is: ", stateSummary);
  const [summaryData, setSummaryData] =
    useState<fetchedInvoiceData[]>(stateSummary);
  const [currency, setCurrency] = useState<string>(
    state.currency ?? stateSummary[0]?.currency ?? "",
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    toDate(state.start_date),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate(state.end_date),
  );
  const [loading, setLoading] = useState<boolean>(stateSummary.length === 0);
  const [error, setError] = useState<string>("");
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showSignatureOption, setShowSignatureOption] = useState<boolean>(true);

  useEffect(() => {
    if (stateSummary.length > 0) {
      setSummaryData(stateSummary);
      setCurrency(state.currency ?? stateSummary[0]?.currency ?? "");
      setStartDate(toDate(state.start_date));
      setEndDate(toDate(state.end_date));
      setLoading(false);
      setError("");
      return;
    }
    if (summaryData.length > 0) return;

    const params = new URLSearchParams(location.search);
    const startParam = params.get("start_date");
    const endParam = params.get("end_date");
    if (!insurance_company_id || !startParam || !endParam) {
      setError("Missing summary filters. Please run the report again.");
      setLoading(false);
      return;
    }
    const parsedStart = toDate(startParam);
    const parsedEnd = toDate(endParam);
    if (!parsedStart || !parsedEnd) {
      setError("Invalid date range.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    getMonthlyInvoiceSummary({
      insurance_company_id,
      start_date: parsedStart,
      end_date: parsedEnd,
    })
      .then((data) => {
        setSummaryData(data);
        setCurrency(data[0]?.currency ?? "");
        setStartDate(parsedStart);
        setEndDate(parsedEnd);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      })
      .finally(() => setLoading(false));
  }, [
    insurance_company_id,
    location.search,
    state.currency,
    state.end_date,
    state.start_date,
    stateSummary,
    stateSummary.length,
    summaryData.length,
  ]);

  if (loading) return <LoadingPage title="Loading summary invoice ..." />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!summaryData.length || !startDate || !endDate) {
    return <div className="p-4">No summary data found.</div>;
  }

  const resolvedCurrency = currency || summaryData[0]?.currency || "";

  return (
    <div style={{ width: "100%", height: "800px" }}>
      {showSignatureOption && (
        <ShowWithSignature
          setShowSignature={setShowSignature}
          setShowSignatureOption={setShowSignatureOption}
        />
      )}
      {!showSignatureOption && (
        <InvoiceSummaryList
          currency={resolvedCurrency}
          end_date={endDate}
          start_date={startDate}
          summaryData={summaryData}
          showSignature={showSignature}
        />
      )}
    </div>
  );
}
