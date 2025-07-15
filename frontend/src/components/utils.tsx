import type {
  CompletedResultsInfo,
  CreateLabPanelParams,
  CreateLabTestParams,
  insuranceCompanyParams,
  InsuranceFilters,
  labTestCategoryParams,
  LabTestResult,
  paginatedlabPanel,
  paginatedlabTest,
  paginatedPatientInfo,
  paginatedTestCategoryInfo,
  paginatedVisitInfo,
  patientInfo,
  patientsFilters,
  VisitsInfo,
} from "./types.js";
import api from "../api.js";
import type { labTest } from "./types.js";
import {
  InsuranceApiURL,
  labPanelApiURL,
  labTestCategoryApiURL,
  PatientsApiURL,
} from "./data.js";

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
const fetchLabTest = async (
  lab_test_type_id: string
): Promise<CreateLabTestParams> => {
  const url = `/lab_test_type/${lab_test_type_id}`;
  const response = await api.get(url);
  return response.data;
};
const fetchLabPanel = async (
  lab_panel_id: string
): Promise<CreateLabPanelParams> => {
  const url = `${labPanelApiURL}/${lab_panel_id}`;
  const response = await api.get(url);
  return response.data;
};

const fetchLabPanelsPaginated = async (
  page_number: number,
  page_size: number
): Promise<paginatedlabPanel> => {
  const url = `${labPanelApiURL}/page/${page_size}/${page_number}`;
  const response = await api.get(url);
  return response.data;
};

const fetchInsuranceCompaniesPaginated = async (
  page_number: number,
  page_size: number,
  filters: InsuranceFilters = {}
) => {
  const url = `${InsuranceApiURL}page/${page_size}/${page_number}`;
  const response = await api.get(url, { params: filters });
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
const fetchInsuranceCompany = async (
  insurance_company_id: string
): Promise<insuranceCompanyParams> => {
  const response = await api.get(`/insurance_company/${insurance_company_id}`);
  return response.data;
};
const fetchLabTestCategory = async (
  lab_test_category_id: string
): Promise<labTestCategoryParams> => {
  const response = await api.get(
    `${labTestCategoryApiURL}${lab_test_category_id}`
  );
  return response.data;
};

export const createVisit = (patientId: string) => {
  return api.post(`/visits/${patientId}/`, {
    patient_id: patientId,
    date: new Date().toISOString(),
  });
};

const fetchAllLabTestTypeCategories = async (): Promise<
  labTestCategoryParams[]
> => {
  const url = "/lab_test_category/all";
  const response = await api.get(url);
  return response.data;
};

const fetchPatientsPaginated = async (
  page_number: number,
  page_size: number,
  filters: patientsFilters = {}
): Promise<paginatedPatientInfo> => {
  const url = `${PatientsApiURL}page/${page_size}/${page_number}`;
  const response = await api.get(url, { params: filters });
  return response.data;
};

// const fetchPatientsPaginatedTest = async (
//   pageNumber: number,
//   pageSize: number,
//   filters: {
//     name?: string;
//     gender?: string;
//     insurance_company_id?: string;
//   } = {}
// ): Promise<paginatedPatientInfo> => {
//   const response = await api.get(
//     `${PatientsApiURL}page/${pageSize}/${pageNumber}`,
//     {
//       params: filters,
//     }
//   );
//   return response.data;
// };

const fetchLabTestCategoryPaginated = async (
  page_number: number,
  page_size: number
): Promise<paginatedTestCategoryInfo> => {
  const url = `${labTestCategoryApiURL}page/${page_size}/${page_number}`;
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

const fetchVisitsPaginated = async (
  page_number: number,
  page_size: number
): Promise<paginatedVisitInfo> => {
  const url = `/visits/page/${page_size}/${page_number}`;
  const response = await api.get(url);
  return response.data;
};

export { fetchLabTestCategory };
export { fetchLabPanel };
export { fetchLabTestCategoryPaginated };
export { fetchLabPanelsPaginated };
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
export { fetchVisitsPaginated };
export { fetchInsuranceCompany };
export { fetchLabTest };
export { fetchInsuranceCompaniesPaginated };
