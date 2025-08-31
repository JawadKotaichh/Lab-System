import axios from 'axios';

// const baseURLL = import.meta.env.VITE_API_BASE_URL;
const baseURLL ="https://fastapiatlaslabsystem.mangofield-ad6b30ea.westeurope.azurecontainerapps.io";

const api = axios.create({
    baseURL: baseURLL,
    withCredentials: false,
});

export default api;