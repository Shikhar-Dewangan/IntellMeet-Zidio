import api from "./api";
export const getMeetings = () => api.get("/meetings");
export const createMeeting = (payload) => api.post("/meetings", payload);
export const getMeeting = (id) => api.get(`/meetings/${id}`);