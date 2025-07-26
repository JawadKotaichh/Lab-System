import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import type { patientInfo, TestResult } from "../types";
import { fetchResultList } from "../utils";
import ResultList from "./Result";

export default function ResultContainer() {
  const [loading, setLoading] = useState(true);
  const { visit_id } = useParams<{ visit_id: string }>();
  const [listOfLabTestsResult, setListOfLabTestsResults] = useState<
    TestResult[]
  >([]);
  const [patient, setPatient] = useState<patientInfo>();
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [error, setError] = useState<string>("");
  const version = useRef(0);

  useEffect(() => {
    fetchResultList(visit_id!)
      .then((data) => {
        setPatient(data.patient);
        setListOfLabTestsResults(data.listOfLabTestResults);
        setVisitDate(data.visit_date);
        setLoading(false);
      })
      .catch((err) => setError(err.message || "Failed to load"));
    version.current += 1;
  }, [visit_id]);

  console.log("patient: ", patient);
  console.log("visisDate: ", visitDate);
  console.log("listOfLabTestsResult: ", listOfLabTestsResult);

  if (loading) return <div>Loading invoice…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ width: "100%", height: "800px" }}>
      <ResultList
        patient={patient!}
        listOfLabTestResults={listOfLabTestsResult}
        visit_date={visitDate}
      />
    </div>
  );
}
