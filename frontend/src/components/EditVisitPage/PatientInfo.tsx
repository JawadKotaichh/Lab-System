import React, { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { patientInfo } from "../types.js";
import {
  inputFormAttributeListItem,
  patientInfoCardItem,
  patientInfoCard,
  patientInfoCardGrid,
} from "../../style.js";
import api, { getApiErrorMessage } from "../../api.js";
import { visitsApiURL } from "../data.js";
import SaveFeedback, { type SaveState } from "./SaveFeedback.js";

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
  const [visitDraft, setVisitDraft] = useState(new Date(visitDate).toISOString().split("T")[0]);
  const [reportDraft, setReportDraft] = useState(new Date(report_date).toISOString().split("T")[0]);
  const [visitSave, setVisitSave] = useState<SaveState>({ status: "idle" });
  const [reportSave, setReportSave] = useState<SaveState>({ status: "idle" });
  useEffect(() => { setVisitDraft(new Date(visitDate).toISOString().split("T")[0]); }, [visitDate]);
  useEffect(() => { setReportDraft(new Date(report_date).toISOString().split("T")[0]); }, [report_date]);

  const handleVisitDateChange = async (
    newVisitDate: string,
    visit_id: string
  ) => {
    setVisitDraft(newVisitDate);
    if (!newVisitDate) {
      setVisitSave({ status: "error", message: "Choose a visit date to save." });
      return;
    }
    setVisitSave({ status: "saving", message: "Saving visit date…" });
    try {
      const currdate = new Date(newVisitDate);
      await api.put(`${visitsApiURL}${visit_id}`, {
        visit_date: currdate,
      });
      setVisitDate(currdate);
      setVisitSave({ status: "saved", message: "Visit date saved" });
    } catch (err: unknown) {
      console.error(err);
      setVisitSave({ status: "error", message: getApiErrorMessage(err, "Visit date could not be saved") });
    }
  };

  const handleReportDateChange = async (
    new_report_date: string,
    visit_id: string
  ) => {
    setReportDraft(new_report_date);
    if (!new_report_date) {
      setReportSave({ status: "error", message: "Choose a report date to save." });
      return;
    }
    setReportSave({ status: "saving", message: "Saving report date…" });
    try {
      const currdate = new Date(new_report_date);
      await api.put(`${visitsApiURL}${visit_id}`, {
        report_date: currdate,
      });
      setReportDate(currdate);
      setReportSave({ status: "saved", message: "Report date saved" });
    } catch (err: unknown) {
      console.error(err);
      setReportSave({ status: "error", message: getApiErrorMessage(err, "Report date could not be saved") });
    }
  };
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
                value={visitDraft}
                type="date"
                className="min-h-10 px-1 text-base"
                disabled={visitSave.status === "saving"}
                onChange={(e) =>
                  handleVisitDateChange(e.target.value, visit_id)
                }
              />
            </span>
          </label>
          <SaveFeedback state={visitSave} onRetry={visitDraft ? () => void handleVisitDateChange(visitDraft, visit_id) : undefined} />
        </div>
        <div className={inputFormAttributeListItem}>
          <label className={patientInfoCardItem}>
            <span className="font-bold">Report Date:</span>
            <span>
              <input
                value={reportDraft}
                type="date"
                className="min-h-10 px-1 text-base"
                disabled={reportSave.status === "saving"}
                onChange={(e) =>
                  handleReportDateChange(e.target.value, visit_id)
                }
              />
            </span>
          </label>
          <SaveFeedback state={reportSave} onRetry={reportDraft ? () => void handleReportDateChange(reportDraft, visit_id) : undefined} />
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;
