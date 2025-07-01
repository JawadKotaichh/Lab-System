import {
  listOfAttributesPatient,
  PatientsApiURL,
  PatientsMainPageURL,
} from "../../data";
import ModifyPatient from "./ModifyPatient";

const EditPatientPage = () => {
  const title = "Edit Patient";
  return (
    <ModifyPatient
      listOfAttributes={listOfAttributesPatient}
      apiURL={PatientsApiURL}
      title={title}
      pageUrL={PatientsMainPageURL}
    />
  );
};
export default EditPatientPage;
