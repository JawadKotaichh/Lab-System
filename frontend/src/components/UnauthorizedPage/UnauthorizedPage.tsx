import { useNavigate } from "react-router-dom";

const UnauthorizedPage = ({homePath}: {homePath: string}) => {
    const navigate=useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-4xl font-bold">403 - Access Denied</h1>
             <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
            <button
                onClick={() => navigate(homePath)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
                Go Back Home
            </button>
        </div>
    );
};
export default UnauthorizedPage;