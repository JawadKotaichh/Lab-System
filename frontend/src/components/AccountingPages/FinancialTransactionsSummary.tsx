import {
  BadgeDollarSign,
  CalendarDays,
  Coins,
  FileText,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  iconStyle,
  inputForm,
  inputFormAttributeList,
  inputFormAttributeListItem,
  inputFormAttributeListItemInput,
  inputFormAttributeListItemLabel,
  inputFormSave,
  inputFormTitle,
  stateStyle,
} from "../../style";
import { listOfAttributesFinancialTransactionSummary } from "../data";
import { useEffect, useState } from "react";
import type {
  financialTransactionsSummaryParams,
  transactionCategory,
  transactionCurrency,
  transactionType,
} from "../types";
import {
  fetchAllfinancialTransactionsCategories,
  fetchAllfinancialTransactionsCurrencies,
  fetchAllfinancialTransactionsTypes,
  getFinancialTransactionsSummary,
} from "../utils";
import { useNavigate } from "react-router-dom";
import LoadingPage from "../LoadingPage/LoadingPage";

const todayYMD = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toYMD = (v: unknown) => {
  const s = String(v ?? "");
  return s ? s.slice(0, 10) : "";
};

const normalizeAll = (value?: string) =>
  !value || value === "ALL" ? undefined : value;

const FinancialTransactionsSummary = () => {
  const [state, setState] = useState<string>("");
  const [data, setData] = useState<financialTransactionsSummaryParams>({
    type: "Income",
    currency: "ALL",
    category: "ALL",
    start_date: todayYMD(),
    end_date: todayYMD(),
  });

  const navigate = useNavigate();

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const [currencies, setCurrencies] = useState<transactionCurrency[]>([]);
  const [categories, setCategories] = useState<transactionCategory[]>([]);
  const [types, setTypes] = useState<transactionType[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAllfinancialTransactionsCategories(),
      fetchAllfinancialTransactionsCurrencies(),
      fetchAllfinancialTransactionsTypes(),
    ])
      .then(([cats, curs, tys]) => {
        setCategories(cats);
        setCurrencies(curs);
        setTypes(tys);
      })
      .catch((err) => setError(err?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = ({
    attributeName,
    value,
  }: {
    attributeName: string;
    value: string;
  }) => {
    setData((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
  };

  const handleSave = async () => {
    setState("");

    const start = toYMD(data.start_date);
    const end = toYMD(data.end_date);

    if (start && end && start > end) {
      setState("From date must be before (or equal to) To date.");
      return;
    }

    const filters: financialTransactionsSummaryParams = {
      type: normalizeAll(data.type),
      start_date: start || undefined,
      end_date: end || undefined,
      currency: normalizeAll(data.currency),
      category: normalizeAll(data.category),
    };

    try {
      const response = await getFinancialTransactionsSummary(filters);
      console.log(`filters: ${filters}`);
      const query = new URLSearchParams({
        start_date: filters.start_date ?? "",
        end_date: filters.end_date ?? "",
        currency: data.currency ?? "ALL",
        category: data.category ?? "ALL",
      }).toString();

      navigate(`/financial-transactions/summary/${data.type}?${query}`, {
        state: {
          summaryData: response,
          start_date: filters.start_date,
          end_date: filters.end_date,
          currency: data.currency,
          category: data.category,
          type: data.type,
        },
      });
    } catch (err) {
      setState(err instanceof Error ? err.message : "Failed to fetch summary");
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "type":
        return <TrendingUp className={iconStyle} />;
      case "date":
        return <CalendarDays className={iconStyle} />;
      case "currency":
        return <Coins className={iconStyle} />;
      case "category":
        return <Tag className={iconStyle} />;
      case "amount":
        return <BadgeDollarSign className={iconStyle} />;
      case "description":
        return <FileText className={iconStyle} />;
      default:
        return null;
    }
  };

  if (loading)
    return <LoadingPage title="Loading financial transactions ..." />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>Financial Transactions Summary</h1>

      <div className={inputFormAttributeList}>
        {listOfAttributesFinancialTransactionSummary.map((i) => (
          <div key={i.attributeName} className={inputFormAttributeListItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>

            {i.typeOfInput === "Selection" ? (
              <select
                className={inputFormAttributeListItemInput}
                value={String(
                  data[
                    i.attributeName as keyof financialTransactionsSummaryParams
                  ] ?? ""
                )}
                onChange={(e) =>
                  handleInputChange({
                    attributeName: i.attributeName,
                    value: e.target.value,
                  })
                }
              >
                {i.attributeName === "type" &&
                  types.map((t) => (
                    <option key={t.id} value={t.type}>
                      {t.type}
                    </option>
                  ))}
                {i.attributeName === "category" &&
                  categories.map((c) => (
                    <option key={c.id} value={c.category}>
                      {c.category}
                    </option>
                  ))}
                {i.attributeName === "currency" &&
                  currencies.map((c) => (
                    <option key={c.id} value={c.currency}>
                      {c.currency}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                className={inputFormAttributeListItemInput}
                type={i.typeOfInput}
                value={toYMD(
                  data[
                    i.attributeName as keyof financialTransactionsSummaryParams
                  ]
                )}
                placeholder={i.placeHolder}
                max={
                  i.attributeName === "start_date"
                    ? toYMD(data.end_date)
                    : undefined
                }
                min={
                  i.attributeName === "end_date"
                    ? toYMD(data.start_date)
                    : undefined
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onChange={(e) =>
                  handleInputChange({
                    attributeName: i.attributeName,
                    value: e.target.value,
                  })
                }
              />
            )}
          </div>
        ))}
      </div>

      <button className={inputFormSave} onClick={handleSave}>
        Get
      </button>

      <h1 className={stateStyle}>{state}</h1>
    </div>
  );
};

export default FinancialTransactionsSummary;
