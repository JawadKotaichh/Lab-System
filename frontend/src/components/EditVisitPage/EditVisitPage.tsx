import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import type { visitResult } from "../types.js";
import api from "../../api.js";
import PatientInfo from "./PatientInfo.js";
import type { PaginationState } from "@tanstack/react-table";
import { labTestResultApiURL } from "../data.js";
import TestResultsList from "./TestResultsList.js";
import { fetchLabTestResultsPaginated } from "../utils.js";
import Pagination from "../Pagination.js";
import AddTestResultTable from "./AddTestResultTable.js";
import LabPanelsTable from "./LabPanelsTable.js";
// import LabPanelsTable from "./LabPanelsTable.js";

const EditVisitPage: React.FC = () => {
  const location = useLocation();
  const { patientData } = location.state || {};
  const { visit_id } = useParams<{ visit_id: string }>();
  const [results, setResults] = useState<visitResult[]>([]);
  const [loading, setLoading] = useState(true);
  // const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState<string>("");
  const [showPanelsTable, setShowPanelsTable] = useState<boolean>(false);
  const [showTestsTable, setShowTestsTable] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [addError, setAddError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalNumberOfTests, setTotalNumberOfTests] = useState<number>(0);
  const showAdd = true;
  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        // const filters = columnFilters.reduce<Record<string, string>>(
        //   (acc, f) => {
        //     acc[f.id] = String(f.value);
        //     return acc;
        //   },
        //   {}
        // );
        if (!visit_id) return;
        const res = await fetchLabTestResultsPaginated(
          visit_id,
          pagination.pageIndex + 1,
          pagination.pageSize
        );
        setResults(res.list_of_results);
        setTotalPages(res.total_pages);
        setTotalNumberOfTests(res.TotalNumberOfLabTestResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pagination.pageIndex, pagination.pageSize, visit_id]);

  const handleSaveAll = async () => {
    try {
      await Promise.all(
        results.map((item) => {
          const url = `${labTestResultApiURL}/${item.lab_test_result_id}`;
          api.put(url, null, { params: { result: item.result } });
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
      <PatientInfo patientData={patientData}></PatientInfo>
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
      {results.length === 0 ? (
        <p> No lab results found for this visit {visit_id}.</p>
      ) : (
        <TestResultsList
          visit_id={visit_id}
          setError={setError}
          results={results}
          setResults={setResults}
        />
      )}
      <AddTestResultTable
        showAdd={showAdd}
        addError={addError}
        visit_id={visit_id}
        showTestsTable={showTestsTable}
        results={results}
        setResults={setResults}
        setAddError={setAddError}
        setShowTestsTable={setShowTestsTable}
        error={error}
        setError={setError}
        //showTestsTable={showTestsTable}
        // setShowPanelsTable={setShowPanelsTable}
      />
      <LabPanelsTable
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
