import { invalidateReferenceData } from "./referenceCache";
import axios, { type InternalAxiosRequestConfig } from "axios";

export const isSessionExpired = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401;

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
let sessionVersion = 0;
type SessionRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _sessionVersion?: number;
};

// Startup checks and 401 recovery must share the same refresh operation.
export function refreshAccessToken(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  const refresh = async () => {
    await api.post("/auth/refresh");
    sessionVersion += 1;
  };
  // Cookies are shared by tabs. Serialize rotation across tabs as well as within
  // this client so concurrent requests cannot replace each other's refresh token.
  const operation = typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request(`lab-session-refresh:${baseURLL}`, refresh)
    : refresh();
  refreshPromise = operation.finally(() => { refreshPromise = null; });
  return refreshPromise;
}

api.interceptors.request.use(config => {
  (config as SessionRequestConfig)._sessionVersion = sessionVersion;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (!["get", "head", "options"].includes(response.config.method ?? "get") &&
        /\/(insurance_company|lab_test_category|financial_transaction|auth|users)(\/|$)/.test(response.config.url ?? "") &&
        !(response.config.url ?? "").includes("/auth/refresh")) invalidateReferenceData();
    return response;
  },
  async (error) => {
    const response = error?.response;
    const originalRequest = error?.config as SessionRequestConfig | undefined;
    const url = String(originalRequest?.url || "");

    if (!response || response.status !== 401) {
      return Promise.reject(error);
    }

    if (url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/logout")) {
      return Promise.reject(error);
    }

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // A delayed 401 may belong to a request sent before a refresh completed.
    // Retry with the new cookie instead of rotating the session again.
    if (originalRequest._sessionVersion === undefined || originalRequest._sessionVersion === sessionVersion) {
      await refreshAccessToken();
    }
    return api(originalRequest);
  }
);

export default api;
