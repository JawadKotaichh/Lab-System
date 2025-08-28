import axios from 'axios';
const api = import.meta.env.VITE_API_BASE_URL || "/api";

// const api = axios.create({
//     baseURL: "http://localhost:8000"
// });

export default api;