import { useFormValidation, ValidationSummary, FieldError, required, dateError } from "../FormValidation";
import { Calendar, DollarSign, User } from "lucide-react";
import {
  iconStyle,
  inputForm,
  inputFormAttributeCategoryList,
  inputFormAttributeListItem,
  inputFormAttributeListItemInput,
  inputFormAttributeListItemLabel,
  inputFormSave,
  inputFormTitle,
  stateStyle,
} from "../../style";
import { listOfAttributesInvoice } from "../data";
import { useEffect, useState } from "react";
import type {
  insuranceCompanyParams,
  monthlySummaryInvoicesParams,
} from "../types";
import { fetchAllInsuranceCompanies, getMonthlyInvoiceSummary } from "../utils";
import { useNavigate } from "react-router-dom";
import LoadingPage from "../LoadingPage/LoadingPage";
import { getApiErrorMessage } from "../../api";

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const MonthSummary = () => {
  const [state, setState] = useState<string>("");
  const [data, setData] = useState<monthlySummaryInvoicesParams>({
    insurance_company_id: "",
    start_date: localToday(),
    end_date: localToday(),
    currency: "",
  });
  const navigate = useNavigate();

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [allInsuranceCompanies, setAllInsuranceCompanies] = useState<
    insuranceCompanyParams[]
  >([]);

  useEffect(() => {
    setLoading(true);
    fetchAllInsuranceCompanies()
      .then((data) => {
        setAllInsuranceCompanies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "Could not load insurance companies"));
        setLoading(false);
      });
  }, []);

  const handleInputChange = ({
    attributeName,
    value,
  }: {
    attributeName: string;
    value: string;
  }) => {
    setData((prev) => {
      if (attributeName === "insurance_company_id") {
        const selected = allInsuranceCompanies.find(
          (ic) => ic.insurance_company_id === value
        );
        return {
          ...prev,
          [attributeName]: value,
          currency: selected?.currency ?? "",
        };
      }
      return {
        ...prev,
        [attributeName]: value,
      };
    });
  };
  const validation = useFormValidation([
    { name: "insurance_company_id", label: "Insurance company", error: required(data.insurance_company_id, "Insurance company") },
    { name: "start_date", label: "Start date", error: dateError(data.start_date, "Start date") },
    { name: "end_date", label: "End date", error: dateError(data.end_date, "End date") || (new Date(String(data.start_date)) > new Date(String(data.end_date)) ? "End date must be on or after start date." : null) },
  ]);
  const handleSave = async () => {
    if (!validation.validate()) { setState(""); return; }
    setState("");
    try {
      const response = await getMonthlyInvoiceSummary({
        insurance_company_id: data.insurance_company_id,
        start_date: data.start_date,
        end_date: data.end_date,
      });

      const startParam =
        data.start_date instanceof Date
          ? data.start_date.toISOString()
          : String(data.start_date);
      const endParam =
        data.end_date instanceof Date
          ? data.end_date.toISOString()
          : String(data.end_date);
      const query = new URLSearchParams({
        start_date: startParam,
        end_date: endParam,
      }).toString();

      navigate(`/summary-invoice/${data.insurance_company_id}?${query}`, {
        state: {
          summaryData: response,
          start_date: data.start_date,
          end_date: data.end_date,
          currency: data.currency,
        },
      });
    } catch (err: unknown) {
      setState(getApiErrorMessage(err, "Failed to generate monthly summary"));
    }
  };
  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "calendar":
        return <Calendar className={iconStyle} />;
      case "dollarsign":
        return <DollarSign className={iconStyle} />;
      case "user":
        return <User className={iconStyle} />;
      default:
        return null;
    }
  };
  if (loading) return <LoadingPage title="Loading insurance companies ..." />;
  if (error) return <div role="alert" className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>Month Summary</h1>
      <ValidationSummary validation={validation} />
      <div className={inputFormAttributeCategoryList}>
        {listOfAttributesInvoice.map((i) => (
          <div key={i.attributeName} className={inputFormAttributeListItem}>
            <label htmlFor={validation.id(i.attributeName)} className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              <select
                {...validation.field(i.attributeName)}
                className={inputFormAttributeListItemInput}
                value={
                  data[
                    i.attributeName as keyof monthlySummaryInvoicesParams
                  ] as string
                }
                onChange={(e) =>
                  handleInputChange({
                    attributeName: i.attributeName,
                    value: e.target.value,
                  })
                }
              >
                <option value="" disabled>
                  — Select insurance company —
                </option>
                {allInsuranceCompanies.map((ic) => (
                  <option
                    key={ic.insurance_company_id}
                    value={ic.insurance_company_id}
                  >
                    {ic.insurance_company_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...validation.field(i.attributeName)}
                className={inputFormAttributeListItemInput}
                type={i.typeOfInput}
                value={
                  (data[
                    i.attributeName as keyof monthlySummaryInvoicesParams
                  ] as string) || ""
                }
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
            <FieldError validation={validation} name={i.attributeName} />
          </div>
        ))}
      </div>

      <button className={inputFormSave} onClick={() => handleSave()}>
        Get
      </button>
      {state && <p role="alert" className={stateStyle}>{state}</p>}
    </div>
  );
};
export default MonthSummary;
