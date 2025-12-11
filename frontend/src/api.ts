import axios from 'axios';
export const baseURLL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: baseURLL,
    withCredentials: false,
});

export default api;