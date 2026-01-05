import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import {
  type patientPanelResult,
  type patientTestResult,
  type updateInvoiceData,
} from "../types.js";
import api from "../../api.js";
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
    {}
  );
  const pendingResultsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    pendingResultsRef.current = pendingResults;
  }, [pendingResults]);
  const [existingLabTestTypeIds, setExistingLabTestTypeIds] = useState<
    Set<string>
  >(new Set());
  const [shouldRefreshFullList, setShouldRefreshFullList] =
    useState<boolean>(true);
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
          totalResults
        );
        if (existingLabTestIdsFetchId.current !== requestId) {
          return;
        }
        const ids = new Set<string>();
        res.list_of_standalone_test_results.forEach((test) =>
          ids.add(test.lab_test_type_id)
        );
        res.list_of_panel_results.forEach((panel) =>
          panel.list_of_test_results.forEach((test) =>
            ids.add(test.lab_test_type_id)
          )
        );
        setExistingLabTestTypeIds(ids);
      } catch (err) {
        console.error("Failed to refresh existing lab test ids:", err);
      }
    },
    []
  );

  const markExistingLabTestIdsDirty = useCallback(() => {
    setShouldRefreshFullList(true);
  }, []);

  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };
  const refreshResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!visit_id) return;

      const res = await fetchLabTestResultsAndPanelsPaginated(
        visit_id,
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      setStandAloneTestResults(
        applyPendingToTestResults(res.list_of_standalone_test_results)
      );
      setPanelResults(applyPendingToPanelResults(res.list_of_panel_results));
      setTotalPages(res.total_pages);
      setTotalNumberOfTests(res.TotalNumberOfLabTestResults);
      if (shouldRefreshFullList) {
        try {
          await loadAllExistingLabTestTypeIds(
            visit_id,
            res.TotalNumberOfLabTestResults
          );
        } finally {
          setShouldRefreshFullList(false);
        }
      }

      const res1 = await fetchVisit(visit_id);
      setVisitDate(res1.visit_date);
      setReportDate(res1.report_date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [
    visit_id,
    pagination.pageIndex,
    pagination.pageSize,
    shouldRefreshFullList,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit_id]);

  const handleSaveAll = async () => {
    if (!Object.keys(pendingResults).length) {
      return;
    }
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
      await Promise.all(
        Object.entries(pendingResults).map(([lab_test_result_id, result]) => {
          const url = `${labTestResultApiURL}/${lab_test_result_id}`;
          return api.put(url, null, { params: { result } });
        })
      );
      await Promise.all(
        Object.entries(pendingResults)
          .map(([lab_test_result_id, result]) => {
            const lab_test_type_id = resultToTestTypeId.get(lab_test_result_id);
            const trimmed = result.trim();
            if (!lab_test_type_id || !trimmed) return null;
            return trackResultSuggestionUse(lab_test_type_id, trimmed);
          })
          .filter((request) => request !== null)
      );
      setPendingResults({});
      alert("Saved successfully!");
      await refreshResults();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) return <LoadingPage title="Loading lab results ..." />;
  // if (loadingTests) return <div className="p-4">Loading lab tests</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!visit_id) {
    return <div className="p-4 text-red-600">Error: no visit selected.</div>;
  }
  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-semibold mb-6">Edit Visit</h1>
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
      <button
        className="mt-5 mr-3 p-2 h-10 max-w-fit rounded-sm border bg-blue-400 hover:bg-green-500 mt-2j"
        onClick={() => setShowTestsTable(true)}
      >
        Add test result
      </button>
      <button
        className="mt-5 mr-3 p-2 h-10 max-w-fit rounded-sm border bg-blue-400 hover:bg-green-500 mt-2j"
        onClick={() => setShowPanelsTable(true)}
      >
        Add lab panel
      </button>
      <button
        className="p-2 h-10 w-20 rounded-sm border bg-blue-400 hover:bg-green-500"
        onClick={() => handleSaveAll()}
      >
        Save
      </button>
      {panelResults.length === 0 && standAloneTestResults.length === 0 ? (
        <p> No lab results found for this visit {visit_id}.</p>
      ) : (
        <TestResultsList
          refreshResults={refreshResults}
          visit_id={visit_id}
          setError={setError}
          panelResults={panelResults}
          setPanelResults={setPanelResults}
          setStandAloneTestResults={setStandAloneTestResults}
          standAloneTestResults={standAloneTestResults}
          setPendingResults={setPendingResults}
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
