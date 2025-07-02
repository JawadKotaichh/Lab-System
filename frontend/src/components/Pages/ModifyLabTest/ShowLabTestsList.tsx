import { useEffect, useMemo, useState } from "react";
import type { labTest, labTestCategoryParams } from "../../types";
import { fetchAllLabTest, fetchAllLabTestTypeCategories } from "../../utils";
import {
  pageListTitle,
  tableCreateButton,
  tableDeleteButton,
  tableHandleButton,
  tableItem,
} from "../../../style";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import LabTestListHead from "./LabTestListHead";

interface EditLabTestParams {
  createPageURL: string;
  editPageURL: string;
  apiURL: string;
}

const ShowLabTestsList = ({
  apiURL,
  editPageURL,
  createPageURL,
}: EditLabTestParams) => {
  const [availableLabTests, setAvailableLabTests] = useState<labTest[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [labTestCategories, setLabTestCategories] = useState<
    labTestCategoryParams[]
  >([]);
  const navigate = useNavigate();
  const handleCreateLabTest = () => {
    navigate(createPageURL);
  };
  const handleEditLabTest = (insurance_company_id: string) => {
    navigate(`${editPageURL}${insurance_company_id}`);
  };
  const handleDeleteLabTest = (insurance_company_id: string) => {
    if (!window.confirm("Are you sure you want to delete this lab test?")) {
      return;
    }
    try {
      api.delete(`${apiURL}/${insurance_company_id}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    fetchAllLabTest()
      .then((data) => {
        setAvailableLabTests(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    fetchAllLabTestTypeCategories()
      .then((data) => {
        setLabTestCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, []);

  const labTestCategoryById = useMemo(() => {
    return labTestCategories.reduce<Record<string, string>>((map, c) => {
      map[c.lab_test_category_id] = c.lab_test_category_name;
      return map;
    }, {});
  }, [labTestCategories]);

  if (loading) return <div className="p-4">Loading lab tests...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Lab Tests List</h1>
      {availableLabTests.length === 0 ? (
        <p> No lab tests found!</p>
      ) : (
        <>
          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
            <LabTestListHead />
            <tbody>
              {availableLabTests.map((lt) => (
                <tr key={lt.lab_test_id} className="border rounded-sm">
                  <td className={tableItem}>{lt.lab_test_name}</td>
                  <td className={tableItem}>
                    {labTestCategoryById[lt.lab_test_category_id]}
                  </td>
                  <td className={tableItem}>{lt.unit}</td>
                  <td className={tableItem}>{lt.price}</td>
                  <td className={tableItem}>{lt.upper_bound}</td>
                  <td className={tableItem}>{lt.lower_bound}</td>
                  <td className={tableItem}>
                    <button
                      className={tableHandleButton}
                      onClick={() => handleEditLabTest(lt.lab_test_id)}
                    >
                      Edit
                    </button>
                  </td>
                  <td className={tableItem}>
                    <button
                      className={tableDeleteButton}
                      onClick={() => handleDeleteLabTest(lt.lab_test_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <button
        className={tableCreateButton}
        onClick={() => handleCreateLabTest()}
      >
        Create Lab Test
      </button>
    </div>
  );
};
export default ShowLabTestsList;
