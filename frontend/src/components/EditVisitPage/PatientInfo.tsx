import React, { useState, type Dispatch, type SetStateAction } from "react";

import type { patientInfo } from "../types.js";
import {
  inputFormAttributeListItem,
  patientInfoCardItem,
  patientInfoCard,
  patientInfoCardGrid,
} from "../../style.js";
import api from "../../api.js";
import { visitsApiURL } from "../data.js";

interface PatientCardParams {
  patientData: patientInfo;
  visit_id: string;
  visitDate: Date;
  report_date: Date;
  setReportDate: Dispatch<SetStateAction<Date>>;
  setVisitDate: Dispatch<SetStateAction<Date>>;
}

const PatientInfo: React.FC<PatientCardParams> = ({
  patientData,
  visit_id,
  visitDate,
  setVisitDate,
  report_date,
  setReportDate,
}: PatientCardParams) => {
  const [error, setError] = useState<string | null>(null);

  const handleVisitDateChange = async (
    newVisitDate: string,
    visit_id: string
  ) => {
    try {
      const currdate = new Date(newVisitDate);
      await api.put(`${visitsApiURL}${visit_id}`, {
        visit_date: currdate,
      });
      setVisitDate(currdate);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleReportDateChange = async (
    new_report_date: string,
    visit_id: string
  ) => {
    try {
      const currdate = new Date(new_report_date);
      await api.put(`${visitsApiURL}${visit_id}`, {
        report_date: currdate,
      });
      setReportDate(currdate);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  return (
    <div className={patientInfoCard}>
      <div className={patientInfoCardGrid}>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Patient Name:</span>
            <span>{patientData.name}</span>
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
            <span>{patientData.insurance_company_name}</span>
          </label>
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Visit Date:</span>
            <span>
              <input
                value={new Date(visitDate).toISOString().split("T")[0]}
                type="date"
                onChange={(e) =>
                  handleVisitDateChange(e.target.value, visit_id)
                }
              />
            </span>
          </label>
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Report Date:</span>
            <span>
              <input
                value={new Date(report_date).toISOString().split("T")[0]}
                type="date"
                onChange={(e) =>
                  handleReportDateChange(e.target.value, visit_id)
                }
              />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;
