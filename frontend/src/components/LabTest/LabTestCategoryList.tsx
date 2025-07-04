import { useEffect, useState } from "react";
import type { labTestCategoryParams } from "../types";
import { fetchLabTestCategoryPaginated } from "../utils";
import {
  pageListTitle,
  tableCreateButton,
  tableDeleteButton,
  tableHandleButton,
  tableHead,
  tableHeadCols,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import {
  labTestCategoryApiURL,
  labTestCategoryCreatePageURL,
  labTestCategoryEditPageURL,
} from "../data";
import Pagination from "../Pagination";

const LabTestCategoryList = () => {
  const [availableLabTestCategory, setAvailableLabTestCategory] = useState<
    labTestCategoryParams[]
  >([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalNumberOfLabTestCategories, setTotalNumberOfLabTestCategories] =
    useState<number>(0);

  const handleCreateLabTestCategory = () => {
    navigate(labTestCategoryCreatePageURL);
  };
  const handleEditLabTestCategory = (lab_test_category_id: string) => {
    navigate(`${labTestCategoryEditPageURL}${lab_test_category_id}`);
  };
  const handleDeleteLabTestCategory = (lab_test_category_id: string) => {
    if (
      !window.confirm("Are you  you want to delete this lab test category?")
    ) {
      return;
    }
    try {
      api.delete(`${labTestCategoryApiURL}${lab_test_category_id}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    fetchLabTestCategoryPaginated(currentPage, pageSize)
      .then((data) => {
        setAvailableLabTestCategory(data.lab_test_categories);
        setTotalNumberOfLabTestCategories(data.TotalNumberOfLabTestCategories);
        setTotalPages(data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, [currentPage, pageSize]);

  if (loading) return <div className="p-4">Loading lab test categories…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Lab Test Category List</h1>
      {availableLabTestCategory.length === 0 ? (
        <p> No insurance companies found!</p>
      ) : (
        <>
          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
            <thead className={tableHead}>
              <tr>
                <th className={tableHeadCols}>Category Name</th>
                <th className={tableHeadCols}>Edit</th>
                <th className={tableHeadCols}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {availableLabTestCategory.map((ltc) => (
                <tr
                  key={ltc.lab_test_category_id}
                  className="border rounded-sm"
                >
                  <td className={tableItem}>{ltc.lab_test_category_name}</td>
                  <td className={tableItem}>
                    <button
                      className={tableHandleButton}
                      onClick={() =>
                        handleEditLabTestCategory(ltc.lab_test_category_id)
                      }
                    >
                      Edit
                    </button>
                  </td>
                  <td className={tableItem}>
                    <button
                      className={tableDeleteButton}
                      onClick={() =>
                        handleDeleteLabTestCategory(ltc.lab_test_category_id)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <Pagination
        TotalNumberOfPaginatedItems={totalNumberOfLabTestCategories}
        setPageSize={setPageSize}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
      <button
        className={tableCreateButton}
        onClick={() => handleCreateLabTestCategory()}
      >
        Create Lab Test Category
      </button>
    </div>
  );
};
export default LabTestCategoryList;
