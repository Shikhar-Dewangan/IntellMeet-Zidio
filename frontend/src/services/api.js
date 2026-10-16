import axios from "axios";
import store from "../store/store.js";
import { clearCredentials } from "../store/slices/authSlice.js";

const apiConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000,
};

const api = axios.create(apiConfig);
const refreshClient = axios.create(apiConfig);

// One refresh request at a time per browser tab.
let refreshPromise = null;

const isAuthRequest = (url = "") =>
  /^\/?auth\/(login|register|google|forgot-password|reset-password|refresh-token)(\/|$)/.test(
    url,
  );

const normalizeError = (error) => {
  error.message =
    error.response?.data?.message || error.message || "Request failed";
  return error;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthRequest(request.url)
    ) {
      return Promise.reject(normalizeError(error));
    }

    request._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshClient
        .post("/auth/refresh-token")
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      await refreshPromise;
      // The browser applies the updated HttpOnly cookies automatically.
      return api(request);
    } catch (refreshError) {
      store.dispatch(clearCredentials());
      return Promise.reject(normalizeError(refreshError));
    }
  },
);

export default api;
