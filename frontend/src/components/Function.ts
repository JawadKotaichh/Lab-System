import { type NavigateFunction } from "react-router-dom";
import api from "../api";
import { InsuranceApiURL, labTestApiURL, labTestCategoryApiURL, labTestCategoryCreatePageURL, labTestCreatePageURL, PatientsApiURL, visitsApiURL } from "./data";
import type { Dispatch, SetStateAction } from "react"
import { createVisit, fetchLabTestResultsAndPanelsPaginated, updateInvoice } from "./utils";
import type { CreateLabPanelParams, patientInfo, patientPanelResult, patientTestResult, updateInvoiceData } from "./types";
import type { PaginationState } from "@tanstack/react-table";

interface deleteElement {
    elementID:string;
    setError:Dispatch<SetStateAction<string>>;
    
}
  const handleDeleteInsuranceCompany = ({elementID,setError}:deleteElement) => {
    if (
      !window.confirm("Are you sure you want to delete this insurance company?")
    )
      return;
    api
      .delete(`${InsuranceApiURL}${elementID}`)
      .then(() => window.location.reload())
      .catch((err: Error) => setError(err.message));
  };

  const handleDeletePatient = ({elementID,setError}:deleteElement) => {
    if (
      !window.confirm("Are you sure you want to delete this patient?")
    )
      return;
    api
      .delete(`${PatientsApiURL}${elementID}`)
      .then(() => window.location.reload())
      .catch((err: Error) => setError(err.message));
  };

const handleDeleteLabTest = ({elementID,setError}:deleteElement) => {
    if (!window.confirm("Are you sure you want to delete this lab test?")) {
      return;
    }
    try {
      api.delete(`${labTestApiURL}/${elementID}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  const handleDeleteVisit = ({elementID,setError}:deleteElement) => {
    if (!window.confirm("Are you sure you want to delete this visit?")) {
      return;
    }
    try {
      api.delete(`${visitsApiURL}${elementID}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
const handleCreateLabTest = (navigate: NavigateFunction) => {
    navigate(labTestCreatePageURL);
  };
const handleDeleteLabTestCategory = ({elementID,setError}:deleteElement) => {
    if (
      !window.confirm("Are you sure you want to delete this lab test category?")
    ) {
      return;
    }
    try {
      api.delete(`${labTestCategoryApiURL}${elementID}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  const handleCreateLabTestCategory = (navigate: NavigateFunction) => {
    navigate(labTestCategoryCreatePageURL);
  };

const handleNewVisit = async (insurance_company_name:string,patient: patientInfo,navigate: NavigateFunction,setError:Dispatch<SetStateAction<string>>) => {
    try {
      const resp = await createVisit(patient.patient_id);
      const newVisit = resp.data;
      navigate(`/visits/${newVisit._id}`, {
        state: {
          patientData: {
            ...patient,
            insurance_company_name: insurance_company_name,
          },
        },
      });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  interface addLabTestParams {
    
    pagination: PaginationState;
    setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
    visit_id: string;
    lab_test_id:string;
    panelResults: patientPanelResult[];
    setPanelResults: React.Dispatch<React.SetStateAction<patientPanelResult[]>>;
    standAloneTestResults: patientTestResult[];
    setStandAloneTestResults: React.Dispatch<
      React.SetStateAction<patientTestResult[]>
    >;
    setAddError: React.Dispatch<React.SetStateAction<string>>;
    showTestsTable: boolean;
    setShowTestsTable: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
    setTotalPages: React.Dispatch<React.SetStateAction<number>>;
    setTotalNumberOfTests: React.Dispatch<React.SetStateAction<number>>;
    updatedInvoiceData?: updateInvoiceData,
      setUpdatedInvoiceData?: React.Dispatch<
        React.SetStateAction<updateInvoiceData>
      >,
  }
  export const handleAddLabTest = async ({updatedInvoiceData,setUpdatedInvoiceData,setTotalNumberOfTests,setTotalPages,pagination,setError,lab_test_id,panelResults,setPanelResults,setStandAloneTestResults,standAloneTestResults,setAddError,setShowTestsTable,visit_id,
  }:addLabTestParams) => {
    if (standAloneTestResults.some((r) => r.lab_test_type_id === lab_test_id)) {
      setAddError("This test already exists.");
      alert("This test already exists.");
      setShowTestsTable(false);
      setAddError("");
      return;
    }
    const alreadyExists = panelResults.some(panel =>
    panel.list_of_test_results.some(r =>
      r.lab_test_type_id === lab_test_id
    )
  );

    if (alreadyExists) {
      setAddError("This test already exists.");
      alert("This test already exists.");
      setShowTestsTable(false);
      setAddError("");
      return;
}
    
    setAddError("");
    const url = `/lab_tests_results/${visit_id}`;
    try {
      await api.post(url, {
        lab_test_type_id: lab_test_id,
        visit_id,
        result: "",
      });
      const updated = await fetchLabTestResultsAndPanelsPaginated(
        visit_id,
        pagination.pageIndex + 1,        
        pagination.pageSize
      );
      setStandAloneTestResults(updated.list_of_standalone_test_results);
      setPanelResults(updated.list_of_panel_results);
      setShowTestsTable(false);
      setTotalPages(updated.total_pages);
      setTotalNumberOfTests(updated.TotalNumberOfLabTestResults);
      const fetchedTestTypes = updated.list_of_standalone_test_results.map(
        (test) => test.lab_test_type
      );
       
        if (setUpdatedInvoiceData){
          const newInvoiceData: updateInvoiceData = {
              ...updatedInvoiceData,
              list_of_tests: fetchedTestTypes,
            };
          setUpdatedInvoiceData(newInvoiceData);
          await updateInvoice(visit_id!, newInvoiceData);
        }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  interface addLabTestToPanelParams {
    lab_test_id:string;
    data:CreateLabPanelParams;
    setData: React.Dispatch<React.SetStateAction<CreateLabPanelParams>>;
    setAddError: React.Dispatch<React.SetStateAction<string>>;
    setShowAddForLabPanels: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
  }

export const handleAdd = async ({lab_test_id,data,setAddError,setShowAddForLabPanels,setData}: addLabTestToPanelParams) => {
    if (data.list_of_test_type_ids.some((r) => r === lab_test_id)) {
      setAddError("This test already exists.");
      alert("This test already exists.");
      setShowAddForLabPanels(false);
      setAddError("");
      // setSearchInput("");
      // setVisibleTests(allTests);
      return;
    }
    setAddError("");
    setData((prev) => ({
      ...prev,
      list_of_test_type_ids: [...prev.list_of_test_type_ids, lab_test_id],
    }));
    setShowAddForLabPanels(false);
  };
export{handleNewVisit};
export{handleDeleteLabTest};
export{handleCreateLabTest};
export {handleDeleteInsuranceCompany};  
export {handleDeletePatient};
export{handleDeleteLabTestCategory};
export{handleDeleteVisit};
export{handleCreateLabTestCategory};
