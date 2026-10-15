import api from "./api.js";

export const getAIInsights = async () => {
    const response = await api.get(
        "/ai-insights"
    );

    return response.data;
};

export const getAIInsightByMeetingId = async (
    meetingId
) => {
    const response = await api.get(
        `/ai-insights/${meetingId}`
    );

    return response.data;
};

export const processAIInsight = async (
    meetingId
) => {
    const response = await api.post(
        `/ai-insights/${meetingId}/process`
    );

    return response.data;
};