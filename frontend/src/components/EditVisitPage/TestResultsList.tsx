import type {
  patientPanelResult,
  patientTestResult,
  result_suggestions,
} from "../types.js";
import api from "../../api.js";
import { labTestResultApiURL } from "../data.js";
import React, { useRef, useState } from "react";
import renderNormalValue from "../renderNormalValue.js";
import { fetchResultSuggestions, rebuildInvoice } from "../utils.js";

interface ShowResultsListParams {
  panelResults: patientPanelResult[];
  setPanelResults: React.Dispatch<React.SetStateAction<patientPanelResult[]>>;
  standAloneTestResults: patientTestResult[];
  setStandAloneTestResults: React.Dispatch<
    React.SetStateAction<patientTestResult[]>
  >;
  visit_id: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  refreshResults: () => Promise<void>;
  setPendingResults: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  markExistingLabTestIdsDirty: () => void;
}

const TestResultsList: React.FC<ShowResultsListParams> = ({
  panelResults,
  setPanelResults,
  standAloneTestResults,
  setStandAloneTestResults,
  setError,
  visit_id,
  refreshResults,
  setPendingResults,
  markExistingLabTestIdsDirty,
}: ShowResultsListParams) => {
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<result_suggestions[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [sugError, setSugError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const closeDropdown = () => {
    setActiveInputId(null);
    setSuggestions([]);
    setSugError(null);
    setLoadingSug(false);
  };
  const requestSuggestions = (
    lab_test_type_id: string,
    prefix: string,
    inputId: string
  ) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      const trimmed = prefix.trim();
      if (!trimmed) {
        setSuggestions([]);
        setSugError(null);
        return;
      }
      try {
        setLoadingSug(true);
        setSugError(null);

        const data = await fetchResultSuggestions(lab_test_type_id, trimmed);
        if (activeInputId !== inputId) return;
        setSuggestions(data);
      } catch (e) {
        if (activeInputId !== inputId) return;
        setSuggestions([]);
        setSugError(`Failed to load suggestions: ${e}`);
      } finally {
        if (activeInputId === inputId) setLoadingSug(false);
      }
    }, 200);
  };
  const onPickSuggestion = (lab_test_result_id: string, value: string) => {
    void handleChange(lab_test_result_id, value);
    closeDropdown();
  };

  const handleChange = async (
    lab_test_result_id: string,
    newResult: string
  ) => {
    setStandAloneTestResults((prev) =>
      prev.map((item) =>
        item.lab_test_result_id == lab_test_result_id
          ? { ...item, result: newResult }
          : item
      )
    );
    setPanelResults((prevPanels) =>
      prevPanels.map((panel) => ({
        ...panel,
        list_of_test_results: panel.list_of_test_results.map((res) =>
          res.lab_test_result_id === lab_test_result_id
            ? { ...res, result: newResult }
            : res
        ),
      }))
    );
    setPendingResults((prev: Record<string, string>) => ({
      ...prev,
      [lab_test_result_id]: newResult,
    }));
  };

  const handleDeleteLabResult = async (lab_test_result_id: string) => {
    const url = `${labTestResultApiURL}/${lab_test_result_id}`;
    try {
      await api.delete(url);
      markExistingLabTestIdsDirty();
      void refreshResults();
      rebuildInvoice(visit_id);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  const handleDeletePanel = async (lab_panel_id: string, visit_id: string) => {
    const url = `${labTestResultApiURL}/delete_panels/${visit_id}/${lab_panel_id}`;
    try {
      await api.delete(url);
      markExistingLabTestIdsDirty();
      rebuildInvoice(visit_id);
      void refreshResults();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
  return (
    <table className="border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-10">
      <thead className="bg-gray-300 border-b border-black top-0 z-10">
        <tr>
          <th className="h-8 px-0 py-2">Category</th>
          <th className="h-8 px-0 py-2">Test</th>
          <th className="h-8 px-0 py-2">Result</th>
          <th className="h-8 px-0 py-2">Unit</th>
          <th className="h-8 px-0 py-2">L</th>
          <th className="h-8 px-0 py-2">Normal Value</th>
          <th className="h-8 px-0 py-2">Remove</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={7}>
            <h1 className="font-bold rounded-b-sm px-4 py-2">Tests</h1>
          </td>
        </tr>
        {standAloneTestResults.map((r) => (
          <React.Fragment key={r.lab_test_result_id}>
            <tr key={r.lab_test_result_id} className="border rounded-sm">
              <td className="border rounded-b-sm px-4 py-2">
                {r.lab_test_type.lab_test_category_name}
              </td>
              <td className="border rounded-b-sm px-4 py-2">
                {r.lab_test_type.name}
              </td>
              <td className="border rounded-b-sm px-4 py-2">
                <div className="relative">
                  <input
                    className="h-8 text-center w-full"
                    placeholder="Enter result"
                    value={r.result}
                    onFocus={() => {
                      setActiveInputId(r.lab_test_result_id);
                      requestSuggestions(
                        r.lab_test_type.lab_test_id,
                        r.result ?? "",
                        r.lab_test_result_id
                      );
                    }}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleChange(r.lab_test_result_id, v);
                      setActiveInputId(r.lab_test_result_id);
                      requestSuggestions(
                        r.lab_test_type.lab_test_id,
                        v,
                        r.lab_test_result_id
                      );
                    }}
                    onBlur={() => {
                      setTimeout(() => closeDropdown(), 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") closeDropdown();
                    }}
                  />
                  {activeInputId === r.lab_test_result_id &&
                    (loadingSug || sugError || suggestions.length > 0) && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow z-50 max-h-44 overflow-auto text-left">
                        {loadingSug && (
                          <div className="px-3 py-2 text-gray-500">
                            Loading…
                          </div>
                        )}
                        {sugError && (
                          <div className="px-3 py-2 text-red-600">
                            {sugError}
                          </div>
                        )}
                        {!loadingSug &&
                          !sugError &&
                          suggestions.length === 0 && (
                            <div className="px-3 py-2 text-gray-500">
                              No suggestions
                            </div>
                          )}

                        {!loadingSug &&
                          !sugError &&
                          suggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() =>
                                onPickSuggestion(r.lab_test_result_id, s.value)
                              }
                            >
                              {s.value}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
              </td>
              <td className="border rounded-b-sm px-4 py-2">
                {r.lab_test_type.unit}
              </td>
              <td className="border rounded-b-sm  px-4 py-2">
                {r.lab_test_type.price}
              </td>
              <td className="border rounded-b-sm  px-4 py-2">
                {r.lab_test_type.normal_value_list?.length ? (
                  r.lab_test_type.normal_value_list.map((nv, i) => (
                    <div key={i}>{renderNormalValue(nv)}</div>
                  ))
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="border rounded-b-sm  px-4 py-2">
                <button
                  className="p-2 h-10 w-20 rounded-sm bg-blue-400 hover:bg-red-600"
                  onClick={() => handleDeleteLabResult(r.lab_test_result_id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          </React.Fragment>
        ))}
        {panelResults.map((panel) => (
          <>
            <tr>
              <td className="border rounded-b-sm px-4 py-2" colSpan={4}>
                {panel.lab_panel_name}
              </td>
              <td className="border rounded-b-sm px-4 py-2">
                {panel.lab_panel_price}
              </td>
              <td></td>
              <td className="border rounded-b-sm  px-4 py-2">
                <button
                  className="p-2 h-10 w-20 rounded-sm bg-blue-400 hover:bg-red-600"
                  onClick={() =>
                    handleDeletePanel(panel.lab_panel_id, visit_id)
                  }
                >
                  Remove
                </button>
              </td>
            </tr>
            {panel.list_of_test_results.map((r) => (
              <tr key={r.lab_test_result_id} className="border rounded-sm">
                <td className="border rounded-b-sm px-4 py-2">
                  {r.lab_test_type.lab_test_category_name}
                </td>
                <td className="border rounded-b-sm px-4 py-2">
                  {r.lab_test_type.name}
                </td>
                <td className="border rounded-b-sm  px-4 py-2">
                  <div className="relative">
                    <input
                      className="h-8 text-center w-full"
                      placeholder="Enter result"
                      value={r.result}
                      onFocus={() => {
                        setActiveInputId(r.lab_test_result_id);
                        requestSuggestions(
                          r.lab_test_type.lab_test_id,
                          r.result ?? "",
                          r.lab_test_result_id
                        );
                      }}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleChange(r.lab_test_result_id, v);
                        setActiveInputId(r.lab_test_result_id);
                        requestSuggestions(
                          r.lab_test_type.lab_test_id,
                          v,
                          r.lab_test_result_id
                        );
                      }}
                      onBlur={() => {
                        setTimeout(() => closeDropdown(), 150);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") closeDropdown();
                      }}
                    />

                    {activeInputId === r.lab_test_result_id &&
                      (loadingSug || sugError || suggestions.length > 0) && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow z-50 max-h-44 overflow-auto text-left">
                          {loadingSug && (
                            <div className="px-3 py-2 text-gray-500">
                              Loading…
                            </div>
                          )}
                          {sugError && (
                            <div className="px-3 py-2 text-red-600">
                              {sugError}
                            </div>
                          )}

                          {!loadingSug &&
                            !sugError &&
                            suggestions.length === 0 && (
                              <div className="px-3 py-2 text-gray-500">
                                No suggestions
                              </div>
                            )}

                          {!loadingSug &&
                            !sugError &&
                            suggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  onPickSuggestion(
                                    r.lab_test_result_id,
                                    s.value
                                  )
                                }
                              >
                                {s.value}
                              </button>
                            ))}
                        </div>
                      )}
                  </div>
                </td>
                <td className="border rounded-b-sm px-4 py-2">
                  {r.lab_test_type.unit}
                </td>
                <td></td>
                <td className="border rounded-b-sm  px-4 py-2">
                  {r.lab_test_type.normal_value_list?.length ? (
                    r.lab_test_type.normal_value_list.map((nv, i) => (
                      <div key={i}>{renderNormalValue(nv)}</div>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  );
};

export default TestResultsList;
