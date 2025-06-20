import EditResultsHead from "./EditResultsHead";
import type {labTestClassParams, LabTestResult } from "../../types";
import api from "../../../api.js";
import { useEffect, useMemo, useState } from "react";
import { fetchAllLabTestTypeClasses } from "../../utils.js";


interface ShowResultsListParams  {
    results:LabTestResult[];
    setResults:React.Dispatch<React.SetStateAction<LabTestResult[]>>;
    patient_id : string;
    visit_id: string;
    setError:React.Dispatch<React.SetStateAction<string>>;
}

const ShowResultsList : React.FC<ShowResultsListParams> = ({results,setResults,patient_id,visit_id,setError}:ShowResultsListParams) =>{
    const [labTestTypeClases, setLabTestTypeClases] = useState<labTestClassParams[]>([]);

    useEffect(() => {
        fetchAllLabTestTypeClasses()
        .then(setLabTestTypeClases)
        .catch((err) => setError(err.message || "Failed to load companies"));
    }, [setError]);

    const classById = useMemo(() => {
        return labTestTypeClases.reduce<Record<string, string>>((map, c) => {
        map[c.lab_test_type_class_id] = c.lab_test_type_class_name;
        return map;
        }, {});
    }, [labTestTypeClases]);

    const handleChange = async(lab_test_result_id:string,newResult:string) => {
        setResults(prev =>
            prev.map(item => item.lab_test_result_id==lab_test_result_id ? {...item,result:newResult} : item)
        );
    };
    

    const handleDelete = async(lab_test_result_id:string)=>{
        const url = `/patients/${patient_id}/visits/${visit_id}/lab_tests_results/${lab_test_result_id}`;
        try{
            await api.delete(url);
            setResults((prev) => prev.filter((r) => r.lab_test_result_id !== lab_test_result_id));
        }catch(err:unknown){
            console.error(err);
            if (err instanceof Error){
                setError(err.message);
            }
        }
    };

    return (
        <table className="border rounded-b-sm w-full table-auto bg-white rounded shadow text-center">
            <EditResultsHead/>
            <tbody>
            {results.map(r => (
                <tr key={r.lab_test_result_id} className="border rounded-sm">
                <td className="border rounded-b-sm px-4 py-2">{classById[r.lab_test_type_class_id]}</td>
                <td className="border rounded-b-sm px-4 py-2">{r.lab_test_name}</td>
                <td 
                className="border rounded-b-sm  px-4 py-2"
                >
                    <input
                    className='h-8 text-center'
                    placeholder='Enter result'
                    value={r.result}
                    onChange={(e) =>handleChange(r.lab_test_result_id,e.target.value) }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.currentTarget.blur();}
                        }}
                    />
                </td>
                <td className="border rounded-b-sm px-4 py-2">{r.unit}</td>
                <td className="border rounded-b-sm  px-4 py-2">${r.price.toFixed(2)}</td>
                <td className="border rounded-b-sm  px-4 py-2">{r.lower_bound}</td>
                <td className="border rounded-b-sm  px-4 py-2">{r.upper_bound}</td>
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
}

export default ShowResultsList;