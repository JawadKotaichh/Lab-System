import SaveButton from "../SaveButton";
import { useFormValidation, ValidationSummary, FieldError, required, numberError, dateError } from "../FormValidation";
import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../api";
import { useNavigate, useParams } from "react-router-dom";
import {
  iconStyle,
  inputForm,
  inputFormAttributeList,
  inputFormAttributeListItem,
  inputFormAttributeListItemInput,
  inputFormAttributeListItemLabel,
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
        setError(getApiErrorMessage(err, "Could not load transaction categories"));
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
          setState(getApiErrorMessage(err, "Could not load financial transaction details"));
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
  const validation = useFormValidation([
    { name: "type", label: "Transaction type", error: required(data.type, "Transaction type") },
    { name: "date", label: "Date", error: dateError(data.date, "Date") },
    { name: "currency", label: "Currency", error: required(data.currency, "Currency") },
    { name: "category", label: "Category", error: required(isAddingCategory ? newCategory : data.category, "Category") },
    { name: "amount", label: "Amount", error: numberError(data.amount, "Amount", true) },
  ]);
  const handleSave = async () => {
    if (!validation.validate()) { setState(""); return; }
    setState("");
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
    } catch (err: unknown) {
      setState(getApiErrorMessage(err, "Failed to save financial transaction"));
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
  if (error) return <div role="alert" className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <ValidationSummary validation={validation} />
      <div className={inputFormAttributeList}>
        {listOfAttributesFinancialTransaction.map((i) => (
          <div key={i.attributeName} className={inputFormAttributeListItem}>
            <label htmlFor={validation.id(i.attributeName)} className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              i.attributeName === "category" ? (
                <>
                  <select
                    {...validation.field(i.attributeName)}
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
                      {...validation.field(i.attributeName)}
                      id={`${validation.id(i.attributeName)}-new`}
                      aria-label="New category name"
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
                  {...validation.field(i.attributeName)}
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
                {...validation.field(i.attributeName)}
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
                {...validation.field(i.attributeName)}
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
            <FieldError validation={validation} name={i.attributeName} />
          </div>
        ))}
      </div>

      <SaveButton className="mt-5" onClick={() => void handleSave()}>Save</SaveButton>
      {state && <p role="alert" className={stateStyle}>{state}</p>}
    </div>
  );
};
export default EditFinancialTransaction;
