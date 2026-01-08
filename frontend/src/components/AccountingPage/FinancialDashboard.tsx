import { useEffect, useMemo, useState } from "react";
import {
  AnalyticsMode,
  AnalyticsQuery,
  AnalyticsSummaryResponse,
  BreakdownRow,
  Currency,
  GranularityUnit,
  SeriesPoint,
  TransactionType,
} from "../types";
import { fetchAnalyticsSummary } from "../utils";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import axios, { AxiosError } from "axios";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYYYYMMDD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function thisMonthYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
function thisYearYYYY() {
  return new Date().getFullYear();
}
function isGranularityUnit(v: string): v is GranularityUnit {
  return v === "hour" || v === "day" || v === "month";
}

function isTransactionType(v: string): v is TransactionType {
  return v === "Income" || v === "Expense";
}

function isCurrency(v: string): v is Currency {
  return v === "USD" || v === "LBP"; // extend if needed
}
function formatBucketLabel(iso: string, unit: GranularityUnit, tz: string) {
  const dt = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    unit === "hour"
      ? { hour: "2-digit", minute: "2-digit" }
      : unit === "day"
      ? { month: "short", day: "2-digit" }
      : { month: "short", year: "numeric" };

  return new Intl.DateTimeFormat(undefined, { ...opts, timeZone: tz }).format(
    dt
  );
}

type ChartRow = {
  label: string;
  income: number;
  expense: number;
  net: number;
};

function seriesToChartData(
  series: SeriesPoint[],
  unit: GranularityUnit,
  tz: string
): ChartRow[] {
  return (series ?? []).map((p) => ({
    label: formatBucketLabel(p.bucket, unit, tz),
    income: p.income,
    expense: p.expense,
    net: p.net,
  }));
}

function sumCategory(b: BreakdownRow[]) {
  // merge Income/Expense rows into totals per category
  const map = new Map<
    string,
    { category: string; income: number; expense: number; net: number }
  >();
  for (const r of b ?? []) {
    const cur = map.get(r.key) ?? {
      category: r.key,
      income: 0,
      expense: 0,
      net: 0,
    };
    if (r.type === "Income") cur.income += r.total;
    else cur.expense += r.total;
    cur.net = cur.income - cur.expense;
    map.set(r.key, cur);
  }
  return Array.from(map.values()).sort(
    (a, b) => Math.abs(b.net) - Math.abs(a.net)
  );
}

export default function FinancialDashboard() {
  // Filters
  const [mode, setMode] = useState<AnalyticsMode>("monthly");
  const [day, setDay] = useState(todayYYYYMMDD());
  const [month, setMonth] = useState(thisMonthYYYYMM());
  const [year, setYear] = useState<number>(thisYearYYYY());
  const [startDate, setStartDate] = useState(todayYYYYMMDD());
  const [endDate, setEndDate] = useState(todayYYYYMMDD());
  const [granularity, setGranularity] = useState<GranularityUnit | "">("");
  const [tz, setTz] = useState("Africa/Tripoli");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "">("");
  const [category, setCategory] = useState("");
  const [txType, setTxType] = useState<TransactionType | "">("");
  const [includeSystem, setIncludeSystem] = useState(true);

  // Data
  const [topN, setTopN] = useState(12);
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // --- Currency tab selection (for charts) ---
  const currencies = useMemo(() => {
    const keys = Object.keys(data?.kpis_by_currency ?? {});
    return keys.sort();
  }, [data]);
  const [activeCurrency, setActiveCurrency] = useState<string>("");

  useEffect(() => {
    if (!activeCurrency && currencies.length) setActiveCurrency(currencies[0]);
    if (
      activeCurrency &&
      currencies.length &&
      !currencies.includes(activeCurrency)
    ) {
      setActiveCurrency(currencies[0]);
    }
  }, [currencies, activeCurrency]);

  // Build query params
  const query = useMemo<AnalyticsQuery>(() => {
    const q: AnalyticsQuery = {
      mode,
      tz,
      include_system: includeSystem,
      top_n: topN,
    };

    if (mode === "daily") q.day = day;
    if (mode === "monthly") q.month = month;
    if (mode === "yearly") q.year = year;
    if (mode === "range") {
      q.start_date = startDate;
      q.end_date = endDate;
    }

    if (granularity) q.granularity = granularity;
    if (currencyFilter) q.currency = currencyFilter;
    if (category.trim()) q.category = category.trim();
    if (txType) q.type = txType;

    return q;
  }, [
    mode,
    tz,
    includeSystem,
    topN,
    day,
    month,
    year,
    startDate,
    endDate,
    granularity,
    currencyFilter,
    category,
    txType,
  ]);

  // Fetch

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setError("");
        setLoading(true);

        const resp = await fetchAnalyticsSummary(query);
        if (!cancelled) setData(resp);
      } catch (err: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError(err)) {
          const ax = err as AxiosError<{ detail?: string }>;
          setError(
            ax.response?.data?.detail ??
              ax.message ??
              "Failed to load analytics"
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const activeSeries = useMemo(() => {
    if (!data) return [];
    const s = data.series_by_currency?.[activeCurrency] ?? [];
    return s;
  }, [data, activeCurrency]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return seriesToChartData(activeSeries, data.unit, data.tz);
  }, [data, activeSeries]);

  const activeBreakdown = useMemo(() => {
    if (!data) return [];
    return data.by_category_by_currency?.[activeCurrency] ?? [];
  }, [data, activeCurrency]);

  const categoryMerged = useMemo(
    () => sumCategory(activeBreakdown),
    [activeBreakdown]
  );
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Financial Dashboard</h1>
        <p className="text-sm text-gray-600">
          {data ? (
            <>
              Range: <span className="font-medium">{data.start_dt}</span> →{" "}
              <span className="font-medium">{data.end_dt_exclusive}</span>{" "}
              (unit: <span className="font-medium">{data.unit}</span>, tz:{" "}
              <span className="font-medium">{data.tz}</span>)
            </>
          ) : (
            "Loading range..."
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Mode</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as AnalyticsMode)}
            >
              <option value="daily">daily</option>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
              <option value="range">range</option>
            </select>
          </div>

          {mode === "daily" && (
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Day</label>
              <input
                type="date"
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
          )}

          {mode === "monthly" && (
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Month</label>
              <input
                type="month"
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          )}

          {mode === "yearly" && (
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Year</label>
              <input
                type="number"
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          )}

          {mode === "range" && (
            <>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Start date</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">End date</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Granularity</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={granularity}
              onChange={(e) => {
                const v = e.target.value;
                setGranularity(v === "" ? "" : isGranularityUnit(v) ? v : "");
              }}
            >
              <option value="">auto</option>
              <option value="hour">hour</option>
              <option value="day">day</option>
              <option value="month">month</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Timezone</label>
            <input
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              placeholder="Africa/Tripoli"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Currency</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={currencyFilter}
              onChange={(e) => {
                const v = e.target.value;
                setCurrencyFilter(v === "" ? "" : isCurrency(v) ? v : "");
              }}
            >
              <option value="">All</option>
              <option value="USD">USD</option>
              <option value="LBP">LBP</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Category</label>
            <input
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Rent, Supplies..."
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Type</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={txType}
              onChange={(e) => {
                const v = e.target.value;
                setTxType(v === "" ? "" : isTransactionType(v) ? v : "");
              }}
            >
              <option value="">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-end gap-2">
            <input
              id="includeSystem"
              type="checkbox"
              className="h-4 w-4"
              checked={includeSystem}
              onChange={(e) => setIncludeSystem(e.target.checked)}
            />
            <label htmlFor="includeSystem" className="text-sm text-gray-700">
              Include VisitBySystem
            </label>
          </div>

          <div className="md:col-span-1">
            <label className="text-xs text-gray-600">Top N</label>
            <input
              type="number"
              min={1}
              max={100}
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {/* KPI cards for all currencies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(data?.kpis_by_currency ?? {}).map(([cur, k]) => (
          <div key={cur} className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{cur}</div>
              <div className="text-xs text-gray-500">
                count: {k.total_count}
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Income</span>
                <span className="font-medium">{k.total_income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expense</span>
                <span className="font-medium">
                  {k.total_expense.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net</span>
                <span
                  className={`font-semibold ${
                    k.net >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {k.net.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Currency Tabs for charts */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {currencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCurrency(c)}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                activeCurrency === c
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Time Series Chart */}
        <div className="h-72">
          {loading ? (
            <div className="h-full grid place-items-center text-gray-600">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMerged.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" />
              <Bar dataKey="expense" />
              <Bar dataKey="net" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category table */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b">
                <th className="py-2">Category</th>
                <th className="py-2">Income</th>
                <th className="py-2">Expense</th>
                <th className="py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {categoryMerged.slice(0, 12).map((r) => (
                <tr key={r.category} className="border-b">
                  <td className="py-2">{r.category}</td>
                  <td className="py-2">{r.income.toFixed(2)}</td>
                  <td className="py-2">{r.expense.toFixed(2)}</td>
                  <td
                    className={`py-2 font-medium ${
                      r.net >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {r.net.toFixed(2)}
                  </td>
                </tr>
              ))}
              {!categoryMerged.length && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={4}>
                    No category data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
