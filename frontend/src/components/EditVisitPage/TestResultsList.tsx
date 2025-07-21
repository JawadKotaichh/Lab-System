import EditVistHead from "./EditVisitHead.js";
import type { visitResult } from "../types.js";
import api from "../../api.js";

interface ShowResultsListParams {
  results: visitResult[];
  setResults: React.Dispatch<React.SetStateAction<visitResult[]>>;
  visit_id: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const TestResultsList: React.FC<ShowResultsListParams> = ({
  results,
  setResults,
  visit_id,
  setError,
}: ShowResultsListParams) => {
  const handleChange = async (
    lab_test_result_id: string,
    newResult: string
  ) => {
    setResults((prev) =>
      prev.map((item) =>
        item.lab_test_result_id == lab_test_result_id
          ? { ...item, result: newResult }
          : item
      )
    );
  };

  const handleDelete = async (lab_test_result_id: string) => {
    const url = `visits/${visit_id}/lab_tests_results/${lab_test_result_id}`;
    try {
      await api.delete(url);
      setResults((prev) =>
        prev.filter((r) => r.lab_test_result_id !== lab_test_result_id)
      );
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <table className="border rounded-b-sm w-full table-auto bg-white rounded shadow text-center mt-10">
      <EditVistHead />
      <tbody>
        {results.map((r) => (
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
                onClick={() => handleDelete(r.lab_test_result_id)}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TestResultsList;
