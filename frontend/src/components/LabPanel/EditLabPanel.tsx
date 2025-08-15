import React, { useEffect, useState } from "react";
import type { labPanelsWithIdsList, labTestCategoryParams } from "../types";
import {
  fetchAllLabTestTypeCategories,
  fetchLabPanelWithTests,
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
import renderNormalValue from "../renderNormalValue";
import AddTestToPanelTable from "./AddTestToPanelTable";

interface EditLabPanelProps {
  title: string;
}

const EditLabPanel: React.FC<EditLabPanelProps> = ({ title }) => {
  const { lab_panel_id } = useParams();
  const [show, setShow] = useState<boolean>(false);
  const [addError, setAddError] = useState<string>("");
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
  const [data, setData] = useState<labPanelsWithIdsList>({
    lab_panel: {
      lab_tests: [],
      nssf_id: 0,
      id: "",
      panel_name: "",
      lab_panel_price: 0,
      lab_panel_category_id: "",
    },
    list_of_lab_test_ids: [],
  });

  useEffect(() => {
    if (!lab_panel_id) return;
    fetchLabPanelWithTests(lab_panel_id)
      .then((currentPanelData) => {
        setData(currentPanelData);
      })
      .catch((err) => setError(err.message || "Failed to load lab panel"));
  }, [lab_panel_id]);

  useEffect(() => {
    setLoading(true);
    fetchAllLabTestTypeCategories()
      .then((categoryData) => {
        setLabTestCategories(categoryData);
      })
      .catch((err) => setError(err.message || err.toString()))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize]);

  // useEffect(() => {
  //   setLoading(true);
  //   Promise.all([
  //     fetchLabTestTypePaginated(currentPage, pageSize),
  //     fetchAllLabTestTypeCategories(),
  //   ])
  //     .then(([testData, categoryData]) => {
  //       setTotalPages(testData.total_pages);
  //       setTotalNumberOfTests(testData.TotalNumberOfTests);
  //       setLabTestCategories(categoryData);
  //     })
  //     .catch((err) => setError(err.message || err.toString()))
  //     .finally(() => setLoading(false));
  // }, [currentPage, pageSize]);

  const handleEditTest = (lab_test_id: string) => {
    navigate(`${labTestEditPageURL}${lab_test_id}`);
  };

  const handleRemoveLabTest = async (lab_test_id: string) => {
    const nextIds = data.list_of_lab_test_ids.filter(
      (id) => id !== lab_test_id
    );
    const prevData = data;
    setData((prev) => ({
      ...prev,
      list_of_lab_test_ids: nextIds,
      lab_panel: {
        ...prev.lab_panel,
        lab_tests: (prev.lab_panel.lab_tests ?? []).filter(
          (t) => t.lab_test_id !== lab_test_id
        ),
      },
    }));

    if (!lab_panel_id) return;

    try {
      await api.put(`${labPanelApiURL}/${lab_panel_id}`, {
        list_of_test_type_ids: nextIds,
      });
    } catch (err: unknown) {
      setData(prevData);
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  const handlePanelNameChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      lab_panel: { ...prev.lab_panel, panel_name: value },
    }));
  };
  const handlePanelPriceChange = (value: number) => {
    setData((prev) => ({
      ...prev,
      lab_panel: { ...prev.lab_panel, lab_panel_price: value },
    }));
  };
  const handlePanelNssfIDChange = (value: number) => {
    setData((prev) => ({
      ...prev,
      lab_panel: { ...prev.lab_panel, nssf_id: value },
    }));
  };

  const handleCategoryChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      lab_panel: { ...prev.lab_panel, lab_panel_category_id: value },
    }));
  };
  const handleAddButton = () => setShow(true);

  const handleSave = async () => {
    if (
      !data.lab_panel.panel_name ||
      data.list_of_lab_test_ids.length === 0 ||
      !data.lab_panel.lab_panel_price ||
      !data.lab_panel.lab_panel_category_id ||
      !data.lab_panel.nssf_id
    ) {
      setState("Please insert all the required fields!");
      return;
    }
    try {
      if (lab_panel_id) {
        await api.put(`${labPanelApiURL}/${lab_panel_id}`, {
          panel_name: data.lab_panel.panel_name,
          nssf_id: data.lab_panel.nssf_id,
          lab_panel_price: data.lab_panel.lab_panel_price,
          list_of_test_type_ids: data.list_of_lab_test_ids,
          lab_panel_category_id: data.lab_panel.lab_panel_category_id,
        });
      } else {
        await api.post(labPanelApiURL, {
          panel_name: data.lab_panel.panel_name,
          nssf_id: data.lab_panel.nssf_id,
          lab_panel_price: data.lab_panel.lab_panel_price,
          list_of_test_type_ids: data.list_of_lab_test_ids,
          lab_panel_category_id: data.lab_panel.lab_panel_category_id,
        });
      }
      navigate(labPanelMainPageURL);
    } catch (err) {
      console.error(err);
    }
  };
  if (loading) return <div className="p-4">Loading lab categories...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  console.log("Data: ", data);
  console.log("lab_panel_id: ", lab_panel_id);

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
          value={data.lab_panel.panel_name || ""}
          placeholder={"Enter Lab Panel Name"}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onChange={(e) => handlePanelNameChange(e.target.value)}
        />
        <label className={inputFormAttributeListItemLabel + " p-3"}>
          <span className="text-xl mr-5">L:</span>
        </label>
        <input
          className={inputFormAttributeListItemInput + " w-fit"}
          type={"number"}
          value={data.lab_panel.lab_panel_price || 0}
          placeholder={"Enter Lab Panel L"}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onChange={(e) => handlePanelPriceChange(Number(e.target.value))}
        />
        <label className={inputFormAttributeListItemLabel + " p-3"}>
          <span className="text-xl mr-5">Nssf ID:</span>
        </label>
        <input
          className={inputFormAttributeListItemInput + " w-fit"}
          type={"number"}
          value={data.lab_panel.nssf_id || 0}
          placeholder={"Enter Lab Panel nssf Id"}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onChange={(e) => handlePanelNssfIDChange(Number(e.target.value))}
        />
        <label className={inputFormAttributeListItemLabel + " p-3"}>
          <span className="text-xl mr-5">Category:</span>
        </label>
        <select
          className={inputFormAttributeListItemInput}
          value={data.lab_panel.lab_panel_category_id || ""}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="" disabled>
            — Select lab test category —
          </option>
          {labTestCategories.map((ltc) => (
            <option
              key={ltc.lab_test_category_id}
              value={ltc.lab_test_category_id}
            >
              {ltc.lab_test_category_name}
            </option>
          ))}
        </select>
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

        <button className={tableHandleButton} onClick={handleAddButton}>
          Add Test
        </button>
      </div>

      {data.lab_panel.lab_tests.length > 0 && (
        <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-5">
          <thead>
            <tr>
              <th className={tableItemPanel}>Nssf ID</th>
              <th className={tableItemPanel}>Lab Test</th>
              <th className={tableItemPanel}>Category</th>
              <th className={tableItemPanel}>Unit</th>
              <th className={tableItemPanel}>L</th>
              <th className={tableItemPanel}>Normal Value</th>
              <th className={tableItemPanel}>Edit</th>
              <th className={tableItemPanel}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {data.lab_panel.lab_tests.map((t) => {
              return (
                <tr key={t.lab_test_id}>
                  <td className={tableItem}>{t.nssf_id}</td>
                  <td className={tableItem}>{t.name}</td>
                  <td className={tableItem}>{t.lab_test_category_name}</td>
                  <td className={tableItem}>{t.unit}</td>
                  <td className={tableItem}>{t.price}</td>
                  <td className={tableItem}>
                    {t.normal_value_list?.length ? (
                      t.normal_value_list.map((nv, i) => (
                        <div key={i}>{renderNormalValue(nv)}</div>
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className={tableItem}>
                    <button
                      className={tableHandleButton}
                      onClick={() => handleEditTest(t.lab_test_id)}
                    >
                      Edit
                    </button>
                  </td>
                  <td className={tableItem}>
                    <button
                      className={tableDeleteButton}
                      onClick={() => handleRemoveLabTest(t.lab_test_id)}
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

      <AddTestToPanelTable
        addError={addError}
        setAddError={setAddError}
        showAddForLabPanels={show}
        setShowAddForLabPanels={setShow}
        data={data}
        setData={setData}
        error={error}
        setError={setError}
      />

      <button className={inputFormSave} onClick={handleSave}>
        Save
      </button>
      <h1 className={stateStyle}>{state}</h1>
      <span>
        {data.list_of_lab_test_ids.length === 0
          ? "No tests in this panel yet."
          : ""}
      </span>
    </div>
  );
};

export default EditLabPanel;
