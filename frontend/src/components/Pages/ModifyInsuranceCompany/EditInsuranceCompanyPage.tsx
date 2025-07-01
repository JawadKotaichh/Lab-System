import {
  InsuranceApiURL,
  InsuranceMainPageURL,
  listOfAttributesInsuranceCompany,
} from "../../data";
import CreateInsuranceCompanyComponent from "./ModifyInsuranceCompany";

const EditInsuranceCompanyPage = () => {
  const title = "Edit Insurance Company";
  return (
    <CreateInsuranceCompanyComponent
      listOfAttributes={listOfAttributesInsuranceCompany}
      apiURL={InsuranceApiURL}
      title={title}
      pageUrL={InsuranceMainPageURL}
    />
  );
};
export default EditInsuranceCompanyPage;
