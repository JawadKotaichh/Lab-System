import { type NavigateFunction } from "react-router-dom";
import api from "../api";
import { InsuranceApiURL, labTestApiURL, labTestCategoryApiURL, labTestCategoryCreatePageURL, labTestCreatePageURL, PatientsApiURL, visitsApiURL } from "./data";
import type { Dispatch, SetStateAction } from "react"
import { create_invoice, createVisit, fetchLabTestResultsAndPanelsPaginated, rebuildInvoice } from "./utils";
import type {  labPanelsWithIdsList, labTest, patientInfo, patientPanelResult, patientTestResult } from "./types";
import type { PaginationState } from "@tanstack/react-table";

interface deleteElement {
    elementID:string;
    setError:Dispatch<SetStateAction<string>>;
    
}
  const handleDeleteInsuranceCompany = async({elementID,setError}:deleteElement) => {
    if (
      !window.confirm("Are you sure you want to delete this insurance company?")
    )
      return;
    await api
      .delete(`${InsuranceApiURL}${elementID}`)
      .then(() => window.location.reload())
      .catch((err: Error) => setError(err.message));
  };

  const handleDeletePatient = async({elementID,setError}:deleteElement) => {
    if (
      !window.confirm("Are you sure you want to delete this patient?")
    )
      return;
     await api
      .delete(`${PatientsApiURL}${elementID}`)
      .then(() => window.location.reload())
      .catch((err: Error) => setError(err.message));
  };

const handleDeleteLabTest = async ({elementID,setError}:deleteElement) => {
    if (!window.confirm("Are you sure you want to delete this lab test?")) {
      return;
    }
    try {
      await api.delete(`${labTestApiURL}${elementID}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  const handleDeleteVisit = async ({elementID,setError}:deleteElement) => {
    if (!window.confirm("Are you sure you want to delete this visit?")) {
      return;
    }
    try {
      await api.delete(`${visitsApiURL}${elementID}`);
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
const handleDeleteLabTestCategory = async({elementID,setError}:deleteElement) => {
    if (
      !window.confirm("Are you sure you want to delete this lab test category?")
    ) {
      return;
    }
    try {
      await api.delete(`${labTestCategoryApiURL}${elementID}`);
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
      await create_invoice(newVisit._id,patient);
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
    refreshResults?: () => Promise<void>;
   
  }
  export const handleAddLabTest = async ({pagination,setError,refreshResults,lab_test_id,panelResults,setPanelResults,setStandAloneTestResults,standAloneTestResults,setAddError,setShowTestsTable,visit_id,
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
      if (refreshResults) await refreshResults(); 
      rebuildInvoice(visit_id);
      setShowTestsTable(false);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  interface addLabTestToPanelParams {
    lab_test_id:string;
    lab_test:labTest;
    data:labPanelsWithIdsList;
    setData: React.Dispatch<React.SetStateAction<labPanelsWithIdsList>>;
    setAddError: React.Dispatch<React.SetStateAction<string>>;
    setShowAddForLabPanels: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
  }

export const handleAdd = async ({lab_test_id,lab_test,data,setAddError,setShowAddForLabPanels,setData}: addLabTestToPanelParams) => {
  console.log("hi");

  try {
    if (data.list_of_lab_test_ids.some((id) => id === lab_test_id)) {
      setAddError("This test already exists.");
      alert("This test already exists.");
      setShowAddForLabPanels(false);
      setAddError("");
      return;
    }

    setAddError("");

    const nextIds = [...data.list_of_lab_test_ids, lab_test_id];

    // also update the rendered list so the table shows it right away
    const nextTests = lab_test
      ? [...(data.lab_panel.lab_tests ?? []), lab_test]
      : data.lab_panel.lab_tests;

    setData((prev) => ({
      ...prev,
      list_of_lab_test_ids: nextIds,
      lab_panel: {
        ...prev.lab_panel,
        lab_tests: nextTests ?? [],
      },
    }));

  } catch (err) {
    console.error(err);
    setAddError(err instanceof Error ? err.message : "Failed to add lab test");
  } finally {
    setShowAddForLabPanels(false);
  }
};

//   //   //  try {
//   //   // if (data.list_of_lab_test_ids.some((id) => id === lab_test_id)) {
//   //   //   setAddError("This test already exists.");
//   //   //   alert("This test already exists.");
//   //   //   setShowAddForLabPanels(false);
//   //   //   setAddError("");
//   //   //   return;
//   //   // }

//   //   // setAddError("");
//   //   // const nextIds = [...data.list_of_lab_test_ids, lab_test_id];
//   //   // setData((prev) => ({
//   //   //   ...prev,
//   //   //   list_of_lab_test_ids: nextIds, 
//   //   // }));
//   //   // console.log("nextIds: ",nextIds)
    
//   //   // if (data.lab_panel.id) {
//   //   //     await api.put(`${labPanelApiURL}/${data.lab_panel.id}`, {
//   //   //       panel_name: data.lab_panel.panel_name,
//   //   //       nssf_id: data.lab_panel.nssf_id,
//   //   //       lab_panel_price: data.lab_panel.lab_panel_price,
//   //   //       list_of_test_type_ids: nextIds,
//   //   //       lab_panel_category_id: data.lab_panel.lab_panel_category_id,
//   //   //     });
//   //   //   } else {
//   //   //     await api.post(labPanelApiURL, {
//   //   //       panel_name: data.lab_panel.panel_name,
//   //   //       nssf_id: data.lab_panel.nssf_id,
//   //   //       lab_panel_price: data.lab_panel.lab_panel_price,
//   //   //       list_of_test_type_ids: nextIds,
//   //   //       lab_panel_category_id: data.lab_panel.lab_panel_category_id,
//   //   //     });
//   //   //   }
//   // } catch (err) {
//   //   console.error(err);
//   //   setAddError(err instanceof Error ? err.message : "Failed to add lab test");
//   // } finally {
//   //   setShowAddForLabPanels(false);
//   // }
// };
export{handleNewVisit};
export{handleDeleteLabTest};
export{handleCreateLabTest};
export {handleDeleteInsuranceCompany};  
export {handleDeletePatient};
export{handleDeleteLabTestCategory};
export{handleDeleteVisit};
export{handleCreateLabTestCategory};
