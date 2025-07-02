import { useEffect, useMemo, useState } from "react";
import type { insuranceCompanyParams, patientInfo } from "../../types";
import {
  fetchAllInsuranceCompanies,
  fetchAllPatients,
  fetchPatientsPaginated,
} from "../../utils";
// import SearchPatient from "./SearchPatient";
import { useNavigate } from "react-router-dom";
import { createVisit } from "../../utils";
import Pagination from "../../Pagination";

// Add group if tests
// print pdf result see where it is easer

interface ShowAllPatientsParams {
  allPatients: patientInfo[];
  setAllPatients: React.Dispatch<React.SetStateAction<patientInfo[]>>;
  visiblePatients: patientInfo[];
  setVisiblePatients: React.Dispatch<React.SetStateAction<patientInfo[]>>;
  loadingPatients: boolean;
  setLoadingPatients: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  totalNumberOfPatients: number;
  setTotalNumberOfPatients: React.Dispatch<React.SetStateAction<number>>;
}

const PatientList: React.FC<ShowAllPatientsParams> = ({
  allPatients,
  setAllPatients,
  setVisiblePatients,
  visiblePatients,
  loadingPatients,
  setLoadingPatients,
  error,
  setError,
  // searchInput,
  // setSearchInput,
  currentPage,
  setCurrentPage,
  totalPages,
  setTotalPages,
  pageSize,
  setPageSize,
  setTotalNumberOfPatients,
  totalNumberOfPatients,
}: ShowAllPatientsParams) => {
  const [insuranceCompanies, setInsuranceCompanies] = useState<
    insuranceCompanyParams[]
  >([]);

  useEffect(() => {
    fetchAllInsuranceCompanies()
      .then(setInsuranceCompanies)
      .catch((err) => setError(err.message || "Failed to load companies"));
  }, [setError]);

  const navigate = useNavigate();

  const handleNewVisit = async (patient_id: string) => {
    try {
      const resp = await createVisit(patient_id);
      const newVisit = resp.data;
      navigate(`/visits/${newVisit._id}`);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  const insuranceCompanyById = useMemo(() => {
    return insuranceCompanies.reduce<Record<string, string>>((map, c) => {
      map[c.insurance_company_id] = c.insurance_company_name;
      return map;
    }, {});
  }, [insuranceCompanies]);

  useEffect(() => {
    setLoadingPatients(true);
    fetchAllPatients()
      .then((data) => {
        setAllPatients(data);
        setLoadingPatients(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoadingPatients(false);
      });
  }, [setAllPatients, setError, setLoadingPatients]);

  useEffect(() => {
    if (pageSize && currentPage) {
      fetchPatientsPaginated(currentPage, pageSize)
        .then((data) => {
          setVisiblePatients(data.patients);
          setTotalPages(data.total_pages);
          setTotalNumberOfPatients(data.TotalNumberOfPatients);
        })
        .catch((err) => setError(err.message || "Failed to load"));
    }
  }, [
    pageSize,
    totalPages,
    currentPage,
    setTotalNumberOfPatients,
    setVisiblePatients,
    setTotalPages,
    setError,
  ]);

  if (loadingPatients) return <div className="p-4">Loading Patient list…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className="text-4xl font-semibold mb-6">Patient List</h1>
      {allPatients.length === 0 ? (
        <p> No patients found!</p>
      ) : (
        <>
          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
            <thead className="bg-gray-100 border-b border-black sticky top-0 z-10">
              <tr>
                <th className="h-8 px-0 py-2">Id</th>
                <th className="h-8 px-0 py-2">Name</th>
                <th className="h-8 px-0 py-2">Gender</th>
                <th className="h-8 px-0 py-2">DOB</th>
                <th className="h-8 px-0 py-2">Insurance Company</th>
                <th className="h-8 px-0 py-2">Phone Number</th>
                <th className="h-8 px-0 py-2">New Visit</th>
                <th className="h-8 px-0 py-2">Edit Patient</th>
              </tr>
            </thead>
            <tbody>
              {visiblePatients.map((patient) => (
                <tr key={patient.patient_id} className="border rounded-sm">
                  <td className="border rounded-b-sm px-4 py-2">
                    {patient.patient_id}
                  </td>
                  <td className="font-bold border rounded-b-sm px-4 py-2">
                    {patient.name}
                  </td>
                  <td className="border rounded-b-sm px-4 py-2">
                    {patient.gender}
                  </td>
                  <td className="border rounded-b-sm  px-4 py-2">
                    {new Date(patient.DOB).toLocaleDateString()}
                  </td>
                  <td className="border rounded-b-sm  px-4 py-2">
                    {insuranceCompanyById[patient.insurance_company_id]}
                  </td>
                  <td className="border rounded-b-sm  px-4 py-2">
                    {patient.phone_number}
                  </td>
                  <td className="border rounded-b-sm  px-4 py-2">
                    <button
                      className="p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
                      onClick={() => handleNewVisit(patient.patient_id)}
                    >
                      New Visit
                    </button>
                  </td>
                  <td className="border rounded-b-sm  px-4 py-2">
                    <button
                      className="p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
                      onClick={() =>
                        navigate(`/patients/edit-patient/${patient.patient_id}`)
                      }
                    >
                      Edit Patient
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            TotalNumberOfPaginatedItems={totalNumberOfPatients}
            setPageSize={setPageSize}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
          {/* <SearchPatient
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                setVisiblePatients={setVisiblePatients}
                allPatients={allPatients}
                /> 
                 <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
                    <PatientListHead/>
                    <tbody>
                    {visiblePatients.map(patient => (
                        <tr key={patient.patient_id} className="border rounded-sm">
                        <td className="border rounded-b-sm px-4 py-2">{patient.patient_id}</td>
                        <td className="font-bold border rounded-b-sm px-4 py-2">{patient.patient_name}</td>
                        <td className="border rounded-b-sm px-4 py-2">{patient.gender}</td>
                        <td className="border rounded-b-sm  px-4 py-2">{new Date(patient.DOB).toLocaleDateString()}</td>
                        <td className="border rounded-b-sm  px-4 py-2">{companyById[patient.insurance_company_id]}</td>
                        <td className="border rounded-b-sm  px-4 py-2">{patient.phone_number}</td>
                        <td className="border rounded-b-sm  px-4 py-2">
                            <button 
                            className="p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
                            onClick={() => handleNewVisit(patient.patient_id)}
                            >
                                New Visit 
                            </button>       
                        </td>
                        <td className="border rounded-b-sm  px-4 py-2">
                            <button 
                            className="p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
                            onClick={() => navigate(`/patients/edit-patient/${patient.patient_id}`)}
                            >
                                Edit Patient 
                            </button>
                        </td>
                        </tr>
                    ))} 
                     {visiblePatients.map(patient => (
                        <tr key={patient.patient_id} className="border rounded-sm">
                        <td className="border rounded-b-sm px-4 py-2">{patient.patient_id}</td>
                        <td className="font-bold border rounded-b-sm px-4 py-2">{patient.patient_name}</td>
                        <td className="border rounded-b-sm px-4 py-2">{patient.gender}</td>
                        <td className="border rounded-b-sm  px-4 py-2">{new Date(patient.DOB).toLocaleDateString()}</td>
                        <td className="border rounded-b-sm  px-4 py-2">{companyById[patient.insurance_company_id]}</td>
                        <td className="border rounded-b-sm  px-4 py-2">{patient.phone_number}</td>
                        <td className="border rounded-b-sm  px-4 py-2">
                            <button 
                            className="p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
                            onClick={() => handleNewVisit(patient.patient_id)}
                            >
                                New Visit 
                            </button>       
                        </td>
                        <td className="border rounded-b-sm  px-4 py-2">
                            <button 
                            className="p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
                            onClick={() => navigate(`/patients/edit-patient/${patient.patient_id}`)}
                            >
                                Edit Patient 
                            </button>
                        </td>
                        </tr>
                    ))} 
                     </tbody>
            </table> */}
        </>
      )}
    </div>
  );
};

export default PatientList;
