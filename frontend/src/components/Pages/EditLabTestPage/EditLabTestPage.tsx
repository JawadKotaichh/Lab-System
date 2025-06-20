import { useEffect, useState } from "react";
import { type insuranceCompanyParams, type LabTestTypeParams, type LabTestTypeInfo, type UpdateLabTestType } from "../../types";
import { fetchAllInsuranceCompanies, fetchLabTestType } from "../../utils";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";
import { User, Calendar, Phone, Activity } from 'lucide-react';

const EditLabTestTypePage: React.FC = () => {
  const { lab_test_type_id } = useParams<LabTestTypeParams>();
  const [currentLabTestTypeData, setCurrentLabTestTypeData] = useState<LabTestTypeInfo>();
  const [loadingLabTestType, setLoadingLabTestType] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [updateLabTestType, setUpdateLabTestType] = useState<UpdateLabTestType>();
  const [state,setState] =useState<string>("");
  const [loading, setLoading] = useState(true);
  const [allInsuranceCompanies,setAllInsuranceCompanies] = useState<insuranceCompanyParams[]>([]);
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    try {
      setState("Deleting LabTestType");
      await api.delete(`/LabTestTypes/${id}`);
      setState("LabTestType has been successfully deleted!");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleSaveAll = async (id: string, data: UpdateLabTestType) => {
    try {
      await api.put(`/LabTestTypes/${id}`, data);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    if (!lab_test_type_id) return;
    setLoadingLabTestType(true);
    fetchLabTestType(lab_test_type_id)
      .then((data) => {
        const formattedDOB = data.DOB.split("T")[0];
        setCurrentLabTestTypeData({ ...data, DOB: formattedDOB });
        setUpdateLabTestType({
          name: data.LabTestType_name,
          DOB: formattedDOB,
          gender: data.gender,
          phone_number: data.phone_number,
        });
      })
      .catch((err) => {
        setError(err.message || 'Failed to load');
      })
      .finally(() => setLoadingLabTestType(false));
  }, [lab_test_type_id]);
  
  useEffect(() => {
    setLoading(true);
    fetchAllInsuranceCompanies()
        .then((data) => {
        setAllInsuranceCompanies(data);
        setLoading(false);
        })
        .catch((err) => {
        setError(err.message || 'Failed to load');
        setLoading(false);
        });
    }, []);

  if (loading) return <div className="p-4">Loading insurance companies…</div>;
  if (error)   return <div className="p-4 text-red-600">Error: {error}</div>;


  if (loadingLabTestType) return <div className="text-center p-8">Loading LabTestType…</div>;
  if (error) return <div className="text-red-600 text-center p-8">Error: {error}</div>;
  if (!currentLabTestTypeData) return null;


  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center space-x-2">
        <Activity className="w-6 h-6 text-blue-500" />
        <span>Edit LabTestType</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <User className="w-4 h-4 text-gray-500" />
            <span>Name</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={currentLabTestTypeData.LabTestType_name}
            placeholder="Enter name"
            onChange={(e) => {
              const raw = e.target.value;
              const newName = raw.charAt(0).toUpperCase() + raw.slice(1);
              setCurrentLabTestTypeData((prev) => ({ ...prev!, LabTestType_name: newName }));
              setUpdateLabTestType((prev) => ({ ...prev!, name: newName }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Gender</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={currentLabTestTypeData.gender}
            onChange={(e) =>{
              const raw = e.target.value;
              const newGender = raw.charAt(0).toUpperCase() + raw.slice(1);
              setCurrentLabTestTypeData(prev => ({ ...prev!, gender: newGender }))
              setUpdateLabTestType((prev) => ({ ...prev!, gender: newGender }));
              }
            }
          >
            <option value="" disabled>— Select gender —</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Date of Birth</span>
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={currentLabTestTypeData.DOB}
            onChange={(e) => {
              const newDOB = e.target.value;
              setCurrentLabTestTypeData((prev) => ({ ...prev!, DOB: newDOB }));
              setUpdateLabTestType((prev) => ({ ...prev!, DOB: newDOB }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">
            Insurance Company
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={currentLabTestTypeData.insurance_company_id}
            onChange={e =>
              {
              setCurrentLabTestTypeData(prev => ({
                ...prev!,
                insurance_company_id: e.target.value
              }));
              setUpdateLabTestType(prev => ({
                ...prev!,
                insurance_company_id: e.target.value
              }))
            }
            }
          >
            <option value="" disabled>— Select insurance company —</option>
            {allInsuranceCompanies.map(ic => (
              <option key={ic.insurance_company_id} value={ic.insurance_company_id}>
                {ic.insurance_company_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center space-x-1">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>Phone</span>
          </label>
          <input
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={String(currentLabTestTypeData.phone_number)}
            placeholder="Enter phone number"
            onChange={(e) => {
              const newPhone = e.target.value;
              setCurrentLabTestTypeData((prev) => ({ ...prev!, phone_number: newPhone }));
              setUpdateLabTestType((prev) => ({ ...prev!, phone_number: newPhone }));
            }}
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow transition"
          onClick={() => handleSaveAll(lab_test_type_id!, updateLabTestType!)}
        >
          <Activity className="w-10 h-5" />
          <span>Save Changes</span>
        </button>
      </div>
      <div className="mt-8 text-center">
        <button
          className="inline-flex items-center space-x-2 bg-red-500 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg shadow transition"
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this LabTestType?")) {
              handleDelete(lab_test_type_id!);
              navigate("/LabTestTypes");
            }
          }
        }
        >
          <Activity className="w-10 h-5" />
          <span>Delete Lab Test</span>
        </button>
        <h1 className="mt-5 text-red-500">{state}</h1>
      </div> 
    </div>
  );
};

export default EditLabTestTypePage;