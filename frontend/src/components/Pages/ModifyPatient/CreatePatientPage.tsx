import {
  listOfAttributesPatient,
  PatientsApiURL,
  PatientsMainPageURL,
} from "../../data";
import CreateInsuranceCompanyComponent from "./ModifyPatient";

const CreatePatientPage = () => {
  const title = "Create Patient";
  return (
    <div>
      <CreateInsuranceCompanyComponent
        title={title}
        pageUrL={PatientsMainPageURL}
        listOfAttributes={listOfAttributesPatient}
        apiURL={PatientsApiURL}
      />
    </div>
  );
};
export default CreatePatientPage;
