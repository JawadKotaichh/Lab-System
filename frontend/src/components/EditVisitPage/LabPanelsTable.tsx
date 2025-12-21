import React, { useEffect, useState } from "react";
import type { labPanel, patientPanelResult, patientTestResult } from "../types";
import {
  fetchLabPanelsPaginated,
  fetchLabTestResultsAndPanelsPaginated,
  rebuildInvoice,
} from "../utils";
import {
  pageListTitle,
  tableDeleteButton,
  tableHandleButton,
  tableItem,
  tableItemPanel,
} from "../../style";
import axios from "axios";
import Pagination from "../Pagination";
import SearchLabPanel from "../LabPanel/SearchLabPanel";
import api from "../../api";
import { labTestResultApiURL } from "../data";
import type { PaginationState } from "@tanstack/react-table";
import renderNormalValue from "../renderNormalValue";

interface ErrorResponse {
  detail: string;
}
interface labPanelTableParams {
  pagination: PaginationState;
  visit_id: string;
  showPanelsTable: boolean;
  // updatedInvoiceData: updateInvoiceData;
  // setUpdatedInvoiceData: React.Dispatch<
  //   React.SetStateAction<updateInvoiceData>
  // >;
  setPanelResults: React.Dispatch<React.SetStateAction<patientPanelResult[]>>;
  setStandAloneTestResults: React.Dispatch<
    React.SetStateAction<patientTestResult[]>
  >;
  setShowPanelsTable: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalNumberOfTests: React.Dispatch<React.SetStateAction<number>>;
  refreshResults: () => Promise<void>;
  panelResults: patientPanelResult[];
  markExistingLabTestIdsDirty: () => void;
}

const LabPanelsTable: React.FC<labPanelTableParams> = ({
  visit_id,
  showPanelsTable,
  setShowPanelsTable,
  // updatedInvoiceData,
  // setUpdatedInvoiceData,
  pagination,
  setPanelResults,
  setStandAloneTestResults,
  setTotalNumberOfTests,
  refreshResults,
  panelResults,
  markExistingLabTestIdsDirty,
}: labPanelTableParams) => {
  const [availableLabPanels, setAvailableLabPanels] = useState<labPanel[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalNumberOfLabPanels, setTotalNumberOfLabPanels] =
    useState<number>(0);
  const [searchInput, setSearchInput] = useState<string>("");

  const handleAddLabPanel = async (visit_id: string, lab_panel_id: string) => {
    setLoading(true);
    setError("");
    if (panelResults.some((panel) => panel.lab_panel_id === lab_panel_id)) {
      alert("This lab panel already exists.");
      setLoading(false);
      return;
    }
    try {
      await api.post(`${labTestResultApiURL}/${visit_id}/${lab_panel_id}`);
      const res = await fetchLabTestResultsAndPanelsPaginated(
        visit_id,
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      setStandAloneTestResults(res.list_of_standalone_test_results);
      setPanelResults(res.list_of_panel_results);
      setTotalPages(res.total_pages);
      setTotalNumberOfTests(res.TotalNumberOfLabTestResults);
      rebuildInvoice(visit_id);
      setShowPanelsTable(false);
      markExistingLabTestIdsDirty();
      void refreshResults();
      // window.location.reload();
    } catch (err: unknown) {
      console.error("🛑 handleAddLabPanel error:", err);
      let message = "Failed to add lab panel";
      if (axios.isAxiosError(err)) {
        console.error("Response status:", err.response?.status);
        console.error("Response data:", err.response?.data);
        const data = err.response?.data as Partial<ErrorResponse> | undefined;
        message =
          data?.detail ||
          err.response?.statusText ||
          (err as Error).message ||
          message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      alert(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLabPanelsPaginated(currentPage, pageSize)
      .then((panelData) => {
        setAvailableLabPanels(panelData.lab_panels);
        setTotalPages(panelData.total_pages);
        setTotalNumberOfLabPanels(panelData.TotalNumberOfPanels);
      })
      .catch((err) => setError(err.message || err.toString()))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize]);

  if (loading) return <div className="p-4">Loading lab panels...</div>;
  return (
    <>
      {showPanelsTable && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-fit max-h-[80vh] overflow-y-auto">
            <h1 className={pageListTitle}>Lab Panels List</h1>
            <button
              className={tableDeleteButton + " mb-2"}
              onClick={() => setShowPanelsTable(false)}
            >
              Close
            </button>
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                Error adding panel: {error}
              </div>
            )}
            {totalNumberOfLabPanels === 0 ? (
              <p> No lab panels found!</p>
            ) : (
              <>
                {showPanelsTable && (
                  <>
                    <SearchLabPanel
                      searchInput={searchInput}
                      setSearchInput={setSearchInput}
                    />

                    <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-5">
                      <tbody>
                        {availableLabPanels.map((lp) => (
                          <React.Fragment key={lp.id}>
                            <tr className="border">
                              <td colSpan={1 + 8 * 6} className="px-4 py-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-xl text-left">
                                    {lp.panel_name}
                                  </span>
                                  <div className="flex space-x-2">
                                    <button
                                      className={tableHandleButton}
                                      onClick={() =>
                                        handleAddLabPanel(visit_id, lp.id)
                                      }
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <th className={tableItemPanel}>Nssf ID</th>
                              <th className={tableItemPanel}>Lab Test</th>
                              <th className={tableItemPanel}>Category</th>
                              <th className={tableItemPanel}>Unit</th>
                              <th className={tableItemPanel}>Price</th>
                              <th className={tableItemPanel}>Normal Value</th>
                            </tr>

                            {lp.lab_tests.map((test) => {
                              return (
                                <>
                                  <tr>
                                    <React.Fragment key={test.lab_test_id}>
                                      <td className={tableItem}>
                                        {test.nssf_id}
                                      </td>
                                      <td className={tableItem}>{test.name}</td>
                                      <td className={tableItem}>
                                        {test.lab_test_category_name}
                                      </td>
                                      <td className={tableItem}>{test.unit}</td>
                                      <td className={tableItem}>
                                        {test.price}
                                      </td>
                                      <td className={tableItem}>
                                        {test.normal_value_list?.length ? (
                                          test.normal_value_list.map(
                                            (nv, i) => (
                                              <div key={i}>
                                                {renderNormalValue(nv)}
                                              </div>
                                            )
                                          )
                                        ) : (
                                          <span className="text-gray-400">
                                            —
                                          </span>
                                        )}
                                      </td>
                                    </React.Fragment>
                                  </tr>
                                </>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    <Pagination
                      TotalNumberOfPaginatedItems={totalNumberOfLabPanels}
                      setPageSize={setPageSize}
                      pageSize={pageSize}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      setCurrentPage={setCurrentPage}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default LabPanelsTable;
