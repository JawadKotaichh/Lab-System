import SaveButton from "../SaveButton";
import { useFormValidation, ValidationSummary, FieldError, required, dateError } from "../FormValidation";
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
import type { patientInfo, insuranceCompanyParams, PageTitle } from "../types";
import { Building, Calendar, DollarSign, Phone, User } from "lucide-react";
import { fetchAllInsuranceCompanies, fetchPatient } from "../utils";
import {
  listOfAttributesPatient,
  PatientsApiURL,
  PatientsMainPageURL,
} from "../data";
import LoadingPage from "../LoadingPage/LoadingPage";

const EditPatientPage = ({ title }: PageTitle) => {
  const [state, setState] = useState<string>("");
  const navigate = useNavigate();
  const { patient_id } = useParams();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  const [data, setData] = useState<patientInfo>({
    patient_id: `${patient_id}`,
    name: "",
    DOB: "",
    gender: "",
    phone_number: "",
    insurance_company_id: "",
    insurance_company_name: "",
  });
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
  useEffect(() => {
    if (patient_id) {
      fetchPatient(patient_id)
        .then((d) =>
          setData({
            ...d,
            DOB: d.DOB ? d.DOB.split("T")[0] : "",
          })
        )
        .catch((err) => {
          console.error("Failed to fetch patient data:", err);
          setState(getApiErrorMessage(err, "Could not load patient details"));
        });
    }
  }, [patient_id]);

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
    { name: "name", label: "Patient name", error: required(data.name, "Patient name") },
    { name: "DOB", label: "Date of birth", error: dateError(data.DOB, "Date of birth") },
    { name: "gender", label: "Gender", error: required(data.gender, "Gender") },
    { name: "phone_number", label: "Phone number", error: required(data.phone_number, "Phone number") },
    { name: "insurance_company_id", label: "Insurance company", error: required(data.insurance_company_id, "Insurance company") },
  ]);
  const handleSave = async () => {
    if (!validation.validate()) { setState(""); return; }
    setState("");
    try {
      if (patient_id) {
        await api.put(PatientsApiURL + patient_id, data);
      } else {
        await api.post(PatientsApiURL, data);
      }
      window.dispatchEvent(new Event("patients:changed"));

      navigate(PatientsMainPageURL);
    } catch (err: unknown) {
      setState(getApiErrorMessage(err, "Failed to save patient"));
    }
  };
  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "dollarsign":
        return <DollarSign className={iconStyle} />;
      case "user":
        return <User className={iconStyle} />;
      case "calendar":
        return <Calendar className={iconStyle} />;
      case "phone":
        return <Phone className={iconStyle} />;
      case "building":
        return <Building className={iconStyle} />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingPage title="Loading insurance companies ..." />;
  if (error) return <div role="alert" className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <ValidationSummary validation={validation} />
      <div className={inputFormAttributeList}>
        {listOfAttributesPatient.map((i) => (
          <div key={i.attributeName} className={inputFormAttributeListItem}>
            <label htmlFor={validation.id(i.attributeName)} className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              <select
                {...validation.field(i.attributeName)}
                className={inputFormAttributeListItemInput}
                value={data[i.attributeName as keyof patientInfo]}
                onChange={(e) =>
                  handleInputChange({
                    attributeName: i.attributeName,
                    value: e.target.value,
                  })
                }
              >
                {i.subItem === "Gender" ? (
                  <>
                    <option value="" disabled>
                      — Select gender —
                    </option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </select>
            ) : (
              <input
                {...validation.field(i.attributeName)}
                className={inputFormAttributeListItemInput}
                type={i.typeOfInput}
                value={data[i.attributeName as keyof patientInfo] || ""}
                placeholder={i.placeHolder}
                onChange={(e) =>
                  handleInputChange({
                    attributeName: i.attributeName,
                    value: e.target.value,
                  })
                }
                onBlur={() => {
                  if (i.attributeName === "name") {
                    setData((prev) => ({
                      ...prev,
                      name: toTitleCase(prev.name),
                    }));
                  }
                }}
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
export default EditPatientPage;
