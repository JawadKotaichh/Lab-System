import type {
  CompletedResultsInfo,
  insuranceCompanyParams,
  labTestCategoryParams,
  LabTestResult,
  paginatedlabTest,
  paginatedPatientInfo,
  patientInfo,
  VisitsInfo,
} from "./types.js";
import api from "../api.js";
import type { labTest } from "./types.js";

const fetchLabTestResults = async (
  visit_id: string
): Promise<LabTestResult[]> => {
  const url = `/lab_tests_results/all/${visit_id}`;
  const response = await api.get(url);
  return response.data;
};

const fetchAllLabTest = async (): Promise<labTest[]> => {
  const url = "/lab_test_type/all";
  const response = await api.get(url);
  return response.data;
};
const fetchAllPatients = async (): Promise<patientInfo[]> => {
  const url = "/patients/all";
  const response = await api.get(url);
  return response.data;
};
const fetchAllInsuranceCompanies = async (): Promise<
  insuranceCompanyParams[]
> => {
  const url = "/insurance_company/all";
  const response = await api.get(url);
  return response.data;
};
const fetchPatient = async (patient_id: string): Promise<patientInfo> => {
  const response = await api.get(`/patients/${patient_id}`);
  return response.data;
};

export const createVisit = (patientId: string) => {
  return api.post(`/patients/${patientId}/visits`, {
    patient_id: patientId,
    date: new Date().toISOString(),
  });
};

const fetchAllLabTestTypeCategories = async (): Promise<
  labTestCategoryParams[]
> => {
  const url = "/lab_test_type_category/all";
  const response = await api.get(url);
  return response.data;
};

const fetchPatientsPaginated = async (
  page_number: number,
  page_size: number
): Promise<paginatedPatientInfo> => {
  const url = `/patients/page/${page_size}/${page_number}`;
  const response = await api.get(url);
  return response.data;
};

const fetchLabTestTypePaginated = async (
  page_number: number,
  page_size: number
): Promise<paginatedlabTest> => {
  const url = `/lab_test_type/page/${page_size}/${page_number}`;
  const response = await api.get(url);
  return response.data;
};
const fetchAllVisits = async (): Promise<VisitsInfo[]> => {
  const url = `/visits/all`;
  const response = await api.get(url);
  return response.data;
};

const fetchNumberOfCompletedResultsAndTotal = async (
  visit_id: string
): Promise<CompletedResultsInfo> => {
  const url = `/lab_tests_results/completed/${visit_id}`;
  const response = await api.get(url);
  return response.data;
};

export { fetchNumberOfCompletedResultsAndTotal };
export { fetchLabTestResults };
export { fetchAllLabTest };
export { fetchAllPatients };
export { fetchPatient };
export { fetchAllInsuranceCompanies };
export { fetchAllLabTestTypeCategories };
export { fetchPatientsPaginated };
export { fetchLabTestTypePaginated };
export { fetchAllVisits };
