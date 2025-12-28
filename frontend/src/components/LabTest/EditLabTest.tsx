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
import type {
  CreateLabTestParams,
  labTestCategoryParams,
  NVType,
  NV,
  NVPartial,
} from "../types";
import {
  Beaker,
  Box,
  DollarSign,
  Hash,
  Tag,
  User,
  Trash2,
  Plus,
} from "lucide-react";
import { fetchAllLabTestTypeCategories, fetchLabTest } from "../utils";
import {
  labTestApiURL,
  labTestMainPageURL,
  listOfAttributesLabTest,
} from "../data";
import {
  guessNVType,
  isUAndL,
  isByGender,
  isLowerOnly,
  isPosNeg,
  isUpperOnly,
} from "./guessNormalValueType";
import createEmptyNormalValues from "./createEmptyNV";
import GenderNVEditor from "./GenderNVEditor";
import FractionInput from "./FractionInput";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

interface EditLabTestProps {
  title: string;
}

const EditLabTest: React.FC<EditLabTestProps> = ({ title }) => {
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
    normal_value_list: [],
  });

  const [newNVType, setNewNVType] = useState<NVType>(
    "upper_and_lower_bound_only"
  );

  useEffect(() => {
    if (lab_test_id) {
      fetchLabTest(lab_test_id)
        .then((resp: CreateLabTestParams) => {
          setData({
            lab_test_category_id: resp.lab_test_category_id,
            name: resp.name,
            nssf_id: resp.nssf_id,
            unit: resp.unit,
            price: resp.price,
            normal_value_list: resp.normal_value_list,
          });
        })
        .catch(() => setState("Failed to load lab test data"));
    }
  }, [lab_test_id]);

  useEffect(() => {
    fetchAllLabTestTypeCategories()
      .then((cats) => {
        setLabTestCategories(cats);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoading(false);
      });
  }, []);

  type StringKeys = "lab_test_category_id" | "name" | "unit";
  type NumberKeys = "nssf_id" | "price";

  const handleStringAttr = (k: StringKeys, value: string) =>
    setData((prev) => ({ ...prev, [k]: value }));

  const handleNumberAttr = (k: NumberKeys, value: string) =>
    setData((prev) => ({ ...prev, [k]: Number(value) }));

  const getAttrValue = (k: StringKeys | NumberKeys): string | number => {
    if (k === "nssf_id") return data.nssf_id;
    if (k === "price") return data.price;
    if (k === "lab_test_category_id") return data.lab_test_category_id;
    if (k === "name") return data.name;
    return data.unit;
  };

  const updateNV = (index: number, patch: NVPartial) => {
    setData((prev) => {
      const next = [...prev.normal_value_list] as NV[];
      next[index] = { ...(next[index] as NV), ...(patch as NV) };
      return { ...prev, normal_value_list: next };
    });
  };

  const replaceNV = (index: number, newObj: NV) => {
    setData((prev) => {
      const next = [...prev.normal_value_list] as NV[];
      next[index] = newObj;
      return { ...prev, normal_value_list: next };
    });
  };

  const removeNV = (index: number) => {
    setData((prev) => {
      const next = prev.normal_value_list.filter((_, i) => i !== index) as NV[];
      return { ...prev, normal_value_list: next };
    });
  };

  const addNV = () => {
    setData((prev) => ({
      ...prev,
      normal_value_list: [
        ...(prev.normal_value_list as NV[]),
        createEmptyNormalValues(newNVType),
      ],
    }));
  };

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
      default:
        return null;
    }
  };

  const handleSave = async () => {
    if (
      data.name.trim() === "" ||
      data.lab_test_category_id.trim() === "" ||
      !Number.isFinite(data.price) ||
      !Number.isFinite(data.nssf_id)
    ) {
      setState("Please insert all the required fields!");
      return;
    }

    try {
      if (lab_test_id) {
        await api.put(labTestApiURL + lab_test_id, data);
      } else {
        await api.post(labTestApiURL, data);
      }
      navigate(labTestMainPageURL);
    } catch (err) {
      setState(
        err instanceof Error ? `Save failed: ${err.message}` : "Save failed"
      );
    }
  };

  if (loading) return <LoadingScreen title="Loading lab categories ..." />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <div className={inputFormAttributeList}>
        {listOfAttributesLabTest.map((i) => {
          const key = i.attributeName as
            | "nssf_id"
            | "price"
            | "lab_test_category_id"
            | "name"
            | "unit";
          const isNumber = key === "nssf_id" || key === "price";
          const isSelection = i.typeOfInput === "Selection";

          return (
            <div className={inputFormAttributeListItem} key={i.subItem}>
              <label className={inputFormAttributeListItemLabel}>
                {renderIcon(i.icon)}
                <span>{i.subItem}</span>
              </label>

              {isSelection ? (
                <select
                  className={inputFormAttributeListItemInput}
                  value={String(getAttrValue("lab_test_category_id"))}
                  onChange={(e) =>
                    handleStringAttr("lab_test_category_id", e.target.value)
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
                  value={
                    key === "nssf_id"
                      ? data.nssf_id
                      : key === "price"
                      ? data.price
                      : key === "name"
                      ? data.name
                      : key === "unit"
                      ? data.unit
                      : data.lab_test_category_id
                  }
                  placeholder={i.placeHolder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onChange={(e) =>
                    isNumber
                      ? handleNumberAttr(
                          key as "nssf_id" | "price",
                          e.target.value
                        )
                      : handleStringAttr(
                          key as "lab_test_category_id" | "name" | "unit",
                          e.target.value
                        )
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div className={"mt-6 space-y-3"}>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Normal Values</h2>
          <select
            className="border rounded px-2 py-1"
            value={newNVType}
            onChange={(e) => setNewNVType(e.target.value as NVType)}
          >
            <option value="upper_and_lower_bound_only">
              Upper & Lower Bound
            </option>
            <option value="upper_bound_only">Upper Bound Only</option>
            <option value="lower_bound_only">Lower Bound Only</option>
            <option value="positive_or_negative">Positive / Negative</option>
            <option value="normal_value_by_gender">By Gender</option>
            <option value="description_only">Description Only</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded px-3 py-1 border"
            onClick={addNV}
            title="Add normal value"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="space-y-4">
          {(data.normal_value_list as NV[]).map((nv, idx) => {
            const t = guessNVType(nv);

            return (
              <div
                key={idx}
                className="rounded-sm border p-5 shadow-lg shadow-blue-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Type:</span>
                    <select
                      className="border rounded px-2 py-1"
                      value={t}
                      onChange={(e) =>
                        replaceNV(
                          idx,
                          createEmptyNormalValues(e.target.value as NVType)
                        )
                      }
                    >
                      <option value="upper_and_lower_bound_only">
                        Upper & Lower Bound
                      </option>
                      <option value="upper_bound_only">Upper Bound Only</option>
                      <option value="lower_bound_only">Lower Bound Only</option>
                      <option value="positive_or_negative">
                        Positive / Negative
                      </option>
                      <option value="normal_value_by_gender">By Gender</option>
                      <option value="description_only">Description Only</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded px-2 py-1 border text-red-600"
                    onClick={() => removeNV(idx)}
                    title="Remove"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm w-28">Description</label>
                  <input
                    className="flex-1 border rounded px-2 py-1"
                    value={nv.description ?? ""}
                    onChange={(e) =>
                      updateNV(idx, { description: e.target.value })
                    }
                    placeholder="(optional)"
                  />
                </div>

                {isUAndL(nv) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm w-28">Lower bound</label>
                      <FractionInput
                        className="flex-1 border rounded px-2 py-1"
                        value={nv.lower_bound_value}
                        onChange={(next) =>
                          updateNV(idx, { lower_bound_value: next })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm w-28">Upper bound</label>
                      <FractionInput
                        className="flex-1 border rounded px-2 py-1"
                        value={nv.upper_bound_value}
                        onChange={(next) =>
                          updateNV(idx, { upper_bound_value: next })
                        }
                      />
                    </div>
                  </div>
                )}

                {isUpperOnly(nv) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm w-28">Upper bound</label>
                    <FractionInput
                      className="flex-1 border rounded px-2 py-1"
                      value={nv.upper_bound_value}
                      onChange={(next) =>
                        updateNV(idx, { upper_bound_value: next })
                      }
                    />
                  </div>
                )}

                {isLowerOnly(nv) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm w-28">Lower bound</label>
                    <FractionInput
                      className="flex-1 border rounded px-2 py-1"
                      value={nv.lower_bound_value}
                      onChange={(next) =>
                        updateNV(idx, { lower_bound_value: next })
                      }
                    />
                  </div>
                )}

                {isPosNeg(nv) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm w-28">Normal value</label>
                    <select
                      className="border rounded px-2 py-1"
                      value={nv.normal_value}
                      onChange={(e) =>
                        updateNV(idx, { normal_value: e.target.value })
                      }
                    >
                      <option value="">— choose —</option>
                      <option value="Positive">Positive</option>
                      <option value="Negative">Negative</option>
                    </select>
                  </div>
                )}

                {isByGender(nv) && (
                  <div className="space-y-3">
                    <fieldset className="border rounded p-2">
                      <legend className="px-1 text-sm font-semibold">
                        Male
                      </legend>
                      <GenderNVEditor
                        value={nv.male_normal_value_type}
                        onChange={(newVal) =>
                          replaceNV(idx, {
                            ...nv,
                            male_normal_value_type: newVal,
                          })
                        }
                      />
                    </fieldset>
                    <fieldset className="border rounded p-2">
                      <legend className="px-1 text-sm font-semibold">
                        Female
                      </legend>
                      <GenderNVEditor
                        value={nv.female_normal_value_type}
                        onChange={(newVal) =>
                          replaceNV(idx, {
                            ...nv,
                            female_normal_value_type: newVal,
                          })
                        }
                      />
                    </fieldset>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button className={inputFormSave} onClick={handleSave}>
        Save
      </button>
      <h1 className={stateStyle}>{state}</h1>
    </div>
  );
};

export default EditLabTest;
