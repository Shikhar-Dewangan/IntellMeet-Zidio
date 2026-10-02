import api from "./api.js";

export const createMeeting = async (meetingData) => {
  const response = await api.post("/meetings", meetingData);
  return response.data;
};

export const getMyMeetings = async () => {
  const response = await api.get("/meetings");
  return response.data;
};

export const getMeetingById = async (meetingId) => {
  const response = await api.get(`/meetings/${meetingId}`);
  return response.data;
};

export const updateMeeting = async (meetingId, meetingData) => {
  const response = await api.patch(`/meetings/${meetingId}`, meetingData);
  return response.data;
};

export const deleteMeeting = async (meetingId) => {
  const response = await api.delete(`/meetings/${meetingId}`);
  return response.data;
};

export const startMeeting = async (meetingId) => {
  const response = await api.post(`/meetings/${meetingId}/start`);
  return response.data;
};

export const joinMeeting = async (meetingId) => {
  const response = await api.post(`/meetings/${meetingId}/join`);
  return response.data;
};

export const leaveMeeting = async (meetingId) => {
  const response = await api.post(`/meetings/${meetingId}/leave`);
  return response.data;
};

export const endMeeting = async (meetingId) => {
  const response = await api.post(`/meetings/${meetingId}/end`);
  return response.data;
};
