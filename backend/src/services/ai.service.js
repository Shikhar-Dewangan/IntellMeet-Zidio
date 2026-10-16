// backend/services/ai.service.js
import Groq from "groq-sdk";
import ApiError from "../utils/ApiError.js";

let groqClient;

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new ApiError(
            503,
            "AI service is not configured (missing GROQ_API_KEY)"
        );
    }
    groqClient ||= new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
    return groqClient;
};

const AI_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/**
 * Generate meeting summary + action items from transcript
 * using Groq in a SINGLE request.
 *
 * Returns:
 *   {
 *     summary: string,
 *     actionItems: [{ title, description, owner, deadline }]
 *   }
 *
 * Note: This function does NOT generate the transcript.
 * The transcript comes from Deepgram (saved separately).
 */
const generateMeetingInsights = async ({
    transcript,
    meetingTitle = "",
    meetingDescription = "",
}) => {
    if (typeof transcript !== "string" || transcript.trim().length < 10) {
        throw new ApiError(400, "A usable meeting transcription is required");
    }

    try {
        const response = await getGroqClient().chat.completions.create({
            model: AI_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
You are an enterprise meeting intelligence system.

Analyze the provided meeting transcript and return ONLY valid JSON.

The JSON MUST have exactly these two top-level keys:
{
  "summary": "",
  "actionItems": []
}

Rules:

1. SUMMARY
- Provide a concise, factual summary of the meeting.
- Use ONLY information that is explicitly present in the transcript.
- If the transcript does not contain enough meaningful information for a summary, return an empty string "".

2. ACTION ITEMS
- Include ONLY explicit tasks, commitments, or follow-up actions that are stated in the transcript.
- Do NOT invent tasks, owners, or deadlines.
- Each action item MUST be:
  {
    "title": "",
    "description": "",
    "owner": "",
    "deadline": ""
  }
- "title" is REQUIRED and must be short (<= 200 chars).
- "description" is optional; use "" if not described.
- "owner" must be the person explicitly assigned or who committed to the task. If the transcript does NOT explicitly name an owner, use the exact string "Not assigned".
- "deadline" must be a specific date/time or clear timeframe mentioned in the transcript. If no deadline is explicitly mentioned, use the exact string "Not specified".
- Do NOT infer ownership from who spoke. Only assign an owner if the transcript clearly states it.
- Return an empty array [] if there are no actionable items.

3. HALLUCINATION
- Never add information that is not supported by the transcript.
- Never invent meeting attendees, decisions, or dates.

4. LANGUAGE
- Understand the transcript regardless of language.
- Preserve the meaning of the original conversation.
- Do not translate the entire transcript.

Return only the JSON object, nothing else.
                    `.trim(),
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

        let parsed;
        try {
            parsed = JSON.parse(content || "{}");
        } catch {
            throw new ApiError(502, "AI returned invalid JSON");
        }

        // ============ SUMMARY ============
        const summary =
            typeof parsed.summary === "string"
                ? parsed.summary.trim().slice(0, 10_000)
                : "";

        // ============ ACTION ITEMS ============
        const actionItems = Array.isArray(parsed.actionItems)
            ? parsed.actionItems
                  .filter(
                      (item) =>
                          item &&
                          typeof item.title === "string" &&
                          item.title.trim().length > 0
                  )
                  .map((item) => {
                      const ownerRaw =
                          typeof item.owner === "string"
                              ? item.owner.trim()
                              : "";
                      const deadlineRaw =
                          typeof item.deadline === "string"
                              ? item.deadline.trim()
                              : "";

                      return {
                          title: item.title.trim().slice(0, 200),
                          description:
                              typeof item.description === "string"
                                  ? item.description.trim().slice(0, 2000)
                                  : "",
                          owner: ownerRaw || "Not assigned",
                          deadline: deadlineRaw || "Not specified",
                      };
                  })
                  .slice(0, 100)
            : [];

        return { summary, actionItems };
    } catch (error) {
        if (error.statusCode) throw error;

        console.error("Meeting insight generation failed:", error.message);

        throw new ApiError(502, "Unable to generate meeting insights");
    }
};

export { generateMeetingInsights, AI_MODEL };