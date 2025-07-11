import React from "react";

import type { patientInfo } from "../types.js";
import {
  inputFormAttributeListItem,
  patientInfoCardItem,
  patientInfoCard,
  patientInfoCardGrid,
} from "../../style.js";

interface PatientCardParams {
  patientData: patientInfo;
}

const PatientInfo: React.FC<PatientCardParams> = ({
  patientData,
}: PatientCardParams) => {
  return (
    <div className={patientInfoCard}>
      <div className={patientInfoCardGrid}>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Patient Name:</span>
            <span>{patientData.patient_name}</span>
          </label>
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Gender:</span>
            <span>{patientData.gender}</span>
          </label>
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">DOB:</span>
            <span>{patientData.DOB.split("T")[0]}</span>
          </label>
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Phone Number:</span>
            <span>{patientData.phone_number}</span>
          </label>
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Insurance Company:</span>
            <span>{patientData.insurance_company_id}</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;
