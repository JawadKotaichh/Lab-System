import {  useEffect, useState } from "react";
import { type CreatePatient, type insuranceCompanyParams } from "../../types";
import api from "../../../api";
import { User, Calendar, Phone, Activity } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { fetchAllInsuranceCompanies } from "../../utils";

const CreatePatientPage: React.FC = () => {
  const [error, setError] = useState<string>();
  const [state,setState] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [allInsuranceCompanies,setAllInsuranceCompanies] = useState<insuranceCompanyParams[]>([]);
  const [createdPatient, setCreatedPatient] = useState<CreatePatient>({
    name: "",
    DOB: "",
    gender: "",
    phone_number: "",
    insurance_company_id:""
  });
  const navigate = useNavigate();
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

  const handleSaveAll = async (data: CreatePatient) => {
    if( data.DOB=="" || data.name=="" || data.gender=="" || data.phone_number=="" || data.insurance_company_id==""){
      setState("Please insert all the reuqired fields!");
      return;
    }
    try {
      setState("Creating new patient");
      await api.post(`/patients/`, data);
      setState("Patient created successfully!");
      navigate("/patients");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };
 
  if (error) return <div className="text-red-600 text-center p-8">Error: {error}</div>;
  if (!createdPatient) return null;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center space-x-2">
        <Activity className="w-6 h-6 text-blue-500" />
        <span>Create Patient</span>
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
            value={createdPatient.name}
            placeholder="Enter name"
            onChange={(e) => {
              const raw = e.target.value;
              const newName = raw.charAt(0).toUpperCase() + raw.slice(1);
              setCreatedPatient((prev) => ({ ...prev!, name: newName }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Gender</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={createdPatient.gender}
            onChange={(e) =>
              setCreatedPatient(prev => ({ ...prev!, gender: e.target.value }))
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
            value={createdPatient.DOB}
            onChange={(e) => {
              const newDOB = e.target.value;
              setCreatedPatient((prev) => ({ ...prev!, DOB: newDOB }));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">
            Insurance Company
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={createdPatient.insurance_company_id}
            onChange={e =>
              setCreatedPatient(prev => ({
                ...prev!,
                insurance_company_id: e.target.value
              }))
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
            value={String(createdPatient.phone_number)}
            placeholder="Enter phone number"
            onChange={(e) => {
              const newPhone = e.target.value;
              setCreatedPatient((prev) => ({ ...prev!, phone_number: newPhone }));
            }}
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg shadow transition"
          onClick={() => {
            handleSaveAll(createdPatient!);
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

export default CreatePatientPage;