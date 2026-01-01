export type description_only = {
  description?: string;
};
export type upper_bound_only = {
  description?: string;
  upper_bound_value: number;
};

export type lower_bound_only = {
  description?: string;
  lower_bound_value: number;
};
export type upper_and_lower_bound_only = {
  description?: string;
  lower_bound_value: number;
  upper_bound_value: number;
};
export type positive_or_negative = {
  description?: string;
  normal_value: string;
};
export type result_suggestions = {
  lab_test_type_id: string;
  value: string;
  use_count: number;
};
export type normal_value_by_gender = {
  description?: string;
  male_normal_value_type:
    | description_only
    | upper_and_lower_bound_only
    | positive_or_negative
    | upper_bound_only
    | lower_bound_only;
  female_normal_value_type:
    | description_only
    | upper_and_lower_bound_only
    | positive_or_negative
    | upper_bound_only
    | lower_bound_only;
};

export type NV =
  | description_only
  | upper_and_lower_bound_only
  | upper_bound_only
  | lower_bound_only
  | positive_or_negative
  | normal_value_by_gender;

export type NVPartial =
  | Partial<description_only>
  | Partial<upper_and_lower_bound_only>
  | Partial<upper_bound_only>
  | Partial<lower_bound_only>
  | Partial<positive_or_negative>
  | Partial<normal_value_by_gender>;

export type NVType =
  | "description_only"
  | "upper_and_lower_bound_only"
  | "upper_bound_only"
  | "lower_bound_only"
  | "positive_or_negative"
  | "normal_value_by_gender";

export type GenderNV =
  | description_only
  | upper_and_lower_bound_only
  | upper_bound_only
  | lower_bound_only
  | positive_or_negative;
export type GenderType = Exclude<NVType, "normal_value_by_gender">;

export type monthlySummaryInvoicesParams = {
  insurance_company_id: string;
  start_date: Date;
  end_date: Date;
  currency?: string;
};

export type patientTestResult = {
  lab_test_result_id: string;
  lab_test_type: labTest;
  lab_test_type_id: string;
  result: string;
  prev_result?: string;
  prev_date?: Date;
};

export type patientPanelResult = {
  lab_panel_id: string;
  lab_panel_name: string;
  lab_panel_price: number;
  lab_panel_category_id: string;
  lab_panel_category_name?: string;
  list_of_test_results: patientTestResult[];
};

export type paginatedMixedVisitResults = {
  visit_id: string;
  list_of_standalone_test_results: patientTestResult[];
  list_of_panel_results: patientPanelResult[];
  TotalNumberOfLabTestResults: number;
  total_pages: number;
};
export type resultListData = {
  visit_date: Date;
  report_date: Date;
  patient: patientInfo;
  visit_id: string;
  list_of_standalone_test_results: patientTestResult[];
  list_of_panel_results: patientPanelResult[];
};

export type InvoiceWrapperProps = {
  invoice_number: number;
  currency: string;
  list_of_lab_panels: labPanel[];
  list_of_tests: labTest[];
  patient: patientInfo;
  visit_date: Date;
  total_price: number;
  discount_percentage: number;
  patient_insurance_company_rate: number;
  showSignature: boolean;
};
export type InvoiceData = {
  invoice_number: number;
  currency: string;
  visit_id: string;
  discount_percentage: number;
  list_of_lab_panels: labPanel[];
  list_of_tests: labTest[];
  visit_date: Date;
  patient_insurance_company_rate: number;
};
export type fetchedInvoiceData = {
  patient: patientInfo;
  invoice_data: InvoiceData;
  currency: string;
};
export type updateInvoiceData = {
  list_of_tests?: labTest[];
  list_of_lab_panels?: labPanel[];
  visit_id?: string;
  visit_date?: Date;
  currency?: string;
  discount_percentage?: number;
  patient_insurance_company_rate?: number;
};
export type visitResultData = {
  list_of_standalone_test_results: patientTestResult[];
  patient: patientInfo;
  visit_date: Date;
  report_date: Date;
  list_of_panel_results: patientPanelResult[];
  showSignature?: boolean;
};
export type Params = {
  patient_id: string;
  visit_id: string;
};

export type LabTestResult = {
  lab_test_type_id: string;
  lab_panel_name?: string;
  result: string;
};
export type TestResult = {
  name: string;
  result: string;
  unit: string;
  lower_bound: string;
  upper_bound: string;
  lab_panel_name: string;
  lab_test_category_name: string;
};

export type visitResult = {
  lab_test_result_id: string;
  lab_panel_id?: string;
  lab_test_type: labTest;
  lab_panel_name: string;
  result: string;
  lab_test_type_id: string;
};

export type paginatedVisitResults = {
  visit_id: string;
  list_of_results: visitResult[];
  TotalNumberOfLabTestResults: number;
  total_pages: number;
};
export type labPanelsWithIdsList = {
  lab_panel: labPanel;
  list_of_lab_test_ids: string[];
};

export type labTest = {
  lab_test_id: string;
  lab_test_category_name?: string;
  lab_test_category_id: string;
  name: string;
  nssf_id: number;
  unit: string;
  price: number;
  normal_value_list: (
    | upper_and_lower_bound_only
    | upper_bound_only
    | lower_bound_only
    | positive_or_negative
    | normal_value_by_gender
  )[];
};
export type labPanel = {
  nssf_id?: number;
  id: string;
  panel_name: string;
  lab_tests: labTest[];
  lab_panel_price?: number;
  lab_panel_category_id?: string;
};
export type CreateLabTestParams = {
  lab_test_category_id: string;
  name: string;
  nssf_id: number;
  unit: string;
  price: number;
  normal_value_list: (
    | description_only
    | upper_and_lower_bound_only
    | upper_bound_only
    | lower_bound_only
    | positive_or_negative
    | normal_value_by_gender
  )[];
};
export type CreateLabPanelParams = {
  nssf_id: number;
  lab_panel_price: number;
  panel_name: string;
  list_of_test_type_ids: string[];
  lab_panel_category_id: string;
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
  patient_id?: string;
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
  normal_value_list:
    | description_only
    | upper_and_lower_bound_only
    | upper_bound_only
    | lower_bound_only
    | positive_or_negative
    | normal_value_by_gender;
}

export interface insuranceCompanyParams {
  insurance_company_id: string;
  insurance_company_name: string;
  rate: number;
  currency: string;
}
export interface CreateInsuranceCompanyParams {
  insurance_company_name: string;
  rate: number;
  currency: string;
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
  posted: boolean;
  visit_id: string;
  currency: string;
  visit_date: Date;
  report_date: Date;
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

// User params
export type user = {
  user_id: string;
  username: string;
  password: string;
};
export type LoginResponse = {
  ok: boolean;
  user_id?: string;
  username?: string;
  role: string;
};

export type Role = "admin" | "patient";

export type AuthUser = {
  user_id: string;
  username: string;
  role: Role;
};

export type CreatePatientAccountProps = {
  user_id: string;
  username: string;
  password: string;
};
