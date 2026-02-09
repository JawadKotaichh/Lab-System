import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  AuthUser,
  InvoiceData,
  lab_test_changed,
  type labPanel,
  type labTest,
  type patientInfo,
} from "../types";
import { fetchInvoice } from "../utils";
import Invoice from "./Invoice";
import ShowWithSignature from "../ShowWithSignature";
import LoadingPage from "../LoadingPage/LoadingPage";

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
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("");
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showSignatureOption, setShowSignatureOption] = useState<boolean>(true);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>();
  const [user] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  });
  const isPatient = user?.role === "patient";

  useEffect(() => {
    if (isPatient) {
      setShowSignature(true);
      setShowSignatureOption(false);
    }
  }, [isPatient]);
  useEffect(() => {
    fetchInvoice(visit_id!)
      .then((data) => {
        console.log("Fetched data: ", data);
        setInvoiceData(data.invoice_data);
        setPatient(data.patient);
        setListOfTests(data.invoice_data.list_of_tests);
        setVisitDate(data.invoice_data.visit_date);
        const testsTotal = data.invoice_data.list_of_tests.reduce(
          (acc, t) => acc + t.price,
          0,
        );
        const panelsTotal = data.invoice_data.list_of_lab_panels.reduce(
          (acc, panel) => acc + (panel.lab_panel_price ?? 0),
          0,
        );
        setAdjustmentAmount(data.invoice_data.adjustment_minor);
        setCurrency(data.currency);
        setTotalPrice(testsTotal + panelsTotal);
        setListOfPanels(data.invoice_data.list_of_lab_panels);
        setPatientInsuranceCompanyRate(
          data.invoice_data.patient_insurance_company_rate,
        );
        setInvoiceNumber(data.invoice_data.invoice_number);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
    version.current += 1;
  }, [adjustmentAmount, visit_id]);

  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!invoiceData) {
      setPriceEdits({});
      return;
    }

    const next: Record<string, number> = {};
    (invoiceData.list_of_lab_tests_ids_changed ?? []).forEach(
      (x: lab_test_changed) => {
        next[String(x.lab_test_id)] = x.new_price;
      },
    );

    setPriceEdits(next);
  }, [invoiceData]);

  useEffect(() => {
    if (!invoiceData) return;
    const rate = invoiceData.patient_insurance_company_rate;
    const testsTotal = listOfTests.reduce((acc, t) => {
      const id = String(t.lab_test_id);
      const override = priceEdits[id];
      const effectivePrice = override !== undefined ? override : t.price * rate;
      return acc + effectivePrice;
    }, 0);

    const panelsTotal = listOfPanels.reduce(
      (acc, panel) => acc + (panel.lab_panel_price ?? 0),
      0,
    );

    setTotalPrice(testsTotal + panelsTotal);
  }, [invoiceData, priceEdits, listOfTests, listOfPanels]);
  // console.log("patient: ", patient);
  // console.log("visisDate: ", visitDate);
  // console.log("totalPrice: ", totalPrice);
  // console.log("===================TESTING CURRENCY=====================");
  // console.log(currency);
  // console.log("===================TESTING CURRENCY=====================");

  if (loading) return <LoadingPage title="Loading invoice ..." />;
  if (error) return <div>Error: {error}</div>;
  return (
    <div style={{ width: "100%", height: "800px" }}>
      {!isPatient && showSignatureOption && (
        <ShowWithSignature
          setShowSignature={setShowSignature}
          setShowSignatureOption={setShowSignatureOption}
        />
      )}
      {!showSignatureOption && (
        <Invoice
          invoiceData={invoiceData!}
          invoice_number={invoiceNumber}
          adjustment_minor={adjustmentAmount}
          showSignature={showSignature}
          list_of_lab_panels={listOfPanels}
          patient_insurance_company_rate={patientInsuranceCompanyRate}
          patient={patient!}
          list_of_tests={listOfTests}
          total_price={totalPrice}
          visit_date={visitDate}
          currency={currency}
        />
      )}
    </div>
  );
}
