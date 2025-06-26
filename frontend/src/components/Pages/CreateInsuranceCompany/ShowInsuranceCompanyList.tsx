import { useEffect, useState } from "react";
import type { insuranceCompanyParams } from "../../types";
import { fetchAllInsuranceCompanies } from "../../utils";
import InsuranceCompanyListHead from "./InsuranceCompanyListHead";
import { pageListTitle, tableCreateButton, tableHandleButton, tableItem } from "../../../style";
import { useNavigate } from "react-router-dom";

const ShowInsuranceCompanyList = () =>{
    const [availableInsuranceCompanies,setAvailableInsuranceCompanies] = useState<insuranceCompanyParams[]>([]);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const handleCreateInsuranceCompany = () => {
        navigate("/create-insurance-company");
    };
    const handleEditInsuranceCompany = (insurance_company_id:string) => {
        console.log("I naviagted to edit page");
        navigate(`/edit-insurance-company/${insurance_company_id}`);
    };

    useEffect(()=>{
        fetchAllInsuranceCompanies()
        .then((data) => {
            setAvailableInsuranceCompanies(data);
            setLoading(false);
        })
        .catch((err)=>{
            setError(err.message || 'Failed to load');
            setLoading(false);
        });
    },[])

    if (loading) return <div className="p-4">Loading insurance companies…</div>;
    if (error)   return <div className="p-4 text-red-600">Error: {error}</div>;

    return(
         <div className="p-8 bg-white">
            <h1 className={pageListTitle}>Insurance Company List</h1>
            {availableInsuranceCompanies.length === 0 ? (
                <p> No insurance companies found!</p>
                ) : (
                <>
                <table className="overflow-y-auto border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
                    <InsuranceCompanyListHead/>
                    <tbody>
                    {availableInsuranceCompanies.map(ic => (
                        <tr key={ic.insurance_company_id} className="border rounded-sm">
                        <td className={tableItem}>{ic.insurance_company_name}</td>
                        <td className={tableItem}>{ic.rate}</td>
                        <td className={tableItem}>
                            <button 
                            className={tableHandleButton}
                            onClick={() => handleEditInsuranceCompany(ic.insurance_company_id)}
                            >
                                Edit Insurance Company
                            </button>       
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                 
                </>
                )
            }
        <button 
            className={tableCreateButton}
            onClick={() => handleCreateInsuranceCompany()}
            >
                Create Insurance Company
        </button>
        
        </div>
    );

};
export default ShowInsuranceCompanyList;