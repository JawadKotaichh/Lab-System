import { FieldError, type FormValidation } from "../FormValidation";
import type {
  patientPanelResult,
  patientTestResult,
  result_suggestions,
  updateInvoiceData,
} from "../types.js";
import React, { useEffect, useRef, useState } from "react";
import renderNormalValue from "../renderNormalValue.js";
import {
  fetchResultSuggestions,
} from "../utils.js";

export type ResultTarget = { testId: string; panelId: string | null };
const rowKey = (target: ResultTarget) => JSON.stringify([target.panelId, target.testId]);

interface ShowResultsListParams {
  validation: FormValidation;
  panelResults: patientPanelResult[];
  standAloneTestResults: patientTestResult[];
  onResultChange: (target: ResultTarget, value: string) => void;
  onRemoveTest: (id: string) => void;
  onRemovePanel: (id: string) => void;
  onPriceChange: (id: string, value: string) => void;
  priceDrafts: Record<string, string>;
  updatedInvoiceData: updateInvoiceData;
}

const isNumericLike = (s: string) => /^[+-]?\d+(?:[.,]\d+)?$/.test(s.trim());

const toTitleCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");

const normalizeResult = (value: string) => {
  const v = value.trim();
  if (!v) return value;
  if (isNumericLike(v)) return v;
  return toTitleCase(v);
};
const TestResultsList: React.FC<ShowResultsListParams> = ({
  validation,
  panelResults,
  standAloneTestResults,
  onResultChange,
  onRemoveTest,
  onRemovePanel,
  onPriceChange,
  priceDrafts,
  updatedInvoiceData,
}: ShowResultsListParams) => {
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<result_suggestions[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [sugError, setSugError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const activeInputRef = useRef<string | null>(null);
  const suggestionRequest = useRef(0);
  useEffect(() => () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    activeInputRef.current = null;
    suggestionRequest.current += 1;
  }, []);
  const closeDropdown = () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    activeInputRef.current = null;
    suggestionRequest.current += 1;
    setActiveInputId(null);
    setSuggestions([]);
    setSugError(null);
    setLoadingSug(false);
  };
  const getDisplayedPrice = (id: string, base: number) => {
    const saved = updatedInvoiceData.list_of_lab_tests_ids_changed?.find(x => x.lab_test_id === id);
    return saved?.new_price ?? base * (updatedInvoiceData.patient_insurance_company_rate ?? 1);
  };
  const requestSuggestions = (
    lab_test_type_id: string,
    prefix: string,
    inputId: string,
  ) => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    activeInputRef.current = inputId;
    setActiveInputId(inputId);
    setSuggestions([]);
    setLoadingSug(false);
    const request = ++suggestionRequest.current;
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
        if (activeInputRef.current !== inputId || suggestionRequest.current !== request) return;
        setSuggestions(data);
      } catch (e) {
        if (activeInputRef.current !== inputId || suggestionRequest.current !== request) return;
        setSuggestions([]);
        setSugError(`Failed to load suggestions: ${e}`);
      } finally {
        if (activeInputRef.current === inputId && suggestionRequest.current === request) setLoadingSug(false);
      }
    }, 200);
  };
  const onPickSuggestion = (target: ResultTarget, value: string) => {
    onResultChange(target, normalizeResult(value));
    closeDropdown();
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
          <th className="h-8 px-0 py-2">Price</th>
          <th className="h-8 px-0 py-2">Remove</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={8}>
            <h1 className="font-bold rounded-b-sm px-4 py-2">Tests</h1>
          </td>
        </tr>
        {standAloneTestResults.map((r) => (
          <React.Fragment key={rowKey({ testId: r.lab_test_type_id, panelId: null })}>
            <tr key={rowKey({ testId: r.lab_test_type_id, panelId: null })} className="border rounded-sm">
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
                      setActiveInputId(rowKey({ testId: r.lab_test_type_id, panelId: null }));
                      requestSuggestions(
                        r.lab_test_type_id,
                        r.result ?? "",
                        rowKey({ testId: r.lab_test_type_id, panelId: null }),
                      );
                    }}
                    onChange={(e) => {
                      const v = e.target.value;
                      onResultChange({ testId: r.lab_test_type_id, panelId: null }, v);
                      setActiveInputId(rowKey({ testId: r.lab_test_type_id, panelId: null }));
                      requestSuggestions(
                        r.lab_test_type_id,
                        v,
                        rowKey({ testId: r.lab_test_type_id, panelId: null }),
                      );
                    }}
                    onBlur={(e) => {
                      const formatted = normalizeResult(e.currentTarget.value);
                      if (formatted !== e.currentTarget.value) {
                        void onResultChange({ testId: r.lab_test_type_id, panelId: null }, formatted);
                      }
                      setTimeout(() => { if (activeInputRef.current === rowKey({ testId: r.lab_test_type_id, panelId: null })) closeDropdown(); }, 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") closeDropdown();
                    }}
                  />
                  {activeInputId === rowKey({ testId: r.lab_test_type_id, panelId: null }) &&
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
                                onPickSuggestion({ testId: r.lab_test_type_id, panelId: null }, s.value)
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
              <td className="border rounded-b-sm px-4 py-2">
                <input
                  {...validation.field(`price-${r.lab_test_type.lab_test_id}`)}
                  aria-label={`${r.lab_test_type.name} price`}
                  type="number"
                  className="h-8 text-center w-full"
                  value={priceDrafts[r.lab_test_type.lab_test_id] ?? getDisplayedPrice(r.lab_test_type.lab_test_id, r.lab_test_type.price).toFixed(3)}
                  onChange={(e) => onPriceChange(r.lab_test_type.lab_test_id, e.target.value)}
                />
                <FieldError validation={validation} name={`price-${r.lab_test_type.lab_test_id}`} />

              </td>

              <td className="border rounded-b-sm  px-4 py-2">
                <button
                  className="p-2 h-10 w-20 rounded-sm bg-blue-400 hover:bg-red-600"
                  onClick={() => onRemoveTest(r.lab_test_type_id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          </React.Fragment>
        ))}
        {panelResults.map((panel) => (
          <React.Fragment key={panel.lab_panel_id}>
            <tr>
              <td className="border rounded-b-sm px-4 py-2" colSpan={4}>
                {panel.lab_panel_name}
              </td>
              <td className="border rounded-b-sm px-4 py-2">
                {panel.lab_panel_price}
              </td>
              <td></td>
              <td></td>

              <td className="border rounded-b-sm  px-4 py-2">
                <button
                  className="p-2 h-10 w-20 rounded-sm bg-blue-400 hover:bg-red-600"
                  onClick={() =>
                    onRemovePanel(panel.lab_panel_id)
                  }
                >
                  Remove
                </button>
              </td>
            </tr>
            {panel.list_of_test_results.map((r) => (
              <tr key={rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id })} className="border rounded-sm">
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
                        setActiveInputId(rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id }));
                        requestSuggestions(
                          r.lab_test_type_id,
                          r.result ?? "",
                          rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id }),
                        );
                      }}
                      onChange={(e) => {
                        const v = e.target.value;
                        onResultChange({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id }, v);
                        setActiveInputId(rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id }));
                        requestSuggestions(
                          r.lab_test_type_id,
                          v,
                          rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id }),
                        );
                      }}
                      onBlur={() => {
                        setTimeout(() => { if (activeInputRef.current === rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id })) closeDropdown(); }, 150);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") closeDropdown();
                      }}
                    />

                    {activeInputId === rowKey({ testId: r.lab_test_type_id, panelId: panel.lab_panel_id }) &&
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
                                    { testId: r.lab_test_type_id, panelId: panel.lab_panel_id },
                                    s.value,
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
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

export default TestResultsList;
