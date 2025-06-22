export type Params = {
  patient_id: string;
  visit_id: string;
};

export type LabTestResult = {
  lab_test_type_id: string;
  lab_test_category_id: string;
  lab_test_name: string;
  result: string;
  unit: string;
  price: number;
  upper_bound: string;
  lower_bound: string;
  lab_test_result_id: string;
};

export type labTest = {
  lab_test_id: string;
  lab_test_category_id: string;
  lab_test_name: string;
  nssf_id: number;
  unit: string;
  price: number;
  upper_bound: string;
  lower_bound: string;
};

export type patientInfo = {
  patient_id: string;
  patient_name: string;
  gender: string;
  DOB: string;
  phone_number: string;
  insurance_company_id: string;
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

export interface CreatePatient {
  name: string;
  DOB: string;
  gender: string;
  phone_number: string;
  insurance_company_id: string;
}

export interface CreateLabTestType {
  nssf_id: string;
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
  rate: string;
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
export type paginatedVisitInfo = {
  total_pages: number;
  TotalNumberOfVisits: number;
  visits: VisitsInfo[];
};
export type paginatedlabTest = {
  total_pages: number;
  TotalNumberOfTests: number;
  lab_tests: labTest[];
};
export interface PaginationParams {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  TotalNumberOfPaginatedItems: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
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
  options: optionsMenuPages[];
}
