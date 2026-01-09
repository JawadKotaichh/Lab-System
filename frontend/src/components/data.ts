const listOfAttributesInsuranceCompany = [
  {
    subItem: "Name",
    attributeName: "insurance_company_name",
    typeOfInput: "string",
    icon: "User",
    placeHolder: "Enter insurance company name",
  },
  {
    subItem: "Currency",
    attributeName: "currency",
    typeOfInput: "Selection",
    icon: "DollarSign",
    placeHolder: "Choose insurance company currency",
  },
  {
    subItem: "Rate",
    attributeName: "rate",
    typeOfInput: "number",
    icon: "DollarSign",
    placeHolder: "Enter insurance company rate",
  },
];
const InsuranceApiURL = "/insurance_company/";
const InsuranceMainPageURL = "/insurance-companies";
const InsuranceEditPageURL = "/edit-insurance-company/";
const InsuranceCreatePageURL = "/create-insurance-company";
//Patient
const listOfAttributesPatient = [
  {
    subItem: "Patient Name",
    attributeName: "name",
    typeOfInput: "string",
    icon: "User",
    placeHolder: "Enter patient name",
  },
  {
    subItem: "DOB",
    attributeName: "DOB",
    typeOfInput: "date",
    icon: "Calendar",
    placeHolder: "Enter DOB of the patient",
  },
  {
    subItem: "Gender",
    attributeName: "gender",
    typeOfInput: "Selection",
    icon: "gendermale",
    placeHolder: "Enter insurance company rate",
  },
  {
    subItem: "Phone Number",
    attributeName: "phone_number",
    typeOfInput: "string",
    icon: "phone",
    placeHolder: "Enter patient phone number",
  },
  {
    subItem: "Insurance Company",
    attributeName: "insurance_company_id",
    typeOfInput: "Selection",
    icon: "building",
    placeHolder: "Choose insurance company",
  },
];
const PatientsApiURL = "/patients/";
const PatientsMainPageURL = "/patients";

// Lab Test 
export const listOfAttributesLabTest = [
  {
    subItem: "Nssf ID",
    attributeName: "nssf_id",
    typeOfInput: "number",
    icon: "id",
    placeHolder: "Enter NSSF ID",
  },
  {
    subItem: "Category",
    attributeName: "lab_test_category_id",
    typeOfInput: "Selection",
    icon: "category",
    placeHolder: "Choose lab test category",
  },
  {
    subItem: "Test Name",
    attributeName: "name",
    typeOfInput: "string",
    icon: "labtest",
    placeHolder: "Enter test name",
  },
  {
    subItem: "Unit",
    attributeName: "unit",
    typeOfInput: "string",
    icon: "unit",
    placeHolder: "Enter unit",
  },
  {
    subItem: "L",
    attributeName: "price",
    typeOfInput: "number",
    icon: "DollarSign",
    placeHolder: "Enter price",
  },
] as const;

const labTestApiURL = "/lab_test_type/";
const labTestMainPageURL = "/lab-tests";
const labTestEditPageURL="/edit-lab-test/";
const labTestCreatePageURL="/create-lab-test";

//Panels
const labPanelApiURL = "/lab_panel/";
const labPanelEditPageURL="/edit-lab-panel/";
const labPanelCreatePageURL="/create-lab-panel";
const labPanelMainPageURL = "/lab-panels";

// Lab Categoory
export const listOfAttributesLabTestCategory = [
  {
    subItem: "Category Name",
    attributeName: "lab_test_category_name",
    typeOfInput: "text",
    icon: "labtest",
    placeHolder: "Enter Category Name",
  },
];
const labTestCategoryApiURL = "/lab_test_category/";
const labTestCategoryMainPageURL = "/lab-test-categories";
const labTestCategoryEditPageURL="/edit-lab-test-category/";
const labTestCategoryCreatePageURL="/create-lab-test-category";

// Visits
export const visitsApiURL = "/visits/";
export const visitsMainPageURL = "/visits";
export const visitEditPageURL="/visits/";
export const visitCreatePageURL="/create-visit";

// lab test results
export const labTestResultApiURL="/lab_tests_results";
export const resultSuggestionsApiURL = "/result_suggestions";

// invoice
export const invoicesApiURL = "/invoices";
export const listOfAttributesInvoice = [
  {
    subItem: "Insurance Company",
    attributeName: "insurance_company_id",
    typeOfInput: "Selection",
    icon: "User",
    placeHolder: "Choose Insurance Company",
  },
  {
    subItem: "Start Date",
    attributeName: "start_date",
    typeOfInput: "date",
    icon: "Calendar",
    placeHolder: "Enter start date",
  },
{
    subItem: "End Date",
    attributeName: "end_date",
    typeOfInput: "date",
    icon: "Calendar",
    placeHolder: "Enter end date",
  },
];

// Financial transactions
const FinancialTransactionsApiURL = "/financial_transaction/";
const FinancialTransactionsMainPageURL = "/financial-transactions";
const listOfAttributesFinancialTransaction = [
  {
    subItem: "Type",
    attributeName: "type",
    typeOfInput: "Selection",
    icon: "type",
    placeHolder: "Enter transaction type",
  },
  {
    subItem: "Date",
    attributeName: "date",
    typeOfInput: "date",
    icon: "date",
    placeHolder: "Enter date of the transaction",
  },
  {
    subItem: "Currency",
    attributeName: "currency",
    typeOfInput: "Selection",
    icon: "currency",
    placeHolder: "Enter transaction currency",
  },
  {
    subItem: "Category",
    attributeName: "category",
    typeOfInput: "Selection",
    icon: "category",
    placeHolder: "Enter transaction category",
  },
  {
    subItem: "Amount",
    attributeName: "amount",
    typeOfInput: "number",
    icon: "amount",
    placeHolder: "Enter transaction amount",
  },
   {
    subItem: "Description",
    attributeName: "description",
    typeOfInput: "string",
    icon: "description",
    placeHolder: "Enter description",
  },
];

const listOfAttributesFinancialTransactionSummary = [
  {
    subItem: "Type",
    attributeName: "type",
    typeOfInput: "Selection",
    icon: "type",
    placeHolder: "Select transaction type",
  },
  {
    subItem: "Currency",
    attributeName: "currency",
    typeOfInput: "Selection",
    icon: "currency",
    placeHolder: "Select transaction currency",
  },
  {
    subItem: "Category",
    attributeName: "category",
    typeOfInput: "Selection",
    icon: "category",
    placeHolder: "Select transaction category",
  },
  {
    attributeName: "start_date",
    subItem: "From date",
    icon: "date",
    typeOfInput: "date",
    placeHolder: "",
  },
  {
    attributeName: "end_date",
    subItem: "To date",
    icon: "date",
    typeOfInput: "date",
    placeHolder: "",
  },
];


export{listOfAttributesFinancialTransactionSummary};
export{FinancialTransactionsMainPageURL};
export{FinancialTransactionsApiURL};
export{listOfAttributesFinancialTransaction};
export{labTestCategoryMainPageURL};
export{labTestCategoryEditPageURL};
export{labTestCategoryCreatePageURL};
export{labTestCategoryApiURL};
export { listOfAttributesInsuranceCompany };
export { listOfAttributesPatient };
export { labTestApiURL };
export {labTestEditPageURL};
export {labTestCreatePageURL};
export { labTestMainPageURL };
export { InsuranceEditPageURL };
export { InsuranceMainPageURL };
export { InsuranceCreatePageURL };
export { InsuranceApiURL };
export { PatientsApiURL };
export { PatientsMainPageURL };
export {labPanelMainPageURL};
export { labPanelApiURL };
export {labPanelEditPageURL};
export {labPanelCreatePageURL};