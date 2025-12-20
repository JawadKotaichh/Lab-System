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
import type { patientInfo, insuranceCompanyParams, PageTitle } from "../types";
import { Building, Calendar, DollarSign, Phone, User } from "lucide-react";
import { fetchAllInsuranceCompanies, fetchPatient } from "../utils";
import {
  listOfAttributesPatient,
  PatientsApiURL,
  PatientsMainPageURL,
} from "../data";

const EditPatientPage = ({ title }: PageTitle) => {
  const [state, setState] = useState<string>("");
  const navigate = useNavigate();
  const { patient_id } = useParams();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
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
        setError(err.message || "Failed to load");
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
          console.error("Failed to fetch insurance company data:", err);
          setState("Failed to load insurance company data");
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
  const handleSave = async () => {
    if (
      data.DOB == "" ||
      data.name == "" ||
      data.gender == "" ||
      data.phone_number == "" ||
      data.insurance_company_id == ""
    ) {
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      if (patient_id) {
        api.put(PatientsApiURL + patient_id, data);
      } else {
        api.post(PatientsApiURL, data);
      }
      window.dispatchEvent(new Event("patients:changed"));

      navigate(PatientsMainPageURL);
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

  if (loading) return <div className="p-4">Loading insurance companies…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className={inputForm}>
      <h1 className={inputFormTitle}>{title}</h1>
      <div className={inputFormAttributeList}>
        {listOfAttributesPatient.map((i) => (
          <div className={inputFormAttributeListItem}>
            <label className={inputFormAttributeListItemLabel}>
              {renderIcon(i.icon)}
              <span>{i.subItem}</span>
            </label>
            {i.typeOfInput === "Selection" ? (
              <select
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
                className={inputFormAttributeListItemInput}
                type={i.typeOfInput}
                value={data[i.attributeName as keyof patientInfo] || ""}
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
export default EditPatientPage;
