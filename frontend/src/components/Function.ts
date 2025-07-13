import api from "../api";
import { InsuranceApiURL } from "./data";
import type { Dispatch, SetStateAction } from "react"

interface deleteInsuranceCompanyParams {
    insurance_company_id:string;
    setError:Dispatch<SetStateAction<string>>;
    
}
  const handleDeleteInsuranceCompany = ({insurance_company_id,setError}:deleteInsuranceCompanyParams) => {
    if (
      !window.confirm("Are you sure you want to delete this insurance company?")
    )
      return;
    api
      .delete(`${InsuranceApiURL}${insurance_company_id}`)
      .then(() => window.location.reload())
      .catch((err: Error) => setError(err.message));
  };
  export {handleDeleteInsuranceCompany};