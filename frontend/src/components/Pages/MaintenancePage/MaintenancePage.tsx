import { useNavigate } from "react-router-dom";

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  return(
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-semibold mb-6 text-center">Maintenance Page</h1>
      <button
        className="mt-4 p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
        onClick={() => navigate(`/create-lab-test-type`)}
        >
            Create New Lab Test
      </button>
      <button
        className="mt-4 ml-5 p-2 h-fit w-fit rounded-sm bg-blue-400 hover:bg-green-600"
        onClick={() => navigate(`/edit-lab-test-type`)}
        >
            Edit Lab Test
      </button>
    </div>
  )
};

export default MaintenancePage;