import api from "./api.js";

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh-token");
  return response.data;
};

export const googleAuth = async (idToken) => {
  const response = await api.post("/auth/google", { idToken });
  return response.data?.data ?? response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (resetData) => {
  const response = await api.post("/auth/reset-password", resetData);
  return response.data;
};
