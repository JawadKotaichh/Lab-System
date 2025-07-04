import React, { useEffect, useMemo, useState } from "react";
import type {
  CreateLabPanelParams,
  labTest,
  labTestCategoryParams,
} from "../types";
import {
  fetchAllLabTestTypeCategories,
  fetchLabPanel,
  fetchLabTestTypePaginated,
} from "../utils";
import {
  inputFormSave,
  inputFormTitle,
  stateStyle,
  tableDeleteButton,
  tableHandleButton,
  tableItem,
  tableItemPanel,
} from "../../style";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import {
  labPanelApiURL,
  labPanelMainPageURL,
  labTestEditPageURL,
} from "../data";
import Pagination from "../Pagination";
import AddTestToPanel from "./AddTestToPanel";

interface EditLabPanelProps {
  title: string;
}

const EditLabPanel: React.FC<EditLabPanelProps> = ({
  title,
}: EditLabPanelProps) => {
  const { lab_panel_id } = useParams();
  const [show, setShow] = useState<boolean>(false);
  const [addError, setAddError] = useState<string>("");
  const [visibleTests, setVisibleTests] = useState<labTest[]>([]);
  const [state, setState] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalNumberOfTests, setTotalNumberOfTests] = useState<number>(0);

  const [labTestCategories, setLabTestCategories] = useState<
    labTestCategoryParams[]
  >([]);
  const navigate = useNavigate();
  const [labTests, setLabTests] = useState<Record<string, labTest>>({});
  const [data, setData] = useState<CreateLabPanelParams>({
    lab_panel_name: "",
    list_of_test_type_ids: [],
  });
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLabTestTypePaginated(1, 100),
      fetchAllLabTestTypeCategories(),
      fetchLabPanel(lab_panel_id!),
    ])
      .then(([testData, categoryData, currentPanelData]) => {
        setTotalPages(testData.total_pages);
        setTotalNumberOfTests(testData.TotalNumberOfTests);
        setData({
          list_of_test_type_ids: currentPanelData.list_of_test_type_ids,
          lab_panel_name: currentPanelData.lab_panel_name,
        });
        const map: Record<string, labTest> = {};
        testData.lab_tests.forEach((t) => (map[t.lab_test_id] = t));
        setLabTests(map);

        setLabTestCategories(categoryData);
      })
      .catch((err) => setError(err.message || err.toString()))
      .finally(() => setLoading(false));
  }, [currentPage, lab_panel_id, pageSize]);

  const labTestCategoryById = useMemo(() => {
    return labTestCategories.reduce<Record<string, string>>((map, c) => {
      map[c.lab_test_category_id] = c.lab_test_category_name;
      return map;
    }, {});
  }, [labTestCategories]);

  const handleEditTest = (lab_test_id: string) => {
    console.log("path: ", `${labTestEditPageURL}${lab_test_id}`);
    navigate(`${labTestEditPageURL}${lab_test_id}`);
  };

  const handleRemoveLabTest = (lab_test_id: string) => {
    setData((prev) => ({
      ...prev,
      list_of_test_type_ids: prev.list_of_test_type_ids.filter(
        (id) => id !== lab_test_id
      ),
    }));
  };
  const handleAddButton = () => {
    setShow(true);
  };
  const handleSave = async () => {
    if (data.list_of_test_type_ids.length == 0 || data.lab_panel_name == "") {
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      if (lab_panel_id) {
        api.put(labPanelApiURL + "/" + lab_panel_id, data);
      } else {
        api.post(labPanelApiURL, data);
      }
      navigate(labPanelMainPageURL);
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
  };

  if (loading) return <div className="p-4">Loading lab categories...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 bg-white">
      {data.list_of_test_type_ids.length === 0 ? (
        <p> No lab panels found!</p>
      ) : (
        <>
          <h1 className={inputFormTitle}>{title}</h1>
          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-5">
            <tbody>
              <React.Fragment key={lab_panel_id}>
                <tr className="border">
                  <td
                    colSpan={1 + data.list_of_test_type_ids.length * 8}
                    className="px-4 py-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xl text-left">
                        {data.lab_panel_name}
                      </span>
                      <button
                        className={tableHandleButton}
                        onClick={() => handleAddButton()}
                      >
                        Add Test
                      </button>
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
                  <th className={tableItemPanel}>Edit</th>
                  <th className={tableItemPanel}>Remove</th>
                </tr>

                {data.list_of_test_type_ids.map((id) => {
                  const t = labTests[id]!;
                  return (
                    <>
                      <tr>
                        <React.Fragment key={id}>
                          <td className={tableItem}>{t.nssf_id}</td>
                          <td className={tableItem}>{t.lab_test_name}</td>
                          <td className={tableItem}>
                            {labTestCategoryById[t.lab_test_category_id]}
                          </td>
                          <td className={tableItem}>{t.unit}</td>
                          <td className={tableItem}>{t.price}</td>
                          <td className={tableItem}>{t.lower_bound}</td>
                          <td className={tableItem}>{t.upper_bound}</td>
                          <td className={tableItem}>
                            <button
                              className={tableHandleButton}
                              onClick={() => handleEditTest(id)}
                            >
                              Edit
                            </button>
                          </td>
                          <td className={tableItem}>
                            <button
                              className={tableDeleteButton}
                              onClick={() => handleRemoveLabTest(id)}
                            >
                              Remove
                            </button>
                          </td>
                        </React.Fragment>
                      </tr>
                    </>
                  );
                })}
              </React.Fragment>
            </tbody>
          </table>
        </>
      )}
      <AddTestToPanel
        TotalNumberOfTests={totalNumberOfTests}
        addError={addError}
        setAddError={setAddError}
        show={show}
        visibleTests={visibleTests}
        setVisibleTests={setVisibleTests}
        setShow={setShow}
        // searchInput={searchInput}
        // setSearchInput={setSearchInput}
        data={data}
        setData={setData}
        error={error}
        setError={setError}
        labTestCategoryById={labTestCategoryById}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalPages={totalPages}
        setTotalPages={setTotalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setTotalNumberOfTests={setTotalNumberOfTests}
      />
      <button className={inputFormSave} onClick={() => handleSave()}>
        Save
      </button>
      <h1 className={stateStyle}>{state}</h1>
      <Pagination
        TotalNumberOfPaginatedItems={totalNumberOfTests}
        setPageSize={setPageSize}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};
export default EditLabPanel;
