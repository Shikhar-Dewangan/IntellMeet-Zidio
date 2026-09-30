import api from "./api";
export const getTasks = () => api.get("/tasks");
export const createTask = (payload) => api.post("/tasks", payload);
export const updateTask = (id, payload) => api.patch(`/tasks/${id}`, payload);