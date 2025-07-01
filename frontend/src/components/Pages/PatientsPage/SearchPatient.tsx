import type {patientInfo } from "../../types";

interface SearchForAPatientProps  {
  searchInput:string;
  allPatients:patientInfo[];
  setSearchInput:React.Dispatch<React.SetStateAction<string>>;
  setVisiblePatients:React.Dispatch<React.SetStateAction<patientInfo[]>>;
}

const SearchPatient : React.FC<SearchForAPatientProps> = (
    {searchInput,allPatients,setSearchInput,setVisiblePatients}:SearchForAPatientProps) =>{
    function handleSearch(e:React.ChangeEvent<HTMLInputElement>){
            e.preventDefault();
            const test = e.target.value;
            setSearchInput(test);
            if(!test){
                setVisiblePatients(allPatients);
                return;
            }
            const filtered_patients= allPatients.filter(p =>p.patient_name.toLowerCase().includes(test.toLowerCase()));
            setVisiblePatients(filtered_patients);
    }

    return (
        <div>
            <input
            value = {searchInput}
            onChange = {(e)=> handleSearch(e)}
            placeholder="Search for a patient"
            className="mb-10 text-xl rounded-s-m grow border border-gray-400 p-2 w-full h-15"
            />
        </div>
    );
};

export default SearchPatient;