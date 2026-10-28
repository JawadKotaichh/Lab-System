import ActionButton from "../ActionButton";
import { Plus as AddActionIcon } from "lucide-react";
import CloseButton from "../CloseButton";
import React, { useEffect, useState } from "react";
import type {
  labPanel,
  labPanelFilter,
  patientPanelResult,
  patientTestResult,
  updateInvoiceData,
} from "../types";
import {
  fetchLabPanelsPaginated,
  fetchLabPanelWithTests,
  // fetchLabTestResultsAndPanelsPaginated,
  rebuildInvoice,
} from "../utils";
import {
  tableHandleButton,
  tableItem,
  tableItemPanel,
} from "../../style";
import Pagination from "../Pagination";
import SearchLabPanel from "../LabPanel/SearchLabPanel";
import api, { getApiErrorMessage } from "../../api";
import { labTestResultApiURL } from "../data";
import type { PaginationState } from "@tanstack/react-table";
import renderNormalValue from "../renderNormalValue";
import { LoaderCircle } from "lucide-react";

function useDebounced<T>(value: T, delay = 500) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

interface labPanelTableParams {
  onSelectPanel?: (panel: labPanel) => void;
  pagination: PaginationState;
  visit_id: string;
  showPanelsTable: boolean;
  setUpdatedInvoiceData: React.Dispatch<
    React.SetStateAction<updateInvoiceData>
  >;
  setCurrency: React.Dispatch<React.SetStateAction<string>>;
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
  onSelectPanel,
  visit_id,
  showPanelsTable,
  setShowPanelsTable,
  setUpdatedInvoiceData,
  setCurrency,
  // pagination,
  // setPanelResults,
  // setStandAloneTestResults,
  // setTotalNumberOfTests,
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
  const debouncedSearch = useDebounced(searchInput, 500);
  const handleAddLabPanel = async (visit_id: string, lab_panel_id: string) => {
    if (onSelectPanel) {
      const panel = availableLabPanels.find(p => p.id === lab_panel_id);
      if (!panel) return;
      setError("");
      try {
        // Older backend list responses omit test IDs; the detail endpoint has them.
        if (panel.lab_tests.some(test => !test.lab_test_id)) {
          setLoading(true);
          const detail = await fetchLabPanelWithTests(lab_panel_id);
          onSelectPanel(detail.lab_panel);
        } else onSelectPanel(panel);
      } catch (error) {
        setError(getApiErrorMessage(error, "Could not load this lab panel"));
      } finally { setLoading(false); }
      return;
    }
    setLoading(true);
    setError("");

    if (panelResults.some((panel) => panel.lab_panel_id === lab_panel_id)) {
      setError("This lab panel is already included in the visit.");
      setLoading(false);
      return;
    }

    try {
      await api.post(`${labTestResultApiURL}/${visit_id}/${lab_panel_id}`);
      markExistingLabTestIdsDirty();
      const invoiceData = await rebuildInvoice(visit_id);
      setUpdatedInvoiceData(invoiceData.invoice_data);
      setCurrency(invoiceData.currency);
      setShowPanelsTable(false);
      await refreshResults();
    } catch (err: unknown) {
      console.error("handleAddLabPanel error:", err);
      const message = getApiErrorMessage(err, "Could not add lab panel");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let canceled = false;

    const loadPanels = async () => {
      try {
        setLoading(true);
        let filters: labPanelFilter | undefined = undefined;
        const trimmedSearch = debouncedSearch.trim();
        if (trimmedSearch) {
          filters = { panel_name: trimmedSearch };
        }

        const panelData = await fetchLabPanelsPaginated(
          currentPage,
          pageSize,
          filters
        );

        if (canceled) return;

        setAvailableLabPanels(panelData.lab_panels);
        setTotalPages(panelData.total_pages);
        setTotalNumberOfLabPanels(panelData.TotalNumberOfLabPanels);
      } catch (err) {
        if (!canceled) {
          setError(getApiErrorMessage(err, "Could not load lab panels"));
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    loadPanels();

    return () => {
      canceled = true;
    };
  }, [currentPage, pageSize, debouncedSearch]);

  return (
    <>
      {showPanelsTable && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-lab-panel-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-[96vw] max-w-[96rem] max-h-[80vh] overflow-y-auto">
            <header className="mb-5 flex items-start justify-between gap-4">
              <h1 id="add-lab-panel-title" className="text-2xl font-semibold">Lab Panels</h1>
              <CloseButton label="Close add lab panel dialog" onClick={() => setShowPanelsTable(false)} />
            </header>
            <div aria-busy={loading}>
              {loading ? (
                <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-gray-600">
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Loading lab panels…
                </div>
              ) : <>
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
                                      <ActionButton onClick={() =>
                                          handleAddLabPanel(visit_id, lp.id)
                                        } variant="secondary" icon={AddActionIcon}>
                                        Add
                                      </ActionButton>
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
              </>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default LabPanelsTable;
