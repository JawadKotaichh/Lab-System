import axios from "axios";

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const context = fallback.replace(/[.!?]+$/, "");
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
        ? `${context}. The request timed out. Please try again.`
        : `${context}. We could not reach the server. Check your connection and try again.`;
    }
    if (status === 401) return String(error.config?.url).includes("/auth/login")
      ? "The username or password is incorrect. Please check both and try again."
      : "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to do that. Please contact an administrator.";
    if (status && status >= 500) return `${context}. The server encountered a problem. Please try again. If it continues, contact an administrator.`;
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const messages = detail.filter(item => item && typeof item === "object").map((item: { loc?: (string | number)[]; msg?: string }) => {
        const field = (Array.isArray(item.loc) ? item.loc : []).filter(part => !["body", "query", "path"].includes(String(part)))
          .map(part => typeof part === "number" ? `item ${part + 1}` : String(part).replace(/_/g, " ")).join(" / ");
        return `${field || "Field"}: ${item.msg || "Check this value."}`;
      });
      if (messages.length) return `Please correct the following: ${messages.join("; ")}`;
    }
    if (status === 404) return `${context}. This record could not be found. Refresh the page and try again.`;
    if (status === 409) return `${context}. This conflicts with an existing record. Refresh and check for duplicates.`;
    if (status === 429) return `${context}. Too many requests. Please wait a moment and try again.`;
    return fallback;
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
