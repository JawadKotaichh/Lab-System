import type {insuranceCompanyParams, labTestClassParams, LabTestResult, patientInfo} from "./types.js";
import api from "../api.js";
import type { labTest } from "./types.js";


const fetchLabTestResults = async (patient_id:string,visit_id:string):
    Promise<LabTestResult[]> =>{
    const url = `/patients/${patient_id}/visits/${visit_id}/lab_tests_results/all`;
    const response = await api.get(url);
    return response.data;
};  

const fetchAllLabTest = async ():
    Promise<labTest[]> =>{
    const url = "/lab_test_type/all";
    const response = await api.get(url);
    return response.data;
};
const fetchAllPatients = async ():
    Promise<patientInfo[]> => {
        const url = "/patients/all";
        const response = await api.get(url);
        return response.data;
};
const fetchAllInsuranceCompanies = async ():
    Promise<insuranceCompanyParams[]> => {
        const url = "/insurance_company/all";
        const response = await api.get(url);
        return response.data;
};
const fetchPatient = async (patient_id:string):
    Promise<patientInfo> => {
        const response = await api.get(`/patients/${patient_id}`);
        return response.data;
    }

export const createVisit = (patientId: string) => {
  return api.post(
    `/patients/${patientId}/visits`,
    { patient_id:patientId,date: new Date().toISOString()}
  );
};

const fetchAllLabTestTypeClasses = async ():
    Promise<labTestClassParams[]> => {
        const url = "/lab_test_type_class/all";
        const response = await api.get(url);
        return response.data;
};
export {fetchLabTestResults};
export {fetchAllLabTest};
export {fetchAllPatients};
export {fetchPatient};
export {fetchAllInsuranceCompanies};
export {fetchAllLabTestTypeClasses};
