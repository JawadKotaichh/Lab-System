import { useNavigate } from "react-router-dom";
// import DateRangePicker from './DataRangePicker';
import React, { useEffect, useMemo, useState } from "react";
// import api from '../../../api';
import VisitsPageHead from "./VisitsPageHead";
import {
  fetchAllInsuranceCompanies,
  fetchNumberOfCompletedResultsAndTotal,
  fetchPatient,
  fetchVisitsPaginated,
} from "../utils";
import {
  type CompletedResultsInfo,
  type insuranceCompanyParams,
  type patientInfo,
  type VisitsInfo,
} from "../types";
import handleDeleteVisit from "./handleDeleteVisit";
import Pagination from "../Pagination";
import { pageListTitle } from "../../style";

const Visits: React.FC = () => {
  const navigate = useNavigate();
  const [visibleVisits, setVisibleVisits] = useState<VisitsInfo[]>([]);
  const [patientsData, setPatientsData] = useState<patientInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [insuranceCompanies, setInsuranceCompanies] = useState<
    insuranceCompanyParams[]
  >([]);
  const [resultsPatientsData, setResultsPatientsData] = useState<
    CompletedResultsInfo[]
  >([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalNumberOfVisits, setTotalNumberOfVisits] = useState<number>(0);

  // const [visibleVisits] = useState<[]>([]);
  // const today = new Date().toISOString().split("T")[0];
  // const [startDate, setStartDate] = useState<string>(today);
  // const [endDate, setEndDate] = useState<string>(today);

  useEffect(() => {
    if (pageSize && currentPage) {
      fetchVisitsPaginated(currentPage, pageSize)
        .then((data) => {
          setVisibleVisits(data.visits);
          setTotalPages(data.total_pages);
          setTotalNumberOfVisits(data.TotalNumberOfVisits);
        })
        .catch((err) => setError(err.message || "Failed to load"));
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (visibleVisits.length > 0) {
      const fetchTotalCompleted = async () => {
        try {
          const CompletedResultsInfo = await Promise.all(
            visibleVisits.map((v) =>
              fetchNumberOfCompletedResultsAndTotal(v.visit_id)
            )
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
  }, [visibleVisits, error]);

  useEffect(() => {
    fetchAllInsuranceCompanies()
      .then(setInsuranceCompanies)
      .catch((err) => setError(err.message || "Failed to load companies"));
  }, [setError]);

  useEffect(() => {
    if (visibleVisits.length > 0) {
      const fetchPatients = async () => {
        try {
          const patientsInfo = await Promise.all(
            visibleVisits.map((v) => fetchPatient(v.patient_id))
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
  }, [visibleVisits, error]);

  const patientNameById = useMemo(() => {
    return patientsData.reduce<Record<string, string>>((map, c) => {
      map[c.patient_id] = c.name;
      return map;
    }, {});
  }, [patientsData]);

  const phoneNumberById = useMemo(() => {
    return patientsData.reduce<Record<string, string>>((map, c) => {
      map[c.patient_id] = c.phone_number;
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
        <div className="relative w-full">
          <div className="p-8 bg-white">
            <h1 className={pageListTitle}>Visits</h1>
            <Pagination
              TotalNumberOfPaginatedItems={totalNumberOfVisits}
              setPageSize={setPageSize}
              pageSize={pageSize}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
            <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
              <VisitsPageHead />
              <tbody>
                {visibleVisits.map((v) => (
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
                      {phoneNumberById[v.patient_id]}
                    </td>

                    <td className="border rounded-b-sm  px-4 py-2">
                      {CompletedResultsByVisitId[v.visit_id]} /
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
                        onClick={() => {
                          const patient = patientsData.find(
                            (p) => p.patient_id === v.patient_id
                          )!;
                          navigate(`/visits/${v.visit_id}`, {
                            state: {
                              patientData: {
                                ...patient,
                                insurance_company_id:
                                  companyById[patient.insurance_company_id],
                              },
                            },
                          });
                        }}
                      >
                        Edit Visit
                      </button>
                    </td>
                    <td className="border rounded-b-sm  px-4 py-2">
                      <button
                        className="mt-4 p-2 h-fit w-fit rounded-sm text-center bg-red-500 hover:bg-red-600"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this visit?"
                            )
                          ) {
                            handleDeleteVisit(v.visit_id!);
                          }
                        }}
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
