import api from "./api.js";

export const uploadTranscriptChunk = async (
  meetingId,
  audioBlob,
  sequence = null,
) => {
  const formData = new FormData();

  formData.append("audio", audioBlob, `chunk-${sequence ?? Date.now()}.webm`);

  if (sequence !== null) {
    formData.append("sequence", String(sequence));
  }

  const now = new Date().toISOString();
  formData.append("startedAt", now);
  formData.append("endedAt", now);

  // ✅ No manual Content-Type — axios sets boundary automatically
  const response = await api.post(
    `/live-transcription/${meetingId}/chunk`,
    formData,
    {
      timeout: 30000, // 30s timeout for transcription
      // No Content-Type header here
    },
  );

  return response.data;
};