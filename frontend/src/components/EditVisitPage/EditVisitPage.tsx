import React, { useCallback, useEffect, useState } from "react";
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
  fetchVisit,
} from "../utils.js";
import Pagination from "../Pagination.js";
import AddTestResultTable from "./AddTestResultTable.js";
import LabPanelsTable from "./LabPanelsTable.js";
import Prices from "./Prices.js";

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
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [updatedInvoiceData, setUpdatedInvoiceData] =
    useState<updateInvoiceData>({ discount_percentage: 0 });
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [addError, setAddError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalNumberOfTests, setTotalNumberOfTests] = useState<number>(0);
  const showAdd = true;
  useState<number>(0);

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
      setStandAloneTestResults(res.list_of_standalone_test_results);
      setPanelResults(res.list_of_panel_results);
      setTotalPages(res.total_pages);
      setTotalNumberOfTests(res.TotalNumberOfLabTestResults);

      const res1 = await fetchVisit(visit_id);
      setVisitDate(res1.visit_date);
      setReportDate(res1.report_date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [visit_id, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        if (!visit_id) return;
        const res = await fetchLabTestResultsAndPanelsPaginated(
          visit_id,
          pagination.pageIndex + 1,
          pagination.pageSize
        );
        setStandAloneTestResults(res.list_of_standalone_test_results);
        setPanelResults(res.list_of_panel_results);
        setTotalPages(res.total_pages);
        setTotalNumberOfTests(res.TotalNumberOfLabTestResults);
        const res1 = await fetchVisit(visit_id);
        setVisitDate(res1.visit_date);
        setReportDate(res1.report_date);
        const inv = await fetchInvoice(visit_id);
        if (inv) setUpdatedInvoiceData(inv.invoice_data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
    void refreshResults();
  }, [pagination.pageIndex, pagination.pageSize, refreshResults, visit_id]);

  const handleSaveAll = async () => {
    try {
      await Promise.all(
        standAloneTestResults.map((item) => {
          const url = `${labTestResultApiURL}/${item.lab_test_result_id}`;
          api.put(url, null, { params: { result: item.result } });
        })
      );
      await Promise.all(
        panelResults.map((panelResult) => {
          panelResult.list_of_test_results.map((item) => {
            const url = `${labTestResultApiURL}/${item.lab_test_result_id}`;
            api.put(url, null, { params: { result: item.result } });
          });
        })
      );
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="p-4">Loading lab results…</div>;
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
        patientData={patientData}
        standAloneTestResults={standAloneTestResults}
        panelResults={panelResults}
        visit_id={visit_id}
        setError={setError}
        setUpdatedInvoiceData={setUpdatedInvoiceData}
        updatedInvoiceData={updatedInvoiceData}
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
        />
      )}
      <AddTestResultTable
        refreshResults={refreshResults}
        updatedInvoiceData={updatedInvoiceData}
        setUpdatedInvoiceData={setUpdatedInvoiceData}
        showAdd={showAdd}
        addError={addError}
        visit_id={visit_id}
        showTestsTable={showTestsTable}
        panelResults={panelResults}
        setPanelResults={setPanelResults}
        setStandAloneTestResults={setStandAloneTestResults}
        standAloneTestResults={standAloneTestResults}
        setAddError={setAddError}
        setShowTestsTable={setShowTestsTable}
        error={error}
        setError={setError}

        //showTestsTable={showTestsTable}
        // setShowPanelsTable={setShowPanelsTable}
      />
      <LabPanelsTable
        refreshResults={refreshResults}
        setPanelResults={setPanelResults}
        pagination={pagination}
        setStandAloneTestResults={setStandAloneTestResults}
        setTotalNumberOfTests={setTotalNumberOfTests}
        setUpdatedInvoiceData={setUpdatedInvoiceData}
        updatedInvoiceData={updatedInvoiceData}
        showPanelsTable={showPanelsTable}
        setShowPanelsTable={setShowPanelsTable}
        visit_id={visit_id}
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
