import SaveButton from "../SaveButton";
import { useFormValidation, ValidationSummary, FieldError, required, numberError } from "../FormValidation";
import React, { useEffect, useRef, useState } from "react";
import type { labPanelsWithIdsList, labTestCategoryParams } from "../types";
import {
  fetchAllLabTestTypeCategories,
  fetchLabPanelWithTests,
} from "../utils";
import {
  inputFormAttributeListItemInput,
  inputFormAttributeListItemLabel,
  inputFormTitle,
  stateStyle,
  tableDeleteButton,
  tableHandleButton,
  tableItem,
  tableItemPanel,
} from "../../style";
import { useNavigate, useParams } from "react-router-dom";
import api, { getApiErrorMessage } from "../../api";
import {
  labPanelApiURL,
  labPanelMainPageURL,
  labTestEditPageURL,
} from "../data";
import Pagination from "../Pagination";
import renderNormalValue from "../renderNormalValue";
import AddTestToPanelTable from "./AddTestToPanelTable";
import LoadingPage from "../LoadingPage/LoadingPage";

interface EditLabPanelProps {
  title: string;
}
const toTitleCase = (value: string) =>
  value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const EditLabPanel: React.FC<EditLabPanelProps> = ({ title }) => {
  const { lab_panel_id } = useParams();
  const [show, setShow] = useState<boolean>(false);
  const [addError, setAddError] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
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
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load lab panel")));
  }, [lab_panel_id]);

  useEffect(() => {
    setLoading(true);
    fetchAllLabTestTypeCategories()
      .then((categoryData) => {
        setLabTestCategories(categoryData);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Could not load data")))
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
  //     .catch((err) => setError(getApiErrorMessage(err, "Could not load data")))
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
        setState(getApiErrorMessage(err, "Could not remove this test from the panel"));
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

  const validation = useFormValidation([
    { name: "panel_name", label: "Lab panel name", error: required(data.lab_panel.panel_name, "Lab panel name") },
    { name: "lab_panel_price", label: "L", error: numberError(data.lab_panel.lab_panel_price, "L", true) },
    { name: "nssf_id", label: "NSSF ID", error: numberError(data.lab_panel.nssf_id, "NSSF ID", true, true) },
    { name: "lab_panel_category_id", label: "Category", error: required(data.lab_panel.lab_panel_category_id, "Category") },
    { name: "tests", label: "Lab tests", error: data.list_of_lab_test_ids.length ? null : "Add at least one lab test to this panel." },
  ]);
  const handleSave = async () => {
    if (savingRef.current) return;
    if (!validation.validate()) { setState(""); return; }
    setState("");
    savingRef.current = true;
    setSaving(true);
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
      navigate(labPanelMainPageURL, {
        state: { savedMessage: lab_panel_id ? "Lab panel changes saved" : "Lab panel created" },
      });
    } catch (err) {
      console.error(err);
      setState(getApiErrorMessage(err, "Could not save lab panel. Your edits are kept."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  if (loading) return <LoadingPage title="Loading lab categories ..." />;
  if (error) return <div role="alert" className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className={inputFormTitle}>{title}</h1>
      <ValidationSummary validation={validation} />
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor={validation.id("panel_name")} className={inputFormAttributeListItemLabel}>Lab Panel Name</label>
          <input {...validation.field("panel_name")} className={inputFormAttributeListItemInput + " w-full"} type="text"
            value={data.lab_panel.panel_name || ""} placeholder="Enter lab panel name"
            onChange={e => handlePanelNameChange(e.target.value)} onBlur={e => handlePanelNameChange(toTitleCase(e.target.value))} />
          <FieldError validation={validation} name="panel_name" />
        </div>
        <div>
          <label htmlFor={validation.id("lab_panel_price")} className={inputFormAttributeListItemLabel}>L</label>
          <input {...validation.field("lab_panel_price")} className={inputFormAttributeListItemInput + " w-full"} type="number" min="0" step="any"
            value={Number.isFinite(data.lab_panel.lab_panel_price) ? data.lab_panel.lab_panel_price : ""}
            onChange={e => handlePanelPriceChange(e.target.value === "" ? NaN : Number(e.target.value))} />
          <FieldError validation={validation} name="lab_panel_price" />
        </div>
        <div>
          <label htmlFor={validation.id("nssf_id")} className={inputFormAttributeListItemLabel}>NSSF ID</label>
          <input {...validation.field("nssf_id")} className={inputFormAttributeListItemInput + " w-full"} type="number" min="1" step="1"
            value={Number.isFinite(data.lab_panel.nssf_id) ? data.lab_panel.nssf_id : ""}
            onChange={e => handlePanelNssfIDChange(e.target.value === "" ? NaN : Number(e.target.value))} />
          <FieldError validation={validation} name="nssf_id" />
        </div>
        <div>
          <label htmlFor={validation.id("lab_panel_category_id")} className={inputFormAttributeListItemLabel}>Category</label>
          <select {...validation.field("lab_panel_category_id")} className={inputFormAttributeListItemInput + " w-full"}
            value={data.lab_panel.lab_panel_category_id || ""} onChange={e => handleCategoryChange(e.target.value)}>
            <option value="" disabled>— Select lab test category —</option>
            {labTestCategories.map(category => <option key={category.lab_test_category_id} value={category.lab_test_category_id}>{category.lab_test_category_name}</option>)}
          </select>
          <FieldError validation={validation} name="lab_panel_category_id" />
        </div>
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

        <button {...validation.field("tests")} className={tableHandleButton} onClick={handleAddButton}>
          Add Test
        </button>
      </div>

      <FieldError validation={validation} name="tests" />
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

      <div className="flex justify-end">
        <SaveButton saving={saving} className="mt-5" onClick={() => void handleSave()}>
          {lab_panel_id ? "Save changes" : "Create panel"}
        </SaveButton>
      </div>
      {state && <p role="alert" className={stateStyle}>{state}</p>}
      <span>
        {data.list_of_lab_test_ids.length === 0
          ? "No tests in this panel yet."
          : ""}
      </span>
    </div>
  );
};

export default EditLabPanel;
