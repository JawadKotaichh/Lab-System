import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import {
  type patientPanelResult,
  type patientTestResult,
  type updateInvoiceData,
} from "../types.js";
import api, { getApiErrorMessage } from "../../api.js";
import PatientInfo from "./PatientInfo.js";
import type { PaginationState } from "@tanstack/react-table";
import { labTestResultApiURL } from "../data.js";
import TestResultsList from "./TestResultsList.js";
import {
  fetchInvoice,
  fetchLabTestResultsAndPanelsPaginated,
  trackResultSuggestionUse,
  fetchVisit,
} from "../utils.js";
import Pagination from "../Pagination.js";
import AddTestResultTable from "./AddTestResultTable.js";
import LabPanelsTable from "./LabPanelsTable.js";
import Prices from "./Prices.js";
import LoadingPage from "../LoadingPage/LoadingPage.js";
import SaveFeedback, { type SaveState } from "./SaveFeedback.js";

const EditVisitPage: React.FC = () => {
  const location = useLocation();
  const { patientData } = location.state || {};
  const { visit_id } = useParams<{ visit_id: string }>();
  const [standAloneTestResults, setStandAloneTestResults] = useState<
    patientTestResult[]
  >([]);
  const [panelResults, setPanelResults] = useState<patientPanelResult[]>([]);
  const [loading, setLoading] = useState(true);
  // const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState<string>("");
  const [showPanelsTable, setShowPanelsTable] = useState<boolean>(false);
  const [showTestsTable, setShowTestsTable] = useState<boolean>(false);
  const [pendingResults, setPendingResults] = useState<Record<string, string>>(
    {},
  );
  const pendingResultsRef = useRef<Record<string, string>>({});
  const [resultSave, setResultSave] = useState<SaveState>({ status: "idle" });
  const savingResultsRef = useRef(false);
  const updatePendingResults = useCallback<React.Dispatch<React.SetStateAction<Record<string, string>>>>((update) => {
    const next = typeof update === "function" ? update(pendingResultsRef.current) : update;
    pendingResultsRef.current = next;
    setPendingResults(next);
    if (!savingResultsRef.current) {
      setResultSave({ status: "idle", message: "Unsaved result changes" });
    }
  }, []);
  const [existingLabTestTypeIds, setExistingLabTestTypeIds] = useState<
    Set<string>
  >(new Set());
  const shouldRefreshFullListRef = useRef(true);
  const existingLabTestIdsFetchId = useRef(0);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [updatedInvoiceData, setUpdatedInvoiceData] =
    useState<updateInvoiceData>({ adjustment_minor: 0 });
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [addError, setAddError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalNumberOfTests, setTotalNumberOfTests] = useState<number>(0);
  const showAdd = true;
  useState<number>(0);
  const [currency, setCurrency] = useState<string>("");
  const applyPendingToTestResults = (results: patientTestResult[]) =>
    results.map((test) => {
      const pending = pendingResultsRef.current[test.lab_test_result_id];
      return pending !== undefined ? { ...test, result: pending } : test;
    });

  const applyPendingToPanelResults = (panels: patientPanelResult[]) =>
    panels.map((panel) => ({
      ...panel,
      list_of_test_results: panel.list_of_test_results.map((test) => {
        const pending = pendingResultsRef.current[test.lab_test_result_id];
        return pending !== undefined ? { ...test, result: pending } : test;
      }),
    }));

  const loadAllExistingLabTestTypeIds = useCallback(
    async (visitId: string, totalResults: number) => {
      const requestId = ++existingLabTestIdsFetchId.current;
      if (!visitId) {
        setExistingLabTestTypeIds(new Set());
        return;
      }
      if (totalResults <= 0) {
        setExistingLabTestTypeIds(new Set());
        return;
      }
      try {
        const res = await fetchLabTestResultsAndPanelsPaginated(
          visitId,
          1,
          totalResults,
        );
        if (existingLabTestIdsFetchId.current !== requestId) {
          return;
        }
        const ids = new Set<string>();
        res.list_of_standalone_test_results.forEach((test) =>
          ids.add(test.lab_test_type_id),
        );
        res.list_of_panel_results.forEach((panel) =>
          panel.list_of_test_results.forEach((test) =>
            ids.add(test.lab_test_type_id),
          ),
        );
        setExistingLabTestTypeIds(ids);
      } catch (err) {
        console.error("Failed to refresh existing lab test ids:", err);
      }
    },
    [],
  );

  const markExistingLabTestIdsDirty = useCallback(() => {
    shouldRefreshFullListRef.current = true;
  }, []);

  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };
  const refreshResults = useCallback(async () => {
    setError("");
    try {
      if (!visit_id) return;

      const res = await fetchLabTestResultsAndPanelsPaginated(
        visit_id,
        pagination.pageIndex + 1,
        pagination.pageSize,
      );
      setStandAloneTestResults(
        applyPendingToTestResults(res.list_of_standalone_test_results),
      );
      setPanelResults(applyPendingToPanelResults(res.list_of_panel_results));
      setTotalPages(res.total_pages);
      setTotalNumberOfTests(res.TotalNumberOfLabTestResults);
      if (shouldRefreshFullListRef.current) {
        try {
          await loadAllExistingLabTestTypeIds(
            visit_id,
            res.TotalNumberOfLabTestResults,
          );
        } finally {
          shouldRefreshFullListRef.current = false;
        }
      }

      const res1 = await fetchVisit(visit_id);
      setVisitDate(res1.visit_date);
      setReportDate(res1.report_date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }, [
    visit_id,
    pagination.pageIndex,
    pagination.pageSize,
    loadAllExistingLabTestTypeIds,
  ]);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        if (!visit_id) return;
        await refreshResults();
        const fetched_invoice = await fetchInvoice(visit_id);
        setUpdatedInvoiceData(fetched_invoice.invoice_data);
        setCurrency(fetched_invoice.currency);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [refreshResults, visit_id]);

  const handleSaveAll = async () => {
    if (savingResultsRef.current) return;
    const changes = Object.entries(pendingResultsRef.current);
    if (!changes.length) {
      setResultSave({ status: "idle", message: "No result changes to save" });
      return;
    }
    savingResultsRef.current = true;
    setResultSave({ status: "saving", message: "Saving results…" });
    const resultToTestTypeId = new Map<string, string>();
    standAloneTestResults.forEach((test) => {
      resultToTestTypeId.set(test.lab_test_result_id, test.lab_test_type_id);
    });
    panelResults.forEach((panel) => {
      panel.list_of_test_results.forEach((test) => {
        resultToTestTypeId.set(test.lab_test_result_id, test.lab_test_type_id);
      });
    });
    try {
      const outcomes = await Promise.allSettled(
        changes.map(([lab_test_result_id, result]) => {
          const url = `${labTestResultApiURL}/${lab_test_result_id}`;
          return api.put(url, null, { params: { result } });
        }),
      );
      const saved = changes.filter((_, index) => outcomes[index].status === "fulfilled");
      const remaining = { ...pendingResultsRef.current };
      saved.forEach(([id, value]) => {
        if (remaining[id] === value) delete remaining[id];
      });
      pendingResultsRef.current = remaining;
      setPendingResults(remaining);
      // Suggestion tracking must not turn a successful result save into a failure.
      await Promise.allSettled(
        saved
          .map(([lab_test_result_id, result]) => {
            const lab_test_type_id = resultToTestTypeId.get(lab_test_result_id);
            const trimmed = result.trim();
            if (!lab_test_type_id || !trimmed) return null;
            return trackResultSuggestionUse(lab_test_type_id, trimmed);
          })
          .filter((request) => request !== null),
      );
      await refreshResults();
      const failed = outcomes.filter((outcome) => outcome.status === "rejected");
      if (failed.length) {
        setResultSave({ status: "error", message: `${failed.length} result(s) could not be saved. Your unsaved edits are kept; please retry.` });
      } else {
        setResultSave({ status: "saved", message: Object.keys(pendingResultsRef.current).length
          ? "Results saved. New edits still need saving."
          : "Results saved successfully" });
      }
    } catch (err: unknown) {
      console.error(err);
      setResultSave({ status: "error", message: getApiErrorMessage(err, "Could not save results. Your unsaved edits are kept.") });
    } finally {
      savingResultsRef.current = false;
    }
  };

  if (loading) return <LoadingPage title="Loading lab results ..." />;
  // if (loadingTests) return <div className="p-4">Loading lab tests</div>;
  if (!visit_id) {
    return <div className="p-4 text-red-600">Error: no visit selected.</div>;
  }
  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-semibold mb-6">Edit Visit</h1>
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      <PatientInfo
        report_date={reportDate}
        setReportDate={setReportDate}
        setVisitDate={setVisitDate}
        visitDate={visitDate}
        patientData={patientData}
        visit_id={visit_id}
      />
      <Prices
        setUpdatedInvoiceData={setUpdatedInvoiceData}
        patientData={patientData}
        visit_id={visit_id}
        setError={setError}
        updatedInvoiceData={updatedInvoiceData}
        currency={currency}
      />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="p-2 h-10 rounded-sm border bg-blue-400 hover:bg-green-500 cursor-pointer"
            onClick={() => setShowTestsTable(true)}
          >
            Add test result
          </button>
          <button
            type="button"
            className="p-2 h-10 rounded-sm border bg-blue-400 hover:bg-green-500 cursor-pointer"
            onClick={() => setShowPanelsTable(true)}
          >
            Add lab panel
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <div className="text-right">
            <SaveFeedback state={resultSave} onRetry={() => void handleSaveAll()} />
            {Object.keys(pendingResults).length > 0 && resultSave.status === "idle" && (
              <span className="ml-2 text-sm text-gray-500">({Object.keys(pendingResults).length} pending)</span>
            )}
          </div>
          <button
            type="button"
            disabled={resultSave.status === "saving"}
            aria-busy={resultSave.status === "saving"}
            className="shrink-0 p-2 h-10 rounded-sm border bg-blue-400 hover:bg-green-500 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            onClick={() => handleSaveAll()}
          >
            {resultSave.status === "saving" ? "Saving…" : "Save results"}
          </button>
        </div>
      </div>
      {panelResults.length === 0 && standAloneTestResults.length === 0 ? (
        <p> No lab results found for this visit {visit_id}.</p>
      ) : (
        <TestResultsList
          updatedInvoiceData={updatedInvoiceData}
          refreshResults={refreshResults}
          visit_id={visit_id}
          setError={setError}
          panelResults={panelResults}
          setPanelResults={setPanelResults}
          setStandAloneTestResults={setStandAloneTestResults}
          standAloneTestResults={standAloneTestResults}
          setPendingResults={updatePendingResults}
          markExistingLabTestIdsDirty={markExistingLabTestIdsDirty}
        />
      )}
      <AddTestResultTable
        refreshResults={refreshResults}
        showAdd={showAdd}
        addError={addError}
        visit_id={visit_id}
        showTestsTable={showTestsTable}
        panelResults={panelResults}
        setPanelResults={setPanelResults}
        setStandAloneTestResults={setStandAloneTestResults}
        standAloneTestResults={standAloneTestResults}
        existingLabTestTypeIds={existingLabTestTypeIds}
        setAddError={setAddError}
        setShowTestsTable={setShowTestsTable}
        error={error}
        setError={setError}
        markExistingLabTestIdsDirty={markExistingLabTestIdsDirty}
        setUpdatedInvoiceData={setUpdatedInvoiceData}
        setCurrency={setCurrency}
      />

      {showPanelsTable && (
        <LabPanelsTable
          refreshResults={refreshResults}
          setPanelResults={setPanelResults}
          pagination={pagination}
          setStandAloneTestResults={setStandAloneTestResults}
          setTotalNumberOfTests={setTotalNumberOfTests}
          panelResults={panelResults}
          setUpdatedInvoiceData={setUpdatedInvoiceData}
          setCurrency={setCurrency}
          showPanelsTable={showPanelsTable}
          setShowPanelsTable={setShowPanelsTable}
          visit_id={visit_id}
          markExistingLabTestIdsDirty={markExistingLabTestIdsDirty}
        />
      )}

      <Pagination
        TotalNumberOfPaginatedItems={totalNumberOfTests}
        currentPage={pagination.pageIndex + 1}
        totalPages={totalPages}
        setCurrentPage={handleSetPage}
        pageSize={pagination.pageSize}
        setPageSize={handleSetPageSize}
      />
    </div>
  );
};
export default EditVisitPage;
