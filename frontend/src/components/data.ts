const listOfAttributesInsuranceCompany = [
  {
    subItem: "Name",
    attributeName: "insurance_company_name",
    typeOfInput: "string",
    icon: "User",
    placeHolder: "Enter insurance company name",
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
    placeHolder: "Enter nssf ID",
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
    subItem: "Price",
    attributeName: "price",
    typeOfInput: "number",
    icon: "DollarSign",
    placeHolder: "Enter price",
  },
  {
    subItem: "Lower Bound",
    attributeName: "lower_bound",
    typeOfInput: "number",
    icon: "lowerbound",
    placeHolder: "Enter lower bound",
  },
  {
    subItem: "Upper Bound",
    attributeName: "upper_bound",
    typeOfInput: "number",
    icon: "upperbound",
    placeHolder: "Enter upper bound",
  },
];
const labTestApiURL = "/lab_test_type/";
const labTestMainPageURL = "/lab-tests";
const labTestEditPageURL="/edit-lab-test/";
const labTestCreatePageURL="/create-lab-test";

//Panels
export const listOfAttributesLabPanel = [
  {
    subItem: "Lab Panel Name",
    attributeName: "panel_name",
    typeOfInput: "number",
    icon: "labtest",
    placeHolder: "Enter nssf ID",
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
    subItem: "Price",
    attributeName: "price",
    typeOfInput: "number",
    icon: "DollarSign",
    placeHolder: "Enter price",
  },
  {
    subItem: "Lower Bound",
    attributeName: "lower_bound",
    typeOfInput: "number",
    icon: "lowerbound",
    placeHolder: "Enter lower bound",
  },
  {
    subItem: "Upper Bound",
    attributeName: "upper_bound",
    typeOfInput: "number",
    icon: "upperbound",
    placeHolder: "Enter upper bound",
  },
];
const labPanelApiURL = "/lab_panel";
const labPanelEditPageURL="/edit-lab-panel/";
const labPanelCreatePageURL="/create-lab-panel";
const labPanelMainPageURL = "/lab-panels";

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