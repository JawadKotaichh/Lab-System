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
  tableItem,
  tableItemPanel,
} from "../../style";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import {
  labPanelCreatePageURL,
  labPanelApiURL,
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
    setLoading(true);
    Promise.all([
      fetchLabPanelsPaginated(currentPage, pageSize),
      fetchLabTestTypePaginated(1, 100),
      fetchAllLabTestTypeCategories(),
    ])
      .then(([panelData, testData, categoryData]) => {
        setAvailableLabPanels(panelData.lab_panels);
        setTotalPages(panelData.total_pages);
        setTotalNumberOfLabPanels(panelData.TotalNumberOfPanels);

        const map: Record<string, labTest> = {};
        testData.lab_tests.forEach((t) => (map[t.lab_test_id] = t));
        setLabTests(map);

        setLabTestCategories(categoryData);
      })
      .catch((err) => setError(err.message || err.toString()))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize]);

  const labTestCategoryById = useMemo(() => {
    return labTestCategories.reduce<Record<string, string>>((map, c) => {
      map[c.lab_test_category_id] = c.lab_test_category_name;
      return map;
    }, {});
  }, [labTestCategories]);

  if (loading) return <div className="p-4">Loading lab panels...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Lab Panels List</h1>

      {totalNumberOfLabPanels === 0 ? (
        <p> No lab panels found!</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <Pagination
              TotalNumberOfPaginatedItems={totalNumberOfLabPanels}
              setPageSize={setPageSize}
              pageSize={pageSize}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
            <button
              className={tableCreateButton + " float-left"}
              onClick={handleCreateLabPanel}
            >
              Create Lab Panel
            </button>
          </div>

          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-5">
            <tbody>
              {availableLabPanels.map((lp) => (
                <React.Fragment key={lp.lab_panel_id}>
                  <tr className="border">
                    <td
                      colSpan={1 + lp.list_of_test_type_ids.length * 6}
                      className="px-4 py-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl text-left">
                          {lp.panel_name}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            className={tableHandleButton}
                            onClick={() => handleEditLabPanel(lp.lab_panel_id)}
                          >
                            Edit
                          </button>
                          <button
                            className={tableDeleteButton}
                            onClick={() =>
                              handleDeleteLabPanel(lp.lab_panel_id)
                            }
                          >
                            Delete
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
                    <th className={tableItemPanel}>Lower Bound</th>
                    <th className={tableItemPanel}>Upper Bound</th>
                  </tr>

                  {lp.list_of_test_type_ids.map((id) => {
                    const t = labTests[id]!;
                    return (
                      <>
                        <tr>
                          <React.Fragment key={id}>
                            <td className={tableItem}>{t.nssf_id}</td>
                            <td className={tableItem}>{t.name}</td>
                            <td className={tableItem}>
                              {labTestCategoryById[t.lab_test_category_id]}
                            </td>
                            <td className={tableItem}>{t.unit}</td>
                            <td className={tableItem}>{t.price}</td>
                            <td className={tableItem}>{t.lower_bound}</td>
                            <td className={tableItem}>{t.upper_bound}</td>
                          </React.Fragment>
                        </tr>
                      </>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
export default LabPanelsList;
