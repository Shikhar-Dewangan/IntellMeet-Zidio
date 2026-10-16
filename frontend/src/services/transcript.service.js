import api from "./api.js";

export const createTranscriptSegment = async (
    meetingId,
    transcriptData
) => {
    const response = await api.post(
        `/transcripts/${meetingId}/segments`,
        transcriptData
    );

    return response.data;
};

export const getMeetingTranscript = async (
    meetingId
) => {
    const response = await api.get(
        `/transcripts/${meetingId}`
    );

    return response.data;
};