import AddResultHead from "./AddResultHead.js";
// import SearchTest from "./SearchTest";
import api from "../../../api.js";
import type {labTestClassParams, LabTestResult} from "../../types.js";
import type {labTest} from "../../types.js";
import {fetchAllLabTestTypeClasses, fetchLabTestResults, fetchLabTestTypePaginated} from "../../utils.js"
import { useEffect, useMemo, useState } from "react";
import Pagination from "../../Pagination.js";


interface TestsList  {
    addError:string;
    setAddError:React.Dispatch<React.SetStateAction<string>>;
    show:boolean;
    setShow:React.Dispatch<React.SetStateAction<boolean>>;
    // searchInput:string;
    // setSearchInput:React.Dispatch<React.SetStateAction<string>>;
    allTests: labTest[];
    visibleTests:labTest[];
    setVisibleTests:React.Dispatch<React.SetStateAction<labTest[]>>;
    results:LabTestResult[];
    setResults:React.Dispatch<React.SetStateAction<LabTestResult[]>>;
    patient_id : string;
    visit_id: string;
    error:string;
    setError:React.Dispatch<React.SetStateAction<string>>;
    pageSize:number;
    setPageSize:React.Dispatch<React.SetStateAction<number>>;
    totalPages:number;
    setTotalPages:React.Dispatch<React.SetStateAction<number>>;
    currentPage:number;
    setCurrentPage:React.Dispatch<React.SetStateAction<number>>;
    TotalNumberOfTests:number;
    setTotalNumberOfTests:React.Dispatch<React.SetStateAction<number>>;
}

  


const ShowTestsList : React.FC<TestsList> = ({
    addError,
    setAddError,
    show,setShow,
    // searchInput,setSearchInput,
    allTests,
    visibleTests,setVisibleTests,
    results,setResults,
    patient_id,visit_id,
    setError,
    currentPage,setCurrentPage,
    totalPages,setTotalPages,
    pageSize,setPageSize,
    TotalNumberOfTests,setTotalNumberOfTests
}:TestsList) =>{
    const [labTestTypeClases, setLabTestTypeClases] = useState<labTestClassParams[]>([]);

    useEffect(() => {
        fetchAllLabTestTypeClasses()
        .then(setLabTestTypeClases)
        .catch((err) => setError(err.message || "Failed to load companies"));
    }, [setError]);

    const classById = useMemo(() => {
        return labTestTypeClases.reduce<Record<string, string>>((map, c) => {
        map[c.lab_test_type_category_id] = c.lab_test_type_category_name;
        return map;
        }, {});
    }, [labTestTypeClases]);
    
    
    useEffect(() => {
        if (pageSize && currentPage) {  
            fetchLabTestTypePaginated(currentPage,pageSize)
            .then((data) => {
                setVisibleTests(data.lab_tests);
                setTotalPages(data.total_pages);
                setTotalNumberOfTests(data.TotalNumberOfTests);
            }).catch((err) => setError(err.message || "Failed to load"))
        }
    },  [pageSize,totalPages, currentPage,setTotalNumberOfTests, setVisibleTests, setTotalPages, setError]);

    const handleAdd = async (lab_test_id:string) =>{
        console.log(results.some(r => r.lab_test_type_id == lab_test_id));
        if (results.some(r => r.lab_test_type_id === lab_test_id)) {
            setAddError("This test already exists.");
            alert("This test already exists.");
            setShow(false);
            setAddError("");
            // setSearchInput("");
            setVisibleTests(allTests);
            return;
        }     
        setAddError("");
        const url =`/patients/${patient_id}/visits/${visit_id}/lab_tests_results`;
        try{
        
        await api.post(url,{lab_test_type_id:lab_test_id,visit_id,result:""});
        const updated = await fetchLabTestResults(patient_id!,visit_id!);
        setResults(updated);
        setShow(false);
        }catch(err:unknown){
            console.error(err);
            if (err instanceof Error){
                setError(err.message);
            }
        }
    };

      
    return (
        <>
        {show && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50">
                <div className="
                    bg-white 
                    p-6 
                    rounded 
                    shadow-lg 
                    w-full 
                    max-w-5xl
                    max-h-[80vh]
                    flex 
                    flex-col
                "
                >
                <h2 className="text-lg font-semibold mb-4">Add a new test</h2>
                {addError&& 
                    (<p className="mb-2 text-sm text-red-600">{addError}</p>)
                }
                {/* <SearchTest
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                allTests={allTests}
                setVisibleTests={setVisibleTests}
                /> */}
                <div className="flex-1 overflow-y-auto mt-4 border border-black">
                   <table className="w-full border border-black border-collapse text-center">
                        <AddResultHead/>                       
                        <tbody>
                            {
                            visibleTests.map(
                                test =>
                                    <tr key={test.lab_test_id}>
                                        <td className="border rounded-b-sm px-4 py-2">{classById[test.lab_test_type_category_id]}</td>
                                        <td className="border rounded-b-sm px-4 py-2">{test.nssf_id}</td>
                                        <td className="border font-bold px-4 py-2">{test.lab_test_name}</td>
                                        <td className="border rounded-b-sm px-4 py-2">{test.unit}</td>
                                        <td className="border rounded-b-sm  px-4 py-2">${test.price.toFixed(2)}</td>
                                        <td className="border rounded-b-sm  px-4 py-2">{test.lower_bound}</td>
                                        <td className="border rounded-b-sm  px-4 py-2">{test.upper_bound}</td>
                                        <td className="border rounded-b-sm  px-4 py-2">
                                            <button 
                                            className="p-2 h-10 w-20 rounded-sm bg-blue-400 hover:bg-green-500"
                                            onClick={() => handleAdd(test.lab_test_id)}
                                            >
                                                Add 
                                            </button>       
                                        </td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                    <Pagination
                        TotalNumberOfPaginatedItems={TotalNumberOfTests}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                    />
                    <div className="sticky bottom-0 bg-white border-t pt-4 flex">
                        <button
                        onClick={() => setShow(false)}
                        className="px-4 py-2 bg-red-400 rounded hover:bg-red-600"
                        >
                        Close
                        </button>
                    </div>
                    </div>
                </div>
            </div>
            )}
        </>
    );
};
export default ShowTestsList;
