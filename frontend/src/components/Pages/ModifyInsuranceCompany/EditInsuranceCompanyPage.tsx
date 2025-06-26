import CreateInsuranceCompanyComponent from "./ModifyInsuranceCompany";

const EditInsuranceCompanyPage = () => {
  const listOfAttributes = [
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
  const apiURL = "/insurance_company/";
  const title = "Edit Insurance Company";
  const pageUrL = "/insurance-companies";

  return (
    <CreateInsuranceCompanyComponent
      listOfAttributes={listOfAttributes}
      apiURL={apiURL}
      title={title}
      pageUrL={pageUrL}
    />
  );
};
export default EditInsuranceCompanyPage;
