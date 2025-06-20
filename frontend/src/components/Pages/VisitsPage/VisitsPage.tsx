import { useNavigate } from "react-router-dom";
// import DateRangePicker from './DataRangePicker';
import React, { useEffect, useMemo, useState } from "react";
// import api from '../../../api';
import VisitsPageHead from "./VisitsPageHead";
import {
  fetchAllInsuranceCompanies,
  fetchAllVisits,
  fetchNumberOfCompletedResultsAndTotal,
  fetchPatient,
} from "../../utils";
import {
  type CompletedResultsInfo,
  type insuranceCompanyParams,
  type patientInfo,
  type VisitsInfo,
} from "../../types";
import handleDeleteVisit from "./handleDeleteVisit";

const Visits: React.FC = () => {
  // const [patientData,setPatientData] = useState<PatientInfo[]>([]);
  // const [status, setStatus] = useState<string>("");
  const navigate = useNavigate();

  const [visits, setVisits] = useState<VisitsInfo[]>([]);
  const [patientsData, setPatientsData] = useState<patientInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [insuranceCompanies, setInsuranceCompanies] = useState<
    insuranceCompanyParams[]
  >([]);
  const [resultsPatientsData, setResultsPatientsData] = useState<
    CompletedResultsInfo[]
  >([]);
  // const [visibleVisits] = useState<[]>([]);
  // const today = new Date().toISOString().split("T")[0];
  // const [startDate, setStartDate] = useState<string>(today);
  // const [endDate, setEndDate] = useState<string>(today);

  useEffect(() => {
    if (visits.length > 0) {
      const fetchTotalCompleted = async () => {
        try {
          const CompletedResultsInfo = await Promise.all(
            visits.map((v) => fetchNumberOfCompletedResultsAndTotal(v.visit_id))
          );
          setResultsPatientsData(CompletedResultsInfo);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message || "Failed to load patient data");
            console.log(error);
          }
        }
      };
      fetchTotalCompleted();
    }
  }, [visits, error]);

  useEffect(() => {
    fetchAllVisits()
      .then((data) => setVisits(data))
      .catch((err) => setError(err.message || "Failed to load companies"));
  }, [setError]);

  useEffect(() => {
    fetchAllInsuranceCompanies()
      .then(setInsuranceCompanies)
      .catch((err) => setError(err.message || "Failed to load companies"));
  }, [setError]);

  useEffect(() => {
    if (visits.length > 0) {
      const fetchPatients = async () => {
        try {
          const patientsInfo = await Promise.all(
            visits.map((v) => fetchPatient(v.patient_id))
          );
          setPatientsData(patientsInfo);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message || "Failed to load patient data");
            console.log(error);
          }
        }
      };
      fetchPatients();
    }
  }, [visits, error]);

  const patientNameById = useMemo(() => {
    return patientsData.reduce<Record<string, string>>((map, c) => {
      map[c.patient_id] = c.patient_name;
      return map;
    }, {});
  }, [patientsData]);

  const CompletedResultsByVisitId = useMemo(() => {
    return resultsPatientsData.reduce<Record<string, number>>((map, c) => {
      map[c.visit_id] = c.countOfCompletedResults;
      return map;
    }, {});
  }, [resultsPatientsData]);

  const TotalTestsResultsByVisitId = useMemo(() => {
    return resultsPatientsData.reduce<Record<string, number>>((map, c) => {
      map[c.visit_id] = c.totalNumberOfTests;
      return map;
    }, {});
  }, [resultsPatientsData]);

  const TotalPriceByVisitId = useMemo(() => {
    return resultsPatientsData.reduce<Record<string, number>>((map, c) => {
      map[c.visit_id] = c.totalPrice;
      return map;
    }, {});
  }, [resultsPatientsData]);

  const companyById = useMemo(() => {
    return insuranceCompanies.reduce<Record<string, string>>((map, c) => {
      map[c.insurance_company_id] = c.insurance_company_name;
      return map;
    }, {});
  }, [insuranceCompanies]);

  const insuranceCompanyById = useMemo(() => {
    return patientsData.reduce<Record<string, string>>((map, p) => {
      map[p.patient_id] = companyById[p.insurance_company_id];
      return map;
    }, {});
  }, [patientsData, companyById]);

  return (
    <div className="relative w-screen h-screen bg-white">
      <main className="relative">
        <div className="relative w-full mt-10">
          <div className="p-8 bg-white">
            <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
              <VisitsPageHead />
              <tbody>
                {visits.map((v) => (
                  <tr key={v.visit_id} className="border rounded-sm">
                    <td className="border rounded-b-sm px-4 py-2">{v.date}</td>
                    <td className="border rounded-b-sm px-4 py-2 font-bold">
                      {patientNameById[v.patient_id]}
                    </td>
                    <td className="border rounded-b-sm  px-4 py-2">
                      {insuranceCompanyById[v.patient_id]}
                    </td>
                    <td className="border rounded-b-sm  px-4 py-2">
                      {TotalPriceByVisitId[v.visit_id]} $
                    </td>
                    <td className="border rounded-b-sm  px-4 py-2">
                      {CompletedResultsByVisitId[v.visit_id]} /{" "}
                      {TotalTestsResultsByVisitId[v.visit_id]}
                    </td>

                    <td className="border rounded-b-sm  px-4 py-2">
                      <button
                        className="mt-4 p-2 h-fit w-fit rounded-sm text-center bg-blue-400 hover:bg-green-600"
                        onClick={() => navigate(`/visits/${v.visit_id}`)}
                      >
                        Preview Result
                      </button>
                    </td>
                    <td className="border rounded-b-sm  px-4 py-2">
                      <button
                        className="mt-4 p-2 h-fit w-fit rounded-sm text-center bg-blue-400 hover:bg-green-600"
                        onClick={() => navigate(`/visits/${v.visit_id}`)}
                      >
                        Edit Visit
                      </button>
                    </td>
                    <td className="border rounded-b-sm  px-4 py-2">
                      <button
                        className="mt-4 p-2 h-fit w-fit rounded-sm text-center bg-red-500 hover:bg-red-600"
                        onClick={() =>
                          handleDeleteVisit(v.visit_id, v.patient_id)
                        }
                      >
                        Delete Visit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-center bg-white p-4 rounded-xl shadow-md">             */}
            {/* <DateRangePicker startDate={startDate} endDate={endDate} setEndDate={setEndDate} setStartDate={setStartDate}/> 
                    <button
                        onClick={handleSubmit}
                        className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Submit
                    </button>
                    <p className="mt-4 text-gray-700">{status}</p> */}

            {/* </div> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Visits;
