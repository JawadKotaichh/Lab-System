import React, { useEffect, useState } from "react";
import api from "../../../api.js";
import { useParams } from "react-router-dom";
import ShowTestsList from "./ShowTestsList.js";
import { fetchLabTestResults } from "../../utils.js";
import { fetchAllLabTest } from "../../utils.js";
import type { labTest } from "../../types.js";
import type { LabTestResult } from "../../types.js";
import type { Params } from "../../types.js";
import ShowResultsList from "./ShowResultsList.js";

const EditVisitPage: React.FC = () => {
  const { visit_id } = useParams<Params>();
  const [results, setResults] = useState<LabTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState<string>("");
  const [show, setShow] = useState<boolean>(false);
  const [allTests, setAllTests] = useState<labTest[]>([]);
  const [addError, setAddError] = useState<string>("");
  // const [searchInput,setSearchInput] = useState<string>("");
  const [visibleTests, setVisibleTests] = useState<labTest[]>(allTests);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalNumberOfTests, setTotalNumberOfTests] = useState<number>(0);

  const handleSaveAll = async () => {
    try {
      await Promise.all(
        results.map((item) => {
          const url = `/visits/${visit_id}/lab_tests_results/${item.lab_test_result_id}`;
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

  useEffect(() => {
    if (!visit_id) return;

    setLoading(true);
    fetchLabTestResults(visit_id)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, [visit_id]);

  useEffect(() => {
    setLoadingTests(true);
    fetchAllLabTest()
      .then((data) => {
        setAllTests(data);
        setLoadingTests(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoadingTests(false);
      });
  }, []);
  useEffect(() => {
    setVisibleTests(allTests);
  }, [allTests]);

  if (loading) return <div className="p-4">Loading lab results…</div>;
  if (loadingTests) return <div className="p-4">Loading lab tests</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-semibold mb-6">Edit Visit</h1>
      {results.length === 0 ? (
        <p> No lab results found for this visit {visit_id}.</p>
      ) : (
        <ShowResultsList
          setError={setError}
          results={results}
          setResults={setResults}
          visit_id={visit_id!}
        />
      )}
      <button
        className="p-2 h-10 max-w-fit rounded-sm border bg-blue-400 hover:bg-green-500"
        onClick={() => setShow(true)}
      >
        Add result
      </button>

      <button
        className="p-2 h-10 w-20 rounded-sm border bg-blue-400 hover:bg-green-500"
        onClick={() => handleSaveAll()}
      >
        Save
      </button>

      <ShowTestsList
        TotalNumberOfTests={totalNumberOfTests}
        addError={addError}
        setAddError={setAddError}
        show={show}
        setShow={setShow}
        // searchInput={searchInput}
        // setSearchInput={setSearchInput}
        allTests={allTests}
        visibleTests={visibleTests}
        setVisibleTests={setVisibleTests}
        results={results}
        setResults={setResults}
        visit_id={visit_id!}
        error={error}
        setError={setError}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalPages={totalPages}
        setTotalPages={setTotalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setTotalNumberOfTests={setTotalNumberOfTests}
      />
    </div>
  );
};

export default EditVisitPage;
