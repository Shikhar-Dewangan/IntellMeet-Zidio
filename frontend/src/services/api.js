import axios from "axios";
import store from "../store/store.js";
import { clearCredentials } from "../store/slices/authSlice.js";

const apiConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
};

const api = axios.create(apiConfig);
const refreshClient = axios.create(apiConfig);

let refreshPromise = null;
let logoutInProgress = false;

export const setLogoutInProgress = (value) => {
  logoutInProgress = Boolean(value);
};

const isAuthRequest = (url = "") =>
  /^\/?auth\/(login|register|google|logout|forgot-password|reset-password|refresh-token)(\/|$)/i.test(
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

    // Never refresh or change auth state as a side effect of logout.
    if (logoutInProgress) {
      return Promise.reject(normalizeError(error));
    }

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthRequest(request.url)
    ) {
      return Promise.reject(normalizeError(error));
    }

    request._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/auth/refresh-token")
          .finally(() => {
            refreshPromise = null;
          });
      }

      await refreshPromise;

      // If logout began while refresh was in flight, do not replay old requests.
      if (logoutInProgress) {
        return Promise.reject(new Error("Logout in progress"));
      }

      return api(request);
    } catch (refreshError) {
      if (!logoutInProgress) {
        store.dispatch(clearCredentials());
      }
      return Promise.reject(normalizeError(refreshError));
    }
  },
);

export default api;
