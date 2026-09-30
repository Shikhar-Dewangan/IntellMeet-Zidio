import api from "./api";
export const login = (payload) => api.post("/auth/login", payload);
export const signup = (payload) => api.post("/auth/signup", payload);
export const getProfile = () => api.get("/auth/me");