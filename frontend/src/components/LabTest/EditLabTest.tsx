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
import type { CreateLabTestParams, labTestCategoryParams } from "../types";
import {
  Beaker,
  Box,
  DollarSign,
  Hash,
  Maximize2,
  Minimize2,
  Tag,
  User,
} from "lucide-react";
import { fetchAllLabTestTypeCategories, fetchLabTest } from "../utils";
import {
  labTestApiURL,
  labTestMainPageURL,
  listOfAttributesLabTest,
} from "../data";

interface EditLabTestProps {
  title: string;
}

const EditLabTest: React.FC<EditLabTestProps> = ({
  title,
}: EditLabTestProps) => {
  const [state, setState] = useState<string>("");
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { lab_test_id } = useParams();
  const [labTestCategories, setLabTestCategories] = useState<
    labTestCategoryParams[]
  >([]);
  const [data, setData] = useState<CreateLabTestParams>({
    lab_test_category_id: "",
    name: "",
    nssf_id: 0,
    unit: "",
    price: 0,
    upper_bound: "",
    lower_bound: "",
  });
  useEffect(() => {
    if (lab_test_id) {
      fetchLabTest(lab_test_id)
        .then((resp) => {
          setData({
            lab_test_category_id: resp.lab_test_category_id,
            name: resp.name,
            nssf_id: resp.nssf_id,
            unit: resp.unit,
            price: resp.price,
            lower_bound: resp.lower_bound,
            upper_bound: resp.upper_bound,
          });
        })
        .catch((err) => {
          console.error("Failed to fetch lab test data:", err);
          setState("Failed to load lab test data");
        });
    }
  }, [lab_test_id]);
  useEffect(() => {
    fetchAllLabTestTypeCategories()
      .then((data) => {
        setLabTestCategories(data);
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
    if (
      data.name == "" ||
      data.lab_test_category_id == "" ||
      data.unit == "" ||
      data.price == 0 ||
      data.nssf_id == 0 ||
      data.lower_bound == "" ||
      data.upper_bound == ""
    ) {
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      if (lab_test_id) {
        api.put(labTestApiURL + lab_test_id, data);
      } else {
        api.post(labTestApiURL, data);
      }
      navigate(labTestMainPageURL);
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
  };

  if (loading) return <div className="p-4">Loading lab categories...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const renderIcon = (iconName: string) => {
    const key = iconName.toLowerCase();
    switch (key) {
      case "dollarsign":
        return <DollarSign className={iconStyle} />;
      case "user":
        return <User className={iconStyle} />;
      case "category":
        return <Tag className={iconStyle} />;
      case "unit":
        return <Box className={iconStyle} />;
      case "labtest":
        return <Beaker className={iconStyle} />;
      case "id":
        return <Hash className={iconStyle} />;
      case "lowerbound":
        return <Minimize2 className={iconStyle} />;
      case "upperbound":
        return <Maximize2 className={iconStyle} />;
      default:
        return null;
    }
  };
  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <div className={inputFormAttributeList}>
        {listOfAttributesLabTest.map((i) => (
          <div className={inputFormAttributeListItem} key={i.subItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              <select
                className={inputFormAttributeListItemInput}
                value={data[i.attributeName as keyof CreateLabTestParams]}
                onChange={(e) =>
                  handleInputChange({
                    attributeName: i.attributeName,
                    value: e.target.value,
                  })
                }
              >
                <option value="" disabled>
                  — Select lab test category —
                </option>
                {labTestCategories.map((ltc) => (
                  <option
                    key={ltc.lab_test_category_id}
                    value={ltc.lab_test_category_id}
                  >
                    {ltc.lab_test_category_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={inputFormAttributeListItemInput}
                type={i.typeOfInput}
                value={data[i.attributeName as keyof CreateLabTestParams] || ""}
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
        Save
      </button>
      <h1 className={stateStyle}>{state}</h1>
    </div>
  );
};
export default EditLabTest;
