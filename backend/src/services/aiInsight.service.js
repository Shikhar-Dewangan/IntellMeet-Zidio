// backend/services/aiInsight.service.js
import AIInsight from "../models/aiInsight.model.js";
import Meeting from "../models/meeting.model.js";

import {
    getMeetingTranscript,
    buildTranscriptText,
} from "./transcript.service.js";

import { generateMeetingInsights } from "./ai.service.js";
import {
    createBulkNotifications,
    createNotification,
} from "./notification.service.js";

const meetingAIJobs = new Map();

/**
 * Process meeting AI.
 *
 * Edge cases handled:
 *   - No transcript                → status "unavailable"
 *   - Groq returns empty summary   → summary "" (status still "completed")
 *   - Groq returns no actionItems  → actionItems [] (status still "completed")
 *   - Groq fails                   → status "failed" with error message
 *   - Already generated            → fast path skip (unless force=true)
 *
 * @param {string} meetingId
 * @param {object} [options]
 * @param {boolean} [options.force] - Regenerate even if saved data exists
 */
const runMeetingAI = async (
    meetingId,
    { force = false, triggeredBy = null } = {}
) => {
    let insight = await AIInsight.findOne({ meeting: meetingId });

    if (!force && insight?.status === "completed") {
        return insight;
    }

    const meeting = await Meeting.findById(meetingId).select(
        "title description host participants status"
    );

    if (!meeting) {
        throw new Error("Meeting not found");
    }

    // Load Deepgram-saved transcript
    const segments = await getMeetingTranscript(meetingId);
    const transcript = buildTranscriptText(segments);

    // Edge case: no transcript at all
    if (!transcript.trim()) {
        insight = await AIInsight.findOneAndUpdate(
            { meeting: meetingId },
            {
                $set: {
                    status: "unavailable",
                    error:
                        "This meeting has no saved transcript, so AI insights cannot be generated.",
                    processedAt: new Date(),
                },
                $setOnInsert: {
                    meeting: meetingId,
                    transcript: "",
                },
            },
            { new: true, upsert: true }
        );
        return insight;
    }

    // Mark processing
    insight = await AIInsight.findOneAndUpdate(
        { meeting: meetingId },
        {
            $set: {
                status: "processing",
                error: "",
                transcript,
            },
            $setOnInsert: { meeting: meetingId },
        },
        { new: true, upsert: true }
    );

    try {
        // Single Groq call
        const result = await generateMeetingInsights({
            transcript,
            meetingTitle: meeting.title,
            meetingDescription: meeting.description,
        });

        // Update summary — even if empty, we save it
        insight.summary =
            typeof result.summary === "string" ? result.summary : "";

        // Update action items — even if empty array, we save it
        insight.actionItems = Array.isArray(result.actionItems)
            ? result.actionItems
            : [];

        // ✅ Edge cases handled:
        //   - Empty summary → still "completed" (frontend shows "No summary generated")
        //   - Empty actionItems → still "completed" (frontend shows "No action items found")
        insight.status = "completed";
        insight.error = "";
        insight.processedAt = new Date();

        await insight.save();

        const hasSummary = Boolean(insight.summary.trim());
        const hasActionItems = insight.actionItems.length > 0;
        const recipientIds = [
            ...new Set([
                meeting.host.toString(),
                ...meeting.participants.map((participant) => participant.toString()),
            ]),
        ].filter((recipient) => recipient !== triggeredBy?.toString());
        if (hasSummary || hasActionItems) {
            const type = hasSummary
                ? "ai_summary_ready"
                : "ai_action_items_ready";
            const title = hasSummary
                ? "AI meeting summary ready"
                : "AI action items ready";
            const message = hasSummary && hasActionItems
                ? `The summary and action items for "${meeting.title}" are ready.`
                : hasSummary
                    ? `The summary for "${meeting.title}" is ready.`
                    : `Action items for "${meeting.title}" are ready.`;
            await createBulkNotifications(
                recipientIds.map((recipient) => ({
                    recipient,
                    actor: triggeredBy,
                    type,
                    title,
                    message,
                    relatedMeeting: meeting._id,
                    entityType: "ai_summary",
                    entityId: meeting._id,
                    actionUrl: `/ai-insights?meeting=${meeting._id}`,
                }))
            );
        }

        return insight;
    } catch (error) {
        console.error("Meeting AI processing failed:", error.message);

        insight.status = "failed";
        insight.error =
            error.message || "AI analysis failed. Please retry.";

        await insight.save();
        await createNotification({
            recipient: triggeredBy || meeting.host,
            actor: triggeredBy,
            type: "ai_summary_failed",
            title: "AI meeting summary failed",
            message: `AI could not generate insights for "${meeting.title}". Please retry.`,
            relatedMeeting: meeting._id,
            entityType: "ai_summary",
            entityId: meeting._id,
            actionUrl: `/ai-insights?meeting=${meeting._id}`,
        });
        throw error;
    }
};

const processMeetingAI = (meetingId, options = {}) => {
    const key = meetingId.toString();
    const existingJob = meetingAIJobs.get(key);
    if (existingJob) return existingJob;

    const job = runMeetingAI(meetingId, options);
    meetingAIJobs.set(key, job);
    const clearJob = () => {
        if (meetingAIJobs.get(key) === job) meetingAIJobs.delete(key);
    };
    job.then(clearJob, clearJob);
    return job;
};

export { processMeetingAI };