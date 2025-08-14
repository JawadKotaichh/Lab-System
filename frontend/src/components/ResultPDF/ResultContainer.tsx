import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import type {
  patientInfo,
  patientPanelResult,
  patientTestResult,
} from "../types";
import { fetchResultList } from "../utils";
import ResultList from "./Result";
import ShowWithSignature from "../ShowWithSignature";

export default function ResultContainer() {
  const [loading, setLoading] = useState(true);
  const { visit_id } = useParams<{ visit_id: string }>();
  const [listOfStandAloneTestResults, setListOfSandAloneTestResults] = useState<
    patientTestResult[]
  >([]);
  const [listOfPanelResults, setListOfPanelResults] = useState<
    patientPanelResult[]
  >([]);
  const [patient, setPatient] = useState<patientInfo>();
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [reportDate, setReportDate] = useState<Date>(new Date());

  const [error, setError] = useState<string>("");
  const version = useRef(0);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showSignatureOption, setShowSignatureOption] = useState<boolean>(true);

  useEffect(() => {
    fetchResultList(visit_id!)
      .then((data) => {
        setPatient(data.patient);
        setListOfSandAloneTestResults(data.list_of_standalone_test_results);
        setListOfPanelResults(data.list_of_panel_results);
        setVisitDate(new Date(data.visit_date));
        setReportDate(new Date(data.report_date));
        setLoading(false);
      })
      .catch((err) => setError(err.message || "Failed to load"));
    version.current += 1;
  }, [visit_id]);

  // console.log("listOfStandAloneTestResults: ", listOfStandAloneTestResults);
  // console.log("listOfPanelResults: ", listOfPanelResults);

  if (loading) return <div>Loading Result</div>;
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
        <ResultList
          showSignature={showSignature}
          report_date={reportDate}
          patient={patient!}
          list_of_panel_results={listOfPanelResults}
          list_of_standalone_test_results={listOfStandAloneTestResults}
          visit_date={visitDate}
        />
      )}
    </div>
  );
}
