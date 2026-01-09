import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useParams } from "react-router-dom";
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
import type { PageTitle, financialTransaction } from "../types";
import {
  BadgeDollarSign,
  CalendarDays,
  Coins,
  FileText,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  fetchAllFinancialTransactions,
  fetchFinancialTransaction,
} from "../utils";
import {
  FinancialTransactionsApiURL,
  FinancialTransactionsMainPageURL,
  listOfAttributesFinancialTransaction,
} from "../data";
import LoadingPage from "../LoadingPage/LoadingPage";

type TYPEE = "income" | "expense";
const isTYPEE = (v?: string): v is TYPEE => v === "income" || v === "expense";

const EditFinancialTransaction = ({ title }: PageTitle) => {
  const [state, setState] = useState<string>("");
  const navigate = useNavigate();
  const { kind, transaction_id } = useParams<{
    kind?: string;
    transaction_id?: string;
  }>();
  const initialType = isTYPEE(kind)
    ? kind === "income"
      ? "Income"
      : "Expense"
    : "";
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [data, setData] = useState<financialTransaction>({
    type: "",
    date: "",
    amount: 0,
    description: "",
    category: "",
    currency: "USD",
  });
  const [allTransactionsCategories, setAllTransactionsCategories] = useState<
    financialTransaction[]
  >([]);
  useEffect(() => {
    setLoading(true);
    fetchAllFinancialTransactions()
      .then((data) => {
        setAllTransactionsCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    if (transaction_id) {
      fetchFinancialTransaction(transaction_id)
        .then((d) =>
          setData({
            ...d,
            date: d.date ? d.date.split("T")[0] : "",
          })
        )
        .catch((err) => {
          console.error("Failed to fetch financial transaction data:", err);
          setState("Failed to load financial transaction data");
        });
    }
  }, [transaction_id]);
  useEffect(() => {
    if (!transaction_id && initialType) {
      setData((prev) => (prev.type ? prev : { ...prev, type: initialType }));
    }
  }, [initialType, transaction_id]);

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
    if (
      data.date == "" ||
      data.category == "" ||
      data.currency == "" ||
      data.type.trim() == "" ||
      data.amount == 0
    ) {
      setState("Please insert all the required fields!");
      return;
    }
    const payload = {
      ...data,
      category: isAddingCategory ? newCategory.trim() : data.category,
    };
    try {
      if (transaction_id) {
        await api.put(FinancialTransactionsApiURL + transaction_id, payload);
      } else {
        await api.post(FinancialTransactionsApiURL, payload);
      }
      window.dispatchEvent(new Event("transactions:changed"));

      navigate(FinancialTransactionsMainPageURL);
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
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
      <h1 className={inputFormTitle}>{title}</h1>
      <div className={inputFormAttributeList}>
        {listOfAttributesFinancialTransaction.map((i) => (
          <div className={inputFormAttributeListItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              i.attributeName === "category" ? (
                <>
                  <select
                    className={inputFormAttributeListItemInput}
                    value={isAddingCategory ? "__new__" : data.category || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__new__") {
                        setIsAddingCategory(true);
                        setData((prev) => ({ ...prev, category: "" }));
                      } else {
                        setIsAddingCategory(false);
                        setNewCategory("");
                        setData((prev) => ({ ...prev, category: v }));
                      }
                    }}
                  >
                    <option value="" disabled>
                      — Select category —
                    </option>

                    {allTransactionsCategories.map((tc) => (
                      <option key={tc.id} value={tc.category}>
                        {tc.category}
                      </option>
                    ))}

                    <option value="__new__">+ Add new category…</option>
                  </select>

                  {isAddingCategory && (
                    <input
                      className={inputFormAttributeListItemInput}
                      type="text"
                      placeholder="Type new category…"
                      value={newCategory}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewCategory(v);
                        setData((prev) => ({ ...prev, category: v }));
                      }}
                    />
                  )}
                </>
              ) : (
                <select
                  className={inputFormAttributeListItemInput}
                  value={String(
                    data[i.attributeName as keyof financialTransaction] ?? ""
                  )}
                  onChange={(e) =>
                    handleInputChange({
                      attributeName: i.attributeName,
                      value: e.target.value,
                    })
                  }
                >
                  {i.attributeName === "currency" ? (
                    <>
                      <option value="" disabled>
                        — Select currency —
                      </option>
                      <option value="USD">USD</option>
                      <option value="LBP">LBP</option>
                    </>
                  ) : (
                    <>
                      <option value="" disabled>
                        — Select type —
                      </option>
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </>
                  )}
                </select>
              )
            ) : i.attributeName === "description" ? (
              <textarea
                className={
                  inputFormAttributeListItemInput + " min-h-[120px] resize-y"
                }
                value={String(data.description ?? "")}
                placeholder={i.placeHolder}
                onChange={(e) =>
                  handleInputChange({
                    attributeName: "description",
                    value: e.target.value,
                  })
                }
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
              />
            ) : (
              <input
                className={inputFormAttributeListItemInput}
                type={i.typeOfInput}
                value={String(
                  data[i.attributeName as keyof financialTransaction] ?? ""
                )}
                placeholder={i.placeHolder}
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

      <button className={inputFormSave} onClick={() => handleSave()}>
        Save
      </button>
      <h1 className={stateStyle}>{state}</h1>
    </div>
  );
};
export default EditFinancialTransaction;
