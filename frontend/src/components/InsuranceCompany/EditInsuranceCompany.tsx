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
import type { CreateInsuranceCompanyParams, PageTitle } from "../types";
import { DollarSign, User } from "lucide-react";
import { fetchInsuranceCompany } from "../utils";
import {
  InsuranceApiURL,
  InsuranceMainPageURL,
  listOfAttributesInsuranceCompany,
} from "../data";

const EditInsuranceCompany = ({ title }: PageTitle) => {
  const [state, setState] = useState<string>("");
  const navigate = useNavigate();
  const { insurance_company_id } = useParams();
  const [data, setData] = useState<CreateInsuranceCompanyParams>({
    insurance_company_name: "",
    rate: "",
  });
  useEffect(() => {
    if (insurance_company_id) {
      fetchInsuranceCompany(insurance_company_id)
        .then((d) => setData(d))
        .catch((err) => {
          console.error("Failed to fetch insurance company data:", err);
          setState("Failed to load insurance company data");
        });
    }
  }, [insurance_company_id]);

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
    if (data.insurance_company_name == "" || data.rate == "") {
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      if (insurance_company_id) {
        api.put(InsuranceApiURL + insurance_company_id, data);
      } else {
        api.post(InsuranceApiURL, data);
      }
      navigate(InsuranceMainPageURL);
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
  };
  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "dollarsign":
        return <DollarSign className={iconStyle} />;
      case "user":
        return <User className={iconStyle} />;
      default:
        return null;
    }
  };
  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <div className={inputFormAttributeList}>
        {listOfAttributesInsuranceCompany.map((i) => (
          <div className={inputFormAttributeListItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            <input
              className={inputFormAttributeListItemInput}
              type={i.typeOfInput}
              value={
                data[i.attributeName as keyof CreateInsuranceCompanyParams] ||
                ""
              }
              placeholder={i.placeHolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) =>
                handleInputChange({
                  attributeName: i.attributeName,
                  value: e.target.value,
                })
              }
            ></input>
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
export default EditInsuranceCompany;
