import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useParams } from "react-router-dom";
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
          setState("Failed to load lab test category data");
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
  const handleSave = async () => {
    if (data.lab_test_category_name == "") {
      setState("Please insert all the required fields!");
      return;
    }
    try {
      if (lab_test_category_id) {
        api.put(labTestCategoryApiURL + lab_test_category_id, data);
      } else {
        api.post(labTestCategoryApiURL, data);
      }
      navigate(labTestCategoryMainPageURL);
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
      case "labtest":
        return <Beaker className={iconStyle} />;
      default:
        return null;
    }
  };
  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <div className={inputFormAttributeCategoryList}>
        {listOfAttributesLabTestCategory.map((i) => (
          <div className={inputFormAttributeListItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            <input
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
export default EditLabTestCategory;
