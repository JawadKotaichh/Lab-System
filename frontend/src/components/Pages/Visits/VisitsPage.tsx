import { useNavigate } from 'react-router-dom';
import DateRangePicker from './DataRangePicker';
import React, { useCallback, useEffect, useState } from 'react';
import api from '../../../api';


interface Visit {
  _id: string;
  patient_id: string;
  date: string;
}

interface PatientInfo {
  patient_id: string;
  name: string;
  visit_id:string;
}

const Visits: React.FC = () =>{
    const [patientData,setPatientData] = useState<PatientInfo[]>([]);
    const [status, setStatus] = useState<string>(""); 
    const navigate = useNavigate();
    const [, setVisits] = useState<Visit[]>([]);
    const today = new Date().toISOString().split("T")[0];
    const [startDate, setStartDate] = useState<string>(today);
    const [endDate, setEndDate] = useState<string>(today);

    const handleSubmit = useCallback(async () => {
        // console.log(`status : ${status}`);
        // console.log(`start_date: ${startDate}`)
        // console.log(`end_date: ${endDate}`)
        
        try {
        setStatus("Fetching visits within this date range…");

        const response = await api.get("/visits/", {
            params: { start_date: startDate, end_date: endDate },
        });

        const fetchedVisits: Visit[] = response.data.items;
        setVisits(fetchedVisits);

        if (fetchedVisits.length === 0) {
            setStatus(`No visits found between ${startDate} and ${endDate}.`);
        } else {
            setStatus(`Found ${fetchedVisits.length} visit(s) from ${startDate} to ${endDate}.`);
        }
        
        const names: PatientInfo[] = await Promise.all(
        fetchedVisits.map(async (v) => {
            const resp = await api.get(`/patients/${v.patient_id}/visits/${v._id}/patient_name`);
            return {
            patient_id: v.patient_id,
            visit_id:   v._id,
            name:       resp.data.name
            };
        })
        );
            setPatientData(names);
        } catch (err:unknown) {
        setStatus(`Error fetching visits ${err}`);
        setVisits([]);
        }
        
    }, [startDate, endDate]); 
    useEffect(() => {
        handleSubmit();
        }, [handleSubmit]);
    return (
    
    <div className="relative w-screen h-screen bg-white">
        <main className="relative">
            <div className="relative w-full">

                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-center bg-white p-4 rounded-xl shadow-md">            
                <DateRangePicker startDate={startDate} endDate={endDate} setEndDate={setEndDate} setStartDate={setStartDate}/> 
                <button
                    onClick={handleSubmit}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Submit
                </button>
                <p className="mt-4 text-gray-700">{status}</p>

                </div>

            </div>
           
            <div className="absolute p-6 top-60 w-full max-h-64 overflow-auto">
                {patientData.map((p) => {
                return (
                    <ul
                    key={p.patient_id}
                    className="p-3 border rounded-sm hover:bg-white text-black  hover:text-gray-500  flex justify-between items-center py-2 border-b cursor-pointer"
                    onClick={()=>navigate(`/edit-visit/patients/${p.patient_id}/${p.visit_id}`)}
                    >
                    <li 
                    className="font-medium"
                    >
                        {p.name}
                    </li>
                    </ul>
                );
                })}
            </div>        

        </main>  
    </div> 
    );
};

export default Visits;