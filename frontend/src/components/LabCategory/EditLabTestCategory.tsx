import SaveButton from "../SaveButton";
import { useFormValidation, ValidationSummary, FieldError, required } from "../FormValidation";
import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../api";
import { useNavigate, useParams } from "react-router-dom";
import {
  iconStyle,
  inputForm,
  inputFormAttributeCategoryList,
  inputFormAttributeListItem,
  inputFormAttributeListItemInput,
  inputFormAttributeListItemLabel,
  inputFormTitle,
  stateStyle,
} from "../../style";
import type {
  CreateLabTestCategoryParams,
  labTestCategoryParams,
  PageTitle,
} from "../types";
import { Beaker, DollarSign, User } from "lucide-react";
import { fetchLabTestCategory } from "../utils";
import {
  labTestCategoryApiURL,
  labTestCategoryMainPageURL,
  listOfAttributesLabTestCategory,
} from "../data";

const EditLabTestCategory = ({ title }: PageTitle) => {
  const [state, setState] = useState<string>("");
  const navigate = useNavigate();
  const { lab_test_category_id } = useParams();
  const [data, setData] = useState<labTestCategoryParams>({
    lab_test_category_name: "",
    lab_test_category_id: "",
  });
  useEffect(() => {
    if (lab_test_category_id) {
      fetchLabTestCategory(lab_test_category_id)
        .then((d) => setData(d))
        .catch((err) => {
          console.error("Failed to fetch lab test category", err);
          setState(getApiErrorMessage(err, "Could not load lab test category details"));
        });
    }
  }, [lab_test_category_id]);

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
    { name: "lab_test_category_name", label: "Category name", error: required(data.lab_test_category_name, "Category name") },
  ]);
  const handleSave = async () => {
    if (!validation.validate()) { setState(""); return; }
    setState("");
    try {
      if (lab_test_category_id) {
        await api.put(labTestCategoryApiURL + lab_test_category_id, data);
      } else {
        await api.post(labTestCategoryApiURL, data);
      }
      navigate(labTestCategoryMainPageURL);
    } catch (err: unknown) {
      setState(getApiErrorMessage(err, "Failed to save lab test category"));
    }
  };
  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "dollarsign":
        return <DollarSign className={iconStyle} />;
      case "user":
        return <User className={iconStyle} />;
      case "labtest":
        return <Beaker className={iconStyle} />;
      default:
        return null;
    }
  };
  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <ValidationSummary validation={validation} />
      <div className={inputFormAttributeCategoryList}>
        {listOfAttributesLabTestCategory.map((i) => (
          <div key={i.attributeName} className={inputFormAttributeListItem}>
            <label htmlFor={validation.id(i.attributeName)} className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            <input
              {...validation.field(i.attributeName)}
              className={inputFormAttributeListItemInput}
              type={i.typeOfInput}
              value={
                data[i.attributeName as keyof CreateLabTestCategoryParams] || ""
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
            <FieldError validation={validation} name={i.attributeName} />
          </div>
        ))}
      </div>

      <SaveButton className="mt-5" onClick={() => void handleSave()}>Save</SaveButton>
      {state && <p role="alert" className={stateStyle}>{state}</p>}
    </div>
  );
};
export default EditLabTestCategory;
