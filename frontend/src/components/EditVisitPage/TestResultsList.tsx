import type { patientPanelResult, patientTestResult } from "../types.js";
import api from "../../api.js";
import { labTestResultApiURL } from "../data.js";
import React from "react";

interface ShowResultsListParams {
  panelResults: patientPanelResult[];
  setPanelResults: React.Dispatch<React.SetStateAction<patientPanelResult[]>>;
  standAloneTestResults: patientTestResult[];
  setStandAloneTestResults: React.Dispatch<
    React.SetStateAction<patientTestResult[]>
  >;
  visit_id: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const TestResultsList: React.FC<ShowResultsListParams> = ({
  panelResults,
  setPanelResults,
  standAloneTestResults,
  setStandAloneTestResults,
  setError,
  visit_id,
}: ShowResultsListParams) => {
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
  };

  const handleDeleteLabResult = async (lab_test_result_id: string) => {
    const url = `${labTestResultApiURL}/${lab_test_result_id}`;
    try {
      await api.delete(url);
      window.location.reload();
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
      window.location.reload();
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
          <th className="h-8 px-0 py-2">Price</th>
          <th className="h-8 px-0 py-2">Lower Bound</th>
          <th className="h-8 px-0 py-2">Upper Bound</th>
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
              <td className="border rounded-b-sm  px-4 py-2">
                <input
                  className="h-8 text-center"
                  placeholder="Enter result"
                  value={r.result}
                  onChange={(e) =>
                    handleChange(r.lab_test_result_id, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
              </td>
              <td className="border rounded-b-sm px-4 py-2">
                {r.lab_test_type.unit}
              </td>
              <td className="border rounded-b-sm  px-4 py-2">
                ${r.lab_test_type.price.toFixed(2)}
              </td>
              <td className="border rounded-b-sm  px-4 py-2">
                {r.lab_test_type.lower_bound}
              </td>
              <td className="border rounded-b-sm  px-4 py-2">
                {r.lab_test_type.upper_bound}
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
              <td className="border rounded-b-sm px-4 py-2" colSpan={7}>
                {panel.lab_panel_name}
              </td>
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
                  <input
                    className="h-8 text-center"
                    placeholder="Enter result"
                    value={r.result}
                    onChange={(e) =>
                      handleChange(r.lab_test_result_id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </td>
                <td className="border rounded-b-sm px-4 py-2">
                  {r.lab_test_type.unit}
                </td>
                <td className="border rounded-b-sm  px-4 py-2">
                  ${panel.lab_panel_price.toFixed(2)}
                </td>
                <td className="border rounded-b-sm  px-4 py-2">
                  {r.lab_test_type.lower_bound}
                </td>
                <td className="border rounded-b-sm  px-4 py-2">
                  {r.lab_test_type.upper_bound}
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
