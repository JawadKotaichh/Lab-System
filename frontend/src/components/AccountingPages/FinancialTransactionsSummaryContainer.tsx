import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import ShowWithSignature from "../ShowWithSignature";
import FinancialTransactionsSummaryList from "./FinancialTransactionsSummaryList";
import { getFinancialTransactionsSummary } from "../utils";
import LoadingPage from "../LoadingPage/LoadingPage";
import type {
  financialTransaction,
  financial_transaction_summary,
} from "../types";

type SummaryState = {
  summaryData?: financial_transaction_summary;
  currency?: string;
  start_date?: Date | string;
  end_date?: Date | string;
  category?: string;
  type?: string;
};

const parseDateLocal = (value: Date | string | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? undefined : value;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? undefined : dt;
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

const normalizeAll = (v?: string) => (!v || v === "ALL" ? undefined : v);

const firstKey = (
  obj: Record<string, unknown> | undefined
): string | undefined => (obj ? Object.keys(obj)[0] : undefined);

export default function FinancialTransactionsSummaryContainer() {
  const location = useLocation();
  const params = useParams();

  const navState = useMemo<SummaryState>(() => {
    return (location.state || {}) as SummaryState;
  }, [location.state]);

  const query = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return {
      startParam: qs.get("start_date") ?? undefined,
      endParam: qs.get("end_date") ?? undefined,
      currencyParam: qs.get("currency") ?? undefined,
      categoryParam: qs.get("category") ?? undefined,
    };
  }, [location.search]);

  const routeType = (params.type ?? "").trim();

  const [summary, setSummary] = useState<financial_transaction_summary | null>(
    navState.summaryData ?? null
  );

  const [currency, setCurrency] = useState<string>(
    navState.currency ?? query.currencyParam ?? ""
  );
  const [category, setCategory] = useState<string>(
    navState.category ?? query.categoryParam ?? ""
  );
  const [type, setType] = useState<string>(navState.type ?? routeType ?? "");

  const [startDate, setStartDate] = useState<Date | undefined>(
    parseDateLocal(navState.start_date) ?? parseDateLocal(query.startParam)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseDateLocal(navState.end_date) ?? parseDateLocal(query.endParam)
  );

  const [loading, setLoading] = useState<boolean>(
    !navState.summaryData && !(query.startParam && query.endParam)
  );
  const [error, setError] = useState<string>("");

  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showSignatureOption, setShowSignatureOption] = useState<boolean>(true);

  const derived = useMemo(() => {
    if (!summary)
      return {
        list: [] as financialTransaction[],
        resolvedCurrency: "",
        resolvedCategory: "",
      };

    const byCurrency = summary.by_currency ?? {};
    const resolvedCurrency =
      normalizeAll(currency) ?? firstKey(byCurrency) ?? "";
    const catsObj =
      resolvedCurrency && byCurrency[resolvedCurrency]
        ? byCurrency[resolvedCurrency]
        : undefined;

    const resolvedCategory = normalizeAll(category) ?? firstKey(catsObj) ?? "";

    let list: financialTransaction[] = [];
    if (resolvedCurrency && catsObj) {
      if (resolvedCategory) {
        list = catsObj[resolvedCategory] ?? [];
      } else {
        list = Object.values(catsObj).flat();
      }
    }

    return { list, resolvedCurrency, resolvedCategory };
  }, [summary, currency, category]);

  useEffect(() => {
    if (navState.summaryData) {
      setSummary(navState.summaryData);
      setType(navState.type ?? routeType);
      setCurrency(navState.currency ?? query.currencyParam ?? "");
      setCategory(navState.category ?? query.categoryParam ?? "");
      setStartDate(
        parseDateLocal(navState.start_date) ?? parseDateLocal(query.startParam)
      );
      setEndDate(
        parseDateLocal(navState.end_date) ?? parseDateLocal(query.endParam)
      );
      setLoading(false);
      setError("");
      return;
    }

    if (!query.startParam || !query.endParam) {
      setError("Missing summary filters. Please run the report again.");
      setLoading(false);
      return;
    }

    const parsedStart = parseDateLocal(query.startParam);
    const parsedEnd = parseDateLocal(query.endParam);
    if (!parsedStart || !parsedEnd) {
      setError("Invalid date range.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    getFinancialTransactionsSummary({
      start_date: query.startParam,
      end_date: query.endParam,
      type: routeType,
      currency: normalizeAll(query.currencyParam),
      category: normalizeAll(query.categoryParam),
    })
      .then((res) => {
        setSummary(res);
        setType(routeType);
        setCurrency(query.currencyParam ?? "");
        setCategory(query.categoryParam ?? "");
        setStartDate(parsedStart);
        setEndDate(parsedEnd);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      })
      .finally(() => setLoading(false));
  }, [
    navState.summaryData,
    navState.currency,
    navState.category,
    navState.start_date,
    navState.end_date,
    query.startParam,
    query.endParam,
    query.currencyParam,
    query.categoryParam,
    routeType,
    navState.type,
  ]);

  if (loading)
    return <LoadingPage title="Loading financial transactions summary..." />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!summary || !startDate || !endDate)
    return <div className="p-4">No summary data found.</div>;

  return (
    <div style={{ width: "100%", height: "800px" }}>
      {showSignatureOption && (
        <ShowWithSignature
          setShowSignature={setShowSignature}
          setShowSignatureOption={setShowSignatureOption}
        />
      )}

      {!showSignatureOption && (
        <FinancialTransactionsSummaryList
          category={derived.resolvedCategory}
          type={type}
          currency={derived.resolvedCurrency}
          end_date={endDate}
          start_date={startDate}
          summaryData={derived.list}
          showSignature={showSignature}
        />
      )}
    </div>
  );
}
