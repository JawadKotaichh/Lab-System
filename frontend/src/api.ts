import axios from 'axios';
const baseURLL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
    baseURL: baseURLL,
    withCredentials: false,
});

export default api;