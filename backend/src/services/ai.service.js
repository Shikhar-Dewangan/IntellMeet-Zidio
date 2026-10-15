import OpenAI from "openai";

import ApiError from "../utils/ApiError.js";

let openAIClient;

const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new ApiError(
            503,
            "AI service is not configured"
        );
    }

    openAIClient ||= new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    return openAIClient;
};

const generateMeetingInsights = async ({
    transcript,
    meetingTitle = "",
    meetingDescription = "",
}) => {
    if (
        typeof transcript !== "string" ||
        transcript.trim().length < 10
    ) {
        throw new ApiError(
            400,
            "A usable meeting transcription is required"
        );
    }

    try {
        const response =
            await getOpenAIClient()
                .chat.completions.create({
                    model:
                        process.env.OPENAI_MODEL ||
                        "gpt-4o-mini",

                    response_format: {
                        type: "json_object",
                    },

                    messages: [
                        {
                            role: "system",

                            content: `
You are an enterprise meeting intelligence system.

Analyze the provided meeting transcript.

Return ONLY valid JSON.

The JSON MUST contain exactly these top-level keys:

{
  "summary": "",
  "keyPoints": [],
  "decisions": [],
  "actionItems": []
}

Rules:

1. SUMMARY
- Give a concise factual summary.
- Only use information present in the transcript.
- Do not invent facts.
- If the transcript does not contain enough meaningful information for a summary, return an empty string.

2. KEY POINTS
- Extract important topics actually discussed.
- Do not invent topics.
- Return an empty array if there are no meaningful key points.

3. DECISIONS
- Include only decisions explicitly made during the meeting.
- Do not infer a decision from a suggestion.
- Do not invent decisions.
- Return an empty array if there were no explicit decisions.

4. ACTION ITEMS
- Include only explicit tasks, commitments, or follow-up actions.
- Do not invent tasks.
- Do not invent owners.
- Do not invent due dates.
- Each action item must be:
  {
    "title": "",
    "description": ""
  }
- Return an empty array if there are no actionable items.

5. OWNER HANDLING
- Never guess who owns an action item.
- Do not infer ownership from speaker identity.
- User can assign the task later from the UI.

6. LANGUAGE
- Understand the transcript regardless of its language.
- Preserve the meaning of the original conversation.
- Do not translate the entire transcript.

7. HALLUCINATION
- Never add information that is not supported by the transcript.

Return only JSON.
                            `.trim(),
                        },

                        {
                            role: "user",

                            content:
                                JSON.stringify({
                                    meetingTitle:
                                        meetingTitle
                                            .slice(
                                                0,
                                                200
                                            ),

                                    meetingDescription:
                                        meetingDescription
                                            .slice(
                                                0,
                                                2000
                                            ),

                                    transcript:
                                        transcript.slice(
                                            0,
                                            80_000
                                        ),
                                }),
                        },
                    ],
                });

        const content =
            response
                .choices?.[0]
                ?.message
                ?.content;

        let parsed;

        try {
            parsed = JSON.parse(
                content || "{}"
            );
        } catch {
            throw new Error(
                "AI returned invalid JSON"
            );
        }

        // Summary
        const summary =
            typeof parsed.summary ===
            "string"
                ? parsed.summary.trim()
                : "";

        // Key Points
        const keyPoints =
            Array.isArray(
                parsed.keyPoints
            )
                ? parsed.keyPoints
                      .filter(
                          (point) =>
                              typeof point ===
                                  "string" &&
                              point.trim()
                      )
                      .map((point) =>
                          point.trim()
                      )
                      .slice(0, 30)
                : [];

        // Decisions
        const decisions =
            Array.isArray(
                parsed.decisions
            )
                ? parsed.decisions
                      .filter(
                          (decision) =>
                              typeof decision ===
                                  "string" &&
                              decision.trim()
                      )
                      .map((decision) =>
                          decision.trim()
                      )
                      .slice(0, 30)
                : [];

        // Action Items
        const actionItems =
            Array.isArray(
                parsed.actionItems
            )
                ? parsed.actionItems
                      .filter(
                          (item) =>
                              item &&
                              typeof item.title ===
                                  "string" &&
                              item.title.trim()
                      )
                      .map((item) => ({
                          title:
                              item.title
                                  .trim()
                                  .slice(
                                      0,
                                      200
                                  ),

                          description:
                              typeof item.description ===
                              "string"
                                  ? item.description
                                        .trim()
                                        .slice(
                                            0,
                                            2000
                                        )
                                  : "",
                      }))
                      .slice(0, 100)
                : [];

        return {
            summary: summary.slice(
                0,
                10_000
            ),

            keyPoints,

            decisions,

            actionItems,
        };
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        console.error(
            "Meeting insight generation failed:",
            error.message
        );

        throw new ApiError(
            502,
            "Unable to generate meeting insights"
        );
    }
};

export {
    generateMeetingInsights,
};