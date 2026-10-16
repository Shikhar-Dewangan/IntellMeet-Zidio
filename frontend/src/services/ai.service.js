// frontend/src/services/ai.service.js
import api from "./api.js";

/**
 * Get AI insight for a specific meeting.
 * Returns structured response with insight + status flags.
 */
export const getMeetingAIInsight = async (meetingId) => {
  const response = await api.get(`/ai-insights/meetings/${meetingId}`);
  return response.data;
};

/**
 * Trigger AI insight generation.
 * Idempotent unless `force: true`.
 */
export const generateMeetingAIInsight = async (
  meetingId,
  { force = false } = {}
) => {
  const response = await api.post(
    `/ai-insights/meetings/${meetingId}/generate`,
    null,
    { params: force ? { force: "true" } : {} }
  );
  return response.data;
};

/**
 * Get transcript segments for a meeting.
 */
export const getMeetingTranscript = async (meetingId) => {
  const response = await api.get(`/transcripts/${meetingId}`);
  return response.data;
};