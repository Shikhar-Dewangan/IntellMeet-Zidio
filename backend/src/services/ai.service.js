import OpenAI from "openai";

import ApiError from "../utils/ApiError.js";

let openAIClient;
const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new ApiError(503, "AI service is not configured");
    }

    openAIClient ||= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openAIClient;
};

const generateMeetingInsights = async ({ transcript, meetingTitle = "", meetingDescription = "" }) => {
    if (typeof transcript !== "string" || transcript.trim().length < 10) {
        throw new ApiError(400, "A usable meeting transcription is required");
    }

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "Analyze meeting transcripts. Return only valid JSON with keys summary (string), keyPoints (array of strings), actionItems (array of objects with title and description strings). Include only explicit decisions and commitments; do not invent owners or due dates. If there are no action items, return an empty array.",
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        meetingTitle: meetingTitle.slice(0, 200),
                        meetingDescription: meetingDescription.slice(0, 2000),
                        transcript: transcript.slice(0, 80_000),
                    }),
                },
            ],
        });

        const content = response.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content || "{}");
        const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
        const keyPoints = Array.isArray(parsed.keyPoints)
            ? parsed.keyPoints.filter((point) => typeof point === "string" && point.trim()).map((point) => point.trim()).slice(0, 30)
            : [];
        const actionItems = Array.isArray(parsed.actionItems)
            ? parsed.actionItems
                .filter((item) => item && typeof item.title === "string" && item.title.trim())
                .map((item) => ({
                    title: item.title.trim().slice(0, 200),
                    description: typeof item.description === "string" ? item.description.trim().slice(0, 2000) : "",
                }))
                .slice(0, 100)
            : [];

        if (!summary) {
            throw new Error("AI response did not include a summary");
        }

        return { summary: summary.slice(0, 10_000), keyPoints, actionItems };
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        console.error("Meeting insight generation failed:", error.message);
        throw new ApiError(502, "Unable to generate meeting insights");
    }
};

export { generateMeetingInsights };
