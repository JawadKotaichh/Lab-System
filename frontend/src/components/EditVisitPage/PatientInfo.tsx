import type { patientInfo } from "../types";
import { FieldError, type FormValidation } from "../FormValidation";
import { inputFormAttributeListItem, patientInfoCard, patientInfoCardGrid, patientInfoCardItem } from "../../style";

type Props = {
  validation: FormValidation;
  patientData: patientInfo;
  visitDate: string;
  reportDate: string;
  onVisitDateChange: (value: string) => void;
  onReportDateChange: (value: string) => void;
};

export default function PatientInfo({ validation, patientData, visitDate, reportDate, onVisitDateChange, onReportDateChange }: Props) {
  return <div className={patientInfoCard}><div className={patientInfoCardGrid}>
    {[["Patient Name", patientData.name], ["Gender", patientData.gender], ["DOB", String(patientData.DOB).split("T")[0]],
      ["Phone Number", patientData.phone_number], ["Insurance Company", patientData.insurance_company_name]].map(([label, value]) => (
      <div key={label} className={inputFormAttributeListItem}><div className={patientInfoCardItem}><span className="font-bold">{label}:</span><span>{value}</span></div></div>
    ))}
    <div className={inputFormAttributeListItem}><label className={patientInfoCardItem}>
      <span className="font-bold">Visit Date:</span><input {...validation.field("visitDate")} type="date" className="min-h-10 px-1 text-base" value={visitDate} onChange={e => onVisitDateChange(e.target.value)} />
    </label><FieldError validation={validation} name="visitDate" /></div>
    <div className={inputFormAttributeListItem}><label className={patientInfoCardItem}>
      <span className="font-bold">Report Date:</span><input {...validation.field("reportDate")} type="date" className="min-h-10 px-1 text-base" value={reportDate} onChange={e => onReportDateChange(e.target.value)} />
    </label><FieldError validation={validation} name="reportDate" /></div>
  </div></div>;
}
