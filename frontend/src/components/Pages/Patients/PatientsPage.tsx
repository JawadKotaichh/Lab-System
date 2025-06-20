import { useState } from "react";
import ShowPatientList from "./ShowPatientList";
import type { patientInfo } from "../../types";
import { useNavigate } from "react-router-dom";



const PatientPage: React.FC = () => {
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [allPatients,setAllPatients] = useState<patientInfo[]>([]);
    const [searchInput,setSearchInput] = useState<string>("");
    const [visiblePatiens,setVisiblePatients]  = useState<patientInfo[]>(allPatients);
    const [error, setError] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1); 
    const [pageSize, setPageSize] = useState<number>(10); 
    const navigate = useNavigate();

    
    return(
        <div className="p-8 bg-white">
            <ShowPatientList
            allPatients={allPatients}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            visiblePatients={visiblePatiens}
            setVisiblePatients={setVisiblePatients}
            setAllPatients={setAllPatients}
            loadingPatients={loadingPatients}
            setLoadingPatients={setLoadingPatients}
            error={error}
            setError={setError}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            setTotalPages={setTotalPages}
            pageSize={pageSize}
            setPageSize={setPageSize}
            />
            <div className="p-8 mb-2">
                <button
                className="mt-4 p-2 h-fit w-fit rounded-sm text-center bg-blue-400 hover:bg-green-600"
                onClick={() => navigate(`/patients/create-patient`)}
                >
                    Create New Patient
                </button>
            </div>
{/* 
            <div className="p-8 mb-2">
                <input
                className="mt-4 p-2 h-fit w-fit rounded-sm text-center bg-blue-400 hover:bg-green-600"
                onChange={(e) => setPageSize(Number(e.target.value))}
                placeholder="Page pageSize"
                />
            </div> */}
        </div>
    );
}


export default PatientPage;