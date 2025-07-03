import { useEffect, useState } from "react";
import type { insuranceCompanyParams } from "../types";
import { fetchAllInsuranceCompanies } from "../utils";
import {
  pageListTitle,
  tableCreateButton,
  tableDeleteButton,
  tableHandleButton,
  tableHead,
  tableHeadCols,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import {
  InsuranceApiURL,
  InsuranceCreatePageURL,
  InsuranceEditPageURL,
} from "../data";

const InsuranceCompanyList = () => {
  const [availableInsuranceCompanies, setAvailableInsuranceCompanies] =
    useState<insuranceCompanyParams[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleCreateInsuranceCompany = () => {
    navigate(InsuranceCreatePageURL);
  };
  const handleEditInsuranceCompany = (insurance_company_id: string) => {
    navigate(`${InsuranceEditPageURL}${insurance_company_id}`);
  };
  const handleDeleteInsuranceCompany = (insurance_company_id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this insurance company?")
    ) {
      return;
    }
    try {
      api.delete(`${InsuranceApiURL}/${insurance_company_id}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    fetchAllInsuranceCompanies()
      .then((data) => {
        setAvailableInsuranceCompanies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading insurance companies…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Insurance Company List</h1>
      {availableInsuranceCompanies.length === 0 ? (
        <p> No insurance companies found!</p>
      ) : (
        <>
          <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
            <thead className={tableHead}>
              <tr>
                <th className={tableHeadCols}>Insurance Company Name</th>
                <th className={tableHeadCols}>Rate</th>
                <th className={tableHeadCols}>Edit</th>
                <th className={tableHeadCols}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {availableInsuranceCompanies.map((ic) => (
                <tr key={ic.insurance_company_id} className="border rounded-sm">
                  <td className={tableItem}>{ic.insurance_company_name}</td>
                  <td className={tableItem}>{ic.rate}</td>
                  <td className={tableItem}>
                    <button
                      className={tableHandleButton}
                      onClick={() =>
                        handleEditInsuranceCompany(ic.insurance_company_id)
                      }
                    >
                      Edit
                    </button>
                  </td>
                  <td className={tableItem}>
                    <button
                      className={tableDeleteButton}
                      onClick={() =>
                        handleDeleteInsuranceCompany(ic.insurance_company_id)
                      }
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
        onClick={() => handleCreateInsuranceCompany()}
      >
        Create Insurance Company
      </button>
    </div>
  );
};
export default InsuranceCompanyList;
