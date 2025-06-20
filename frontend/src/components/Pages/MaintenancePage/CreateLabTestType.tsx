import {  useEffect, useState } from "react";
import { type CreateLabTestType, type labTestClassParams,} from "../../types";
import api from "../../../api";
import {Activity, TestTube, IdCard, Type, DollarSign } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { fetchAllLabTestTypeClasses } from "../../utils";

const CreateLabTestTypePage: React.FC = () => {
  const [error, setError] = useState<string>();
  const [state,setState] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [createdLabTestType, setCreatedLabTestType] = useState<CreateLabTestType>({
    nssf_id: "",
    lab_test_type_class_id : "", 
    name: "",
    unit: "",
    price: 0,
    lower_bound: "",
    upper_bound: "",
  });
  const navigate = useNavigate();
  const [allTestsClasess,setAllTestsClasses] = useState<labTestClassParams[]>([]);

  useEffect(()=>{
    setLoading(true);
    fetchAllLabTestTypeClasses()
    .then((data)=>{
      setAllTestsClasses(data);
      setLoading(false);
    }).catch((err) =>{
          setError(err.message || 'Failed to load');
          setLoading(false);
       }
      )
    }, []);
  
  if(!loading){console.log(error);}
  
  const handleSaveAll = async (data: CreateLabTestType) => {
    if( data.nssf_id=="" || data.lab_test_type_class_id=="" || data.name=="" || data.unit=="" || data.lower_bound=="" || data.upper_bound=="" || data.price == 0){
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      setState("Creating new lab test");
      await api.post(`/lab_test_type/`, data);
      setState("Lab Test created successfully!");
      navigate("/create-lab-test-type");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
 
  if (error) return <div className="text-red-600 text-center p-8">Error: {error}</div>;
  if (!createdLabTestType) return null;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center space-x-2">
        <Activity className="w-6 h-6 text-blue-500" />
        <span>Create Lab Test</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <IdCard className="w-4 h-4 text-gray-500" />
            <span>Nssf Id</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={createdLabTestType.nssf_id}
            placeholder="Enter nssf id"
            onChange={(e) => {
              const newNssfID = e.target.value;
              setCreatedLabTestType((prev) => ({ ...prev!,  nssf_id: newNssfID }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <TestTube className="w-4 h-4 text-gray-500" />
            <span>Test Name</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={createdLabTestType.name}
            placeholder="Enter test name"
            onChange={(e) => {
              const raw = e.target.value;
              const newName = raw.charAt(0).toUpperCase() + raw.slice(1);
              setCreatedLabTestType((prev) => ({ ...prev!, name: newName }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 space-x-1 flex items-center">
            <TestTube className="w-4 h-4 text-gray-500" />
            <span> Lab Test Class </span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={createdLabTestType.lab_test_type_class_id}
            onChange={e =>
              setCreatedLabTestType(prev => ({
                ...prev!,
                lab_test_type_class_id: e.target.value
              }))
            }
          >
            <option value="" disabled>— Select lab test class —</option>
            {allTestsClasess.map(lbc => (
              <option key={lbc.lab_test_type_class_id} value={lbc.lab_test_type_class_id}>
                {lbc.lab_test_type_class_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <Type className="w-4 h-4 text-gray-500" />
            <span>Unit</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={createdLabTestType.unit}
            placeholder="Enter the unit"
            onChange={(e) => {
              const newUnit = e.target.value;
              setCreatedLabTestType((prev) => ({ ...prev!, unit: newUnit }));
            }}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span>Price</span>
          </label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={String(createdLabTestType.price)}
            placeholder="Enter price"
            onChange={(e) => {
              const newPrice = e.target.value;
              setCreatedLabTestType((prev) => ({ ...prev!, price: Number(newPrice) }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <TestTube className="w-4 h-4 text-gray-500" />
            <span>Lower Bound</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={String(createdLabTestType.lower_bound)}
            placeholder="Enter lower bound"
            onChange={(e) => {
              const newLowerBound = e.target.value;
              setCreatedLabTestType((prev) => ({ ...prev!, lower_bound: newLowerBound }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <TestTube className="w-4 h-4 text-gray-500" />
            <span>Upper Bound</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={String(createdLabTestType.upper_bound)}
            placeholder="Enter upper bound"
            onChange={(e) => {
              const newUpperBound = e.target.value;
              setCreatedLabTestType((prev) => ({ ...prev!, upper_bound: newUpperBound }));
            }}
          />
        </div>
      </div>
      

      <div className="mt-8 text-center">
        <button
          className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow transition"
          onClick={() => {
            handleSaveAll(createdLabTestType!);
          }
        }
        >
          <Activity className="w-5 h-5" />
          <span>Save Changes</span>
        </button>
        <h1 className="text-red-400">{state}</h1>
      </div>
    </div>
  );
};

export default CreateLabTestTypePage;