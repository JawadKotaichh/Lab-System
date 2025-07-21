export type Params = {
  patient_id: string;
  visit_id: string;
};

export type LabTestResult = {
  lab_test_type_id: string;
  result: string;
};

export type visitResult = {
  lab_test_result_id: string;
  lab_test_type: labTest;
  result: string;
  lab_test_type_id: string;
};

export type paginatedVisitResults = {
  visit_id: string;
  list_of_results: visitResult[];
  TotalNumberOfLabTestResults: number;
  total_pages: number;
};

export type labTest = {
  lab_test_id: string;
  lab_test_category_name?: string;
  lab_test_category_id: string;
  name: string;
  nssf_id: number;
  unit: string;
  price: number;
  upper_bound: string;
  lower_bound: string;
};
export type labPanel = {
  id: string;
  panel_name: string;
  lab_tests: labTest[];
};
export type CreateLabTestParams = {
  lab_test_category_id: string;
  name: string;
  nssf_id: number;
  unit: string;
  price: number;
  upper_bound: string;
  lower_bound: string;
};
export type CreateLabPanelParams = {
  panel_name: string;
  list_of_test_type_ids: string[];
};
export interface InsuranceFilters {
  insurance_company_name?: string;
  rate?: number;
}
export interface labPanelFilter {
  panel_name?: string;
}
export interface labTestFilters {
  nssf_id?: number;
  name?: string;
  price?: number;
  unit?: string;
  lower_bound?: string;
  upper_bound?: string;
}
export interface lab_test_category_filters {
  lab_test_category_name?: string;
}
export interface patientsFilters {
  name?: string;
  gender?: string;
  insurance_company_id?: string;
  phone_number?: string;
  DOB?: string;
}
export interface visitFilters {
  name?: string;
  insurance_company_name?: string;
  date?: string;
}

export type patientInfo = {
  patient_id: string;
  name: string;
  gender: string;
  DOB: string;
  phone_number: string;
  insurance_company_id: string;
  insurance_company_name: string;
};

export type PatientParams = {
  patient_id: string;
  visit_id: string;
};

export interface UpdatePatient {
  name?: string;
  DOB?: string;
  gender?: string;
  phone_number?: string;
  insurance_company_name?: string;
}

export interface CreateLabTestType {
  nssf_id: number;
  lab_test_category_id: string;
  name: string;
  unit: string;
  price: number;
  lower_bound: string;
  upper_bound: string;
}

export interface insuranceCompanyParams {
  insurance_company_id: string;
  insurance_company_name: string;
  rate: number;
}
export interface CreateInsuranceCompanyParams {
  insurance_company_name: string;
  rate: number;
}
export interface CreateLabTestCategoryParams {
  lab_test_category_id: string;
  lab_test_category_name: string;
}

export interface labTestCategoryParams {
  lab_test_category_id: string;
  lab_test_category_name: string;
}

export type LabTestTypeParams = {
  lab_test_type_id: string;
};
export type paginatedPatientInfo = {
  total_pages: number;
  TotalNumberOfPatients: number;
  patients: patientInfo[];
};
export type paginatedTestCategoryInfo = {
  total_pages: number;
  TotalNumberOfLabTestCategories: number;
  lab_test_categories: labTestCategoryParams[];
};
export type paginatedVisitData = {
  visitsData: visitData[];
  total_pages: number;
  TotalNumberOfVisits: number;
};
export type visitData = {
  visit_id: string;
  visit_date: string;
  patient: patientInfo;
  completed_tests_results: number;
  total_tests_results: number;
  total_price: number;
  total_price_with_insurance: number;
  insurance_company_name: string;
};
export type paginatedlabTest = {
  total_pages: number;
  TotalNumberOfTests: number;
  lab_tests: labTest[];
};
export type paginatedlabPanel = {
  total_pages: number;
  TotalNumberOfPanels: number;
  lab_panels: labPanel[];
};
export type paginatedInsuranceCompany = {
  total_pages: number;
  TotalNumberOfInsuranceCompanies: number;
  insurance_companies: insuranceCompanyParams[];
};
export interface PaginationParams {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  TotalNumberOfPaginatedItems: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}
export type VisitsInfo = {
  visit_id: string;
  date: string;
  patient_id: string;
};
export type CompletedResultsInfo = {
  visit_id: string;
  countOfCompletedResults: number;
  totalNumberOfTests: number;
  totalPrice: number;
};
export type optionsMenuPages = {
  label: string;
  path: string;
};
export interface MenuParams {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create Pages Params
export type attributesParams = {
  subItem: string;
  attributeName: string;
  icon: string;
  typeOfInput: string;
  placeHolder: string;
};
export interface PageTitle {
  title: string;
}
