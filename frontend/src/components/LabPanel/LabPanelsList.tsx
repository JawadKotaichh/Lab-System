import React, { useEffect, useState } from "react";
import type { labPanel } from "../types";
import { fetchLabPanelsPaginated } from "../utils";
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
import SearchLabPanel from "./SearchLabPanel";
import renderNormalValue from "../renderNormalValue";

const LabPanelsList = () => {
  const [availableLabPanels, setAvailableLabPanels] = useState<labPanel[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalNumberOfLabPanels, setTotalNumberOfLabPanels] =
    useState<number>(0);
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState<string>("");

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
    fetchLabPanelsPaginated(currentPage, pageSize)
      .then((panelData) => {
        setAvailableLabPanels(panelData.lab_panels);
        setTotalPages(panelData.total_pages);
        setTotalNumberOfLabPanels(panelData.TotalNumberOfPanels);
      })
      .catch((err) => setError(err.message || err.toString()))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize]);

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
            <button
              className={`${tableCreateButton} ml-auto text-xl`}
              onClick={handleCreateLabPanel}
            >
              Create Lab Panel
            </button>
          </div>
          <SearchLabPanel
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            pageSize={pageSize}
            setAvailableLabPanels={setAvailableLabPanels}
            setError={setError}
            currentPage={currentPage}
            setTotalPages={setTotalPages}
            setTotalNumberOfLabPanels={setTotalNumberOfLabPanels}
            setLoading={setLoading}
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
                        <span className="font-bold text-xl text-left">
                          Price: {lp.lab_panel_price} $
                        </span>
                        <span className="font-bold text-xl text-left">
                          Nssf Id: {lp.nssf_id}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            className={tableHandleButton}
                            onClick={() => handleEditLabPanel(lp.id)}
                          >
                            Edit
                          </button>
                          <button
                            className={tableDeleteButton}
                            onClick={() => handleDeleteLabPanel(lp.id)}
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
                    <th className={tableItemPanel}>Normal Value</th>
                  </tr>

                  {lp.lab_tests.map((test) => {
                    return (
                      <>
                        <tr>
                          <React.Fragment key={test.lab_test_id}>
                            <td className={tableItem}>{test.nssf_id}</td>
                            <td className={tableItem}>{test.name}</td>
                            <td className={tableItem}>
                              {test.lab_test_category_name}
                            </td>
                            <td className={tableItem}>{test.unit}</td>
                            <td className={tableItem}>{test.price}</td>
                            <td className={tableItem}>
                              {test.normal_value_list?.length ? (
                                test.normal_value_list.map((nv, i) => (
                                  <div key={i}>{renderNormalValue(nv)}</div>
                                ))
                              ) : (
                                <span className="text-gray-400">—</span>
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
    </div>
  );
};
export default LabPanelsList;
