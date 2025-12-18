import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { type labPanel, type labTest, type patientInfo } from "../types";
import { fetchInvoice } from "../utils";
import Invoice from "./Invoice";
import ShowWithSignature from "../ShowWithSignature";

export default function InvoiceContainer() {
  const [loading, setLoading] = useState(true);
  const { visit_id } = useParams<{ visit_id: string }>();
  const [listOfTests, setListOfTests] = useState<labTest[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<number>(0);
  const [patient, setPatient] = useState<patientInfo>();
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [patientInsuranceCompanyRate, setPatientInsuranceCompanyRate] =
    useState<number>(0);
  const [error, setError] = useState<string>("");
  const version = useRef(0);
  const [listOfPanels, setListOfPanels] = useState<labPanel[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showSignatureOption, setShowSignatureOption] = useState<boolean>(true);
  useEffect(() => {
    fetchInvoice(visit_id!)
      .then((data) => {
        console.log("Fetched data: ", data);
        setPatient(data.patient);
        setListOfTests(data.invoice_data.list_of_tests);
        setVisitDate(data.invoice_data.visit_date);
        const testsTotal = data.invoice_data.list_of_tests.reduce(
          (acc, t) => acc + t.price,
          0
        );
        const panelsTotal = data.invoice_data.list_of_lab_panels.reduce(
          (acc, panel) => acc + (panel.lab_panel_price ?? 0),
          0
        );
        setDiscountPercentage(data.invoice_data.discount_percentage);
        setTotalPrice(testsTotal + panelsTotal);
        setListOfPanels(data.invoice_data.list_of_lab_panels);
        setPatientInsuranceCompanyRate(
          data.invoice_data.patient_insurance_company_rate
        );
        setInvoiceNumber(data.invoice_data.invoice_number);
        setLoading(false);
      })
      .catch((err) => setError(err.message || "Failed to load"));
    version.current += 1;
  }, [discountPercentage, visit_id]);

  console.log("patient: ", patient);
  console.log("visisDate: ", visitDate);

  console.log("totalPrice: ", totalPrice);

  if (loading) return <div>Loading invoice…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: "100%", height: "800px" }}>
      {showSignatureOption && (
        <ShowWithSignature
          setShowSignature={setShowSignature}
          setShowSignatureOption={setShowSignatureOption}
        />
      )}
      {!showSignatureOption && (
        <Invoice
          invoice_number={invoiceNumber}
          discount_percentage={discountPercentage}
          showSignature={showSignature}
          list_of_lab_panels={listOfPanels}
          patient_insurance_company_rate={patientInsuranceCompanyRate}
          patient={patient!}
          list_of_tests={listOfTests}
          total_price={totalPrice}
          visit_date={visitDate}
        />
      )}
    </div>
  );
}
