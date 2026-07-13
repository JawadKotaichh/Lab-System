import axios from "axios";

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (error.response?.status === 403) return "You do not have permission to do that.";
    if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
    if (error.message) return `${fallback}: ${error.message}`;
  }
  return error instanceof Error && error.message
    ? `${fallback}: ${error.message}`
    : fallback;
};

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
