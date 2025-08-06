import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import type { labTest, patientInfo } from "../types";
import { fetchInvoice } from "../utils";
import Invoice from "./Invoice";
import { PDFViewer } from "@react-pdf/renderer";

export default function InvoiceContainer() {
  const [loading, setLoading] = useState(true);
  const { visit_id } = useParams<{ visit_id: string }>();
  const [listOfTests, setListOfTests] = useState<labTest[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [patient, setPatient] = useState<patientInfo>();
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [patientInsuranceCompanyRate, setPatientInsuranceCompanyRate] =
    useState<number>(0);
  const [error, setError] = useState<string>("");
  const version = useRef(0);

  useEffect(() => {
    fetchInvoice(visit_id!)
      .then((data) => {
        setPatient(data.patient);
        setListOfTests(data.listOfTests);
        setVisitDate(data.visit_date);
        setTotalPrice(data.totalPrice);
        setPatientInsuranceCompanyRate(data.patient_insurance_company_rate);
        setLoading(false);
      })
      .catch((err) => setError(err.message || "Failed to load"));
    version.current += 1;
  }, [visit_id]);

  console.log("patient: ", patient);
  console.log("visisDate: ", visitDate);

  console.log("totalPrice: ", totalPrice);

  if (loading) return <div>Loading invoice…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      <Invoice
        patient_insurance_company_rate={patientInsuranceCompanyRate}
        patient={patient!}
        listOfTests={listOfTests}
        totalPrice={totalPrice}
        visit_date={visitDate}
      />
    </PDFViewer>
  );
}
