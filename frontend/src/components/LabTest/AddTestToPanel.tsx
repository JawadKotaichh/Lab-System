// import SearchTest from "./SearchTest";
import type { CreateLabPanelParams, labTest } from "../types.js";
import { fetchLabTestTypePaginated } from "../utils.js";
import { useEffect } from "react";
import Pagination from "../Pagination.js";
import AddResultHead from "../EditVisitPage/AddResultHead.js";

interface TestsList {
  labTestCategoryById: Record<string, string>;
  addError: string;
  setAddError: React.Dispatch<React.SetStateAction<string>>;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  visibleTests: labTest[];
  setVisibleTests: React.Dispatch<React.SetStateAction<labTest[]>>;
  data: CreateLabPanelParams;
  setData: React.Dispatch<React.SetStateAction<CreateLabPanelParams>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  TotalNumberOfTests: number;
  setTotalNumberOfTests: React.Dispatch<React.SetStateAction<number>>;
}

const AddTestToPanel: React.FC<TestsList> = ({
  addError,
  setAddError,
  show,
  setShow,
  data,
  setData,
  labTestCategoryById,
  visibleTests,
  setVisibleTests,
  setError,
  currentPage,
  setCurrentPage,
  totalPages,
  setTotalPages,
  pageSize,
  setPageSize,
  TotalNumberOfTests,
  setTotalNumberOfTests,
}: TestsList) => {
  useEffect(() => {
    if (pageSize && currentPage) {
      fetchLabTestTypePaginated(currentPage, pageSize)
        .then((data) => {
          setVisibleTests(data.lab_tests);
          setTotalPages(data.total_pages);
          setTotalNumberOfTests(data.TotalNumberOfTests);
        })
        .catch((err) => setError(err.message || "Failed to load"));
    }
  }, [
    pageSize,
    totalPages,
    currentPage,
    setTotalNumberOfTests,
    setTotalPages,
    setError,
    setVisibleTests,
  ]);

  const handleAdd = async (lab_test_id: string) => {
    if (data.list_of_test_type_ids.some((r) => r === lab_test_id)) {
      setAddError("This test already exists.");
      alert("This test already exists.");
      setShow(false);
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
    setShow(false);
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white  p-6 rounded shadow-lg w-full max-w-5xl max-h-[80vh] flex-col">
            <h2 className="text-lg font-semibold mb-4">Add a new test</h2>
            {addError && (
              <p className="mb-2 text-sm text-red-600">{addError}</p>
            )}
            {/* <SearchTest
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                allTests={allTests}
                setVisibleTests={setVisibleTests}
                /> */}
            <div className="flex-1 overflow-y-auto mt-4 border border-black">
              <Pagination
                TotalNumberOfPaginatedItems={TotalNumberOfTests}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
              <table className="w-full border border-black border-collapse text-center">
                <AddResultHead />
                <tbody>
                  {visibleTests.map((test) => (
                    <tr key={test.lab_test_id}>
                      <td className="border rounded-b-sm px-4 py-2">
                        {labTestCategoryById[test.lab_test_category_id]}
                      </td>
                      <td className="border rounded-b-sm px-4 py-2">
                        {test.nssf_id}
                      </td>
                      <td className="border font-bold px-4 py-2">
                        {test.name}
                      </td>
                      <td className="border rounded-b-sm px-4 py-2">
                        {test.unit}
                      </td>
                      <td className="border rounded-b-sm  px-4 py-2">
                        ${test.price.toFixed(2)}
                      </td>
                      <td className="border rounded-b-sm  px-4 py-2">
                        {test.lower_bound}
                      </td>
                      <td className="border rounded-b-sm  px-4 py-2">
                        {test.upper_bound}
                      </td>
                      <td className="border rounded-b-sm  px-4 py-2">
                        <button
                          className="p-2 h-10 w-20 rounded-sm bg-blue-400 hover:bg-green-500"
                          onClick={() => handleAdd(test.lab_test_id)}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sticky bottom-0 bg-white border-t pt-4 flex">
                <button
                  onClick={() => setShow(false)}
                  className="px-4 py-2 bg-red-400 rounded hover:bg-red-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default AddTestToPanel;
