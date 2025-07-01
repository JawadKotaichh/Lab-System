import {
  InsuranceApiURL,
  InsuranceMainPageURL,
  listOfAttributesInsuranceCompany,
} from "../../data";
import CreateInsuranceCompanyComponent from "./ModifyInsuranceCompany";

const CreateInsuranceCompanyPage = () => {
  const title = "Create Insurance Comopany";
  return (
    <div>
      <CreateInsuranceCompanyComponent
        title={title}
        pageUrL={InsuranceMainPageURL}
        listOfAttributes={listOfAttributesInsuranceCompany}
        apiURL={InsuranceApiURL}
      />
    </div>
  );
};
export default CreateInsuranceCompanyPage;
