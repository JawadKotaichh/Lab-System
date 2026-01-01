import axios from "axios";

export const baseURLL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: baseURLL,
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error?.response;
    const originalRequest = error?.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const url = String(originalRequest?.url || "");

    if (!response || response.status !== 401) {
      return Promise.reject(error);
    }

    if (url.includes("/auth/login") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post("/auth/refresh").then(() => undefined);
      }
      await refreshPromise;
      refreshPromise = null;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      return Promise.reject(refreshError);
    }
  }
);

export default api;
