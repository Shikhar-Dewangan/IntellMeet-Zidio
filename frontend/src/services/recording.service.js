import api from "./api.js";

export const createRecording = async (recordingData) => {
  const formData = new FormData();

  Object.entries(recordingData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await api.post("/recordings", formData);
  return response.data;
};

export const getRecordings = async () => {
  const response = await api.get("/recordings");
  return response.data;
};

export const getRecordingById = async (recordingId) => {
  const response = await api.get(`/recordings/${recordingId}`);
  return response.data;
};

export const updateRecording = async (recordingId, recordingData) => {
  const response = await api.patch(`/recordings/${recordingId}`, recordingData);
  return response.data;
};

export const deleteRecording = async (recordingId) => {
  const response = await api.delete(`/recordings/${recordingId}`);
  return response.data;
};

export const processRecording = async (recordingId) => {
  const response = await api.post(`/recordings/${recordingId}/process`);
  return response.data;
};
