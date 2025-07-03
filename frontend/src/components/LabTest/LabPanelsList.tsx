import React, { useEffect, useMemo, useState } from "react";
import type { labPanel, labTest, labTestCategoryParams } from "../types";
import {
  fetchAllLabTestTypeCategories,
  fetchLabPanelsPaginated,
  fetchLabTestTypePaginated,
} from "../utils";
import {
  pageListTitle,
  tableCreateButton,
  tableDeleteButton,
  tableHandleButton,
  tableHeadCols,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import {
  labPanelCreatePageURL,
  labPanelApiURL,
  labTestMainPageURL,
  labPanelEditPageURL,
} from "../data";
import Pagination from "../Pagination";

const LabPanelsList = () => {
  const [availableLabPanels, setAvailableLabPanels] = useState<labPanel[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalNumberOfLabPanels, setTotalNumberOfLabPanels] =
    useState<number>(0);

  const [labTestCategories, setLabTestCategories] = useState<
    labTestCategoryParams[]
  >([]);
  const navigate = useNavigate();
  const [labTests, setLabTests] = useState<Record<string, labTest>>({});

  const handleCreateLabPanel = () => {
    navigate(labPanelCreatePageURL);
  };
  const handleGoBackToLabTests = () => {
    navigate(labTestMainPageURL);
  };
  const handleEditLabPanel = (lab_panel_id: string) => {
    navigate(`${labPanelEditPageURL}${lab_panel_id}`);
  };
  const handleDeleteLabPanel = (lab_panel_id: string) => {
    if (!window.confirm("Are you sure you want to delete this lab panel?")) {
      return;
    }
    try {
      api.delete(`${labPanelApiURL}/${lab_panel_id}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    if (pageSize && currentPage) {
      fetchLabPanelsPaginated(currentPage, pageSize)
        .then((data) => {
          setAvailableLabPanels(data.lab_panels);
          setTotalPages(data.total_pages);
          setTotalNumberOfLabPanels(data.TotalNumberOfPanels);
        })
        .catch((err) => setError(err.message || "Failed to load"));
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchLabTestTypePaginated(1, 100)
      .then((data) => {
        const labTestMap = data.lab_tests.reduce((acc, test) => {
          acc[test.lab_test_id] = test;
          return acc;
        }, {} as Record<string, labTest>);
        setLabTests(labTestMap);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    fetchAllLabTestTypeCategories()
      .then((data) => {
        setLabTestCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, []);

  const labTestCategoryById = useMemo(() => {
    return labTestCategories.reduce<Record<string, string>>((map, c) => {
      map[c.lab_test_category_id] = c.lab_test_category_name;
      return map;
    }, {});
  }, [labTestCategories]);

  if (loading) return <div className="p-4">Loading lab tests...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Lab Panels List</h1>
      <button
        className={tableCreateButton}
        onClick={() => handleGoBackToLabTests()}
      >
        Go Back To Lab Test List
      </button>
      {totalNumberOfLabPanels === 0 ? (
        <p> No lab tests found!</p>
      ) : (
        <>
          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-5">
            <tbody>
              {availableLabPanels.map((lp) => (
                <>
                  <tr>
                    <th className={tableHeadCols}>Panel Name</th>
                  </tr>
                  <tr key={lp.lab_panel_id} className="border rounded-sm">
                    <td className={tableItem}>{lp.lab_panel_name}</td>
                    <td className={tableItem}>
                      <button
                        className={tableHandleButton}
                        onClick={() => handleEditLabPanel(lp.lab_panel_id)}
                      >
                        Edit
                      </button>
                    </td>
                    <td className={tableItem}>
                      <button
                        className={tableDeleteButton}
                        onClick={() => handleDeleteLabPanel(lp.lab_panel_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  <tr>
                    {lp.list_of_test_type_ids.map((lab_test_id) => {
                      const lab_test = labTests[lab_test_id];
                      if (!lab_test) {
                        console.warn(
                          `Lab test with ID ${lab_test_id} not found.`
                        );
                        return null;
                      }

                      return (
                        <React.Fragment key={lab_test_id}>
                          <td className={tableItem}>
                            {lab_test.lab_test_name}
                          </td>
                          <td className={tableItem}>
                            {labTestCategoryById[lab_test.lab_test_category_id]}
                          </td>
                          <td className={tableItem}>{lab_test.unit}</td>
                          <td className={tableItem}>{lab_test.price}</td>
                          <td className={tableItem}>{lab_test.upper_bound}</td>
                          <td className={tableItem}>{lab_test.lower_bound}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </>
      )}
      <Pagination
        TotalNumberOfPaginatedItems={totalNumberOfLabPanels}
        setPageSize={setPageSize}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
      <button
        className={tableCreateButton}
        onClick={() => handleCreateLabPanel()}
      >
        Create Lab Panel
      </button>
    </div>
  );
};
export default LabPanelsList;
