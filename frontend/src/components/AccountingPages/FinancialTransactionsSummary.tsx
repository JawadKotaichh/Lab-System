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

    const filters: financialTransactionsSummaryParams = {
      type: data.type,
      start_date: data.start_date
        ? String(data.start_date).slice(0, 10)
        : undefined,
      end_date: data.end_date ? String(data.end_date).slice(0, 10) : undefined,
      currency: data.currency !== "ALL" ? data.currency : "ALL",
      category: data.category !== "ALL" ? data.category : "ALL",
    };
    try {
      const response = await getFinancialTransactionsSummary(filters);

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
                <option value="ALL">ALL</option>

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
                value={String(
                  data[
                    i.attributeName as keyof financialTransactionsSummaryParams
                  ] ?? ""
                )}
                placeholder={i.placeHolder}
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
