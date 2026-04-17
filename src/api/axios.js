import axios from "axios";
import { toast } from "react-toastify";

const normalizeApiBaseUrl = (rawUrl) => {
  if (!rawUrl) return "/api";

  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const skipGlobalErrorToast = Boolean(error.config?.skipGlobalErrorToast);
    // Normalize backend error shapes: some controllers return { msg: '...' }
    const message =
      error.response?.data?.message || error.response?.data?.msg || "Something went wrong";

    // Ensure downstream code that expects `data.message` sees a value
    if (error.response?.data && !error.response.data.message && error.response.data.msg) {
      error.response.data.message = error.response.data.msg;
    }

    // Auto logout on 401 (expired/invalid token)
    if (status === 401) {
      const currentPath = window.location.pathname;
      // Don't toast on login/register attempts (handled locally)
      if (!currentPath.includes("/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/";
      }
    }

    // Rate limited
    if (status === 429) {
      if (!skipGlobalErrorToast) {
        toast.warning("Too many requests. Please slow down.");
      }
    }

    // Server error
    if (status >= 500) {
      if (!skipGlobalErrorToast) {
        toast.error(message || "Server error. Please try again later.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
