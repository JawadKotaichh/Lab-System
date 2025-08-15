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

const MonthSummary = () => {
  const [state, setState] = useState<string>("");
  const [data, setData] = useState<monthlySummaryInvoicesParams>({
    insurance_company_id: "",
    start_date: new Date(),
    end_date: new Date(),
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
        setError(err.message || "Failed to load");
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
    setData((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
  };
  const handleSave = async () => {
    if (data.insurance_company_id == "") {
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      const response = await getMonthlyInvoiceSummary({
        insurance_company_id: data.insurance_company_id,
        start_date: data.start_date,
        end_date: data.end_date,
      });

      navigate(`/summary-invoice/${data.insurance_company_id}`, {
        state: {
          summaryData: response,
          start_date: data.start_date,
          end_date: data.end_date,
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
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
  if (loading) return <div className="p-4">Loading insurance companies…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>Month Summary</h1>
      <div className={inputFormAttributeCategoryList}>
        {listOfAttributesInvoice.map((i) => (
          <div className={inputFormAttributeListItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              <select
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
          </div>
        ))}
      </div>

      <button className={inputFormSave} onClick={() => handleSave()}>
        Get
      </button>
      <h1 className={stateStyle}>{state}</h1>
    </div>
  );
};
export default MonthSummary;
