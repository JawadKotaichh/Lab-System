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
  inputFormAttributeListItemInput,
  inputFormAttributeListItemLabel,
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

const EditLabPanel: React.FC<EditLabPanelProps> = ({ title }) => {
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
    panel_name: "",
    list_of_test_type_ids: [],
    lab_panel_price: 0,
  });

  useEffect(() => {
    if (!lab_panel_id) return;
    fetchLabPanel(lab_panel_id)
      .then((currentPanelData) => {
        setData({
          list_of_test_type_ids: currentPanelData.list_of_test_type_ids,
          panel_name: currentPanelData.panel_name,
          lab_panel_price: currentPanelData.lab_panel_price,
        });
      })
      .catch((err) => setError(err.message || "Failed to load lab panel"));
  }, [lab_panel_id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLabTestTypePaginated(currentPage, pageSize),
      fetchAllLabTestTypeCategories(),
    ])
      .then(([testData, categoryData]) => {
        setTotalPages(testData.total_pages);
        setTotalNumberOfTests(testData.TotalNumberOfTests);
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

  const handleEditTest = (lab_test_id: string) => {
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
  const handlePanelNameChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      panel_name: value,
    }));
  };
  const handlePanelPriceChange = (value: number) => {
    setData((prev) => ({
      ...prev,
      lab_panel_price: value,
    }));
  };
  const handleAddButton = () => setShow(true);

  const handleSave = async () => {
    if (!data.panel_name || data.list_of_test_type_ids.length === 0) {
      setState("Please insert all the required fields!");
      return;
    }
    try {
      if (lab_panel_id) {
        await api.put(`${labPanelApiURL}/${lab_panel_id}`, data);
      } else {
        await api.post(labPanelApiURL, data);
      }
      navigate(labPanelMainPageURL);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading lab categories...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  console.log("Data: ", data);
  return (
    <div className="p-8 bg-white">
      <h1 className={inputFormTitle}>{title}</h1>
      <div className="flex items-center mb-4">
        <label className={inputFormAttributeListItemLabel}>
          <span className="text-xl mr-5">Lab Panel Name:</span>
        </label>
        <input
          className={inputFormAttributeListItemInput + " w-fit"}
          type={"text"}
          value={data.panel_name || ""}
          placeholder={"Enter Lab Panel Name"}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onChange={(e) => handlePanelNameChange(e.target.value)}
        />
        <label className={inputFormAttributeListItemLabel + " p-3"}>
          <span className="text-xl mr-5">Price: $</span>
        </label>
        <input
          className={inputFormAttributeListItemInput + " w-fit"}
          type={"number"}
          value={data.lab_panel_price || 0}
          placeholder={"Enter Lab Panel price"}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onChange={(e) => handlePanelPriceChange(Number(e.target.value))}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <Pagination
          TotalNumberOfPaginatedItems={totalNumberOfTests}
          setPageSize={setPageSize}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
        <span>
          {data.list_of_test_type_ids.length === 0
            ? "No tests in this panel yet."
            : ""}
        </span>

        <button className={tableHandleButton} onClick={handleAddButton}>
          Add Test
        </button>
      </div>

      {data.list_of_test_type_ids.length > 0 && (
        <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-5">
          <thead>
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
          </thead>
          <tbody>
            {data.list_of_test_type_ids.map((id) => {
              const t = labTests[id]!;
              return (
                <tr key={id}>
                  <td className={tableItem}>{t.nssf_id}</td>
                  <td className={tableItem}>{t.name}</td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <AddTestToPanel
        TotalNumberOfTests={totalNumberOfTests}
        addError={addError}
        setAddError={setAddError}
        show={show}
        visibleTests={visibleTests}
        setVisibleTests={setVisibleTests}
        setShow={setShow}
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

      <button className={inputFormSave} onClick={handleSave}>
        Save
      </button>
      <h1 className={stateStyle}>{state}</h1>
    </div>
  );
};

export default EditLabPanel;
