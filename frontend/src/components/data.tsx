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

export { listOfAttributesInsuranceCompany };
export { listOfAttributesPatient };
export { InsuranceMainPageURL };
export { InsuranceApiURL };
export { PatientsApiURL };
export { PatientsMainPageURL };
