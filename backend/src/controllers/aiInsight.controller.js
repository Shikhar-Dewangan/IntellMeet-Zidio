// backend/controllers/aiInsight.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import AIInsight from "../models/aiInsight.model.js";
import Meeting from "../models/meeting.model.js";

import { processMeetingAI } from "../services/aiInsight.service.js";

/* ============================================================
   Meeting access check
   ============================================================ */
const ensureMeetingAccess = async (user, meetingId) => {
    const meeting = await Meeting.findById(meetingId).select(
        "host participants status"
    );

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const userId = user._id.toString();
    const isHost = meeting.host.toString() === userId;
    const isParticipant = meeting.participants.some(
        (participant) => participant.toString() === userId
    );
    const isAdmin = user.role === "admin";

    if (!isHost && !isParticipant && !isAdmin) {
        throw new ApiError(
            403,
            "You are not authorized to access AI insights"
        );
    }

    return meeting;
};

/* ============================================================
   GET /ai-insights/meetings/:meetingId
   ------------------------------------------------------------
   Returns structured response with:
     - insight: AIInsight doc or null
     - status: "not_generated" | "pending" | "processing" |
               "completed" | "failed" | "unavailable"
     - message: user-friendly message
     - hasSummary, hasActionItems, hasTranscript: booleans
   ============================================================ */
const getMeetingAIInsight = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    await ensureMeetingAccess(req.user, meetingId);

    const insight = await AIInsight.findOne({ meeting: meetingId })
        .populate(
            "meeting",
            "title description status scheduledAt startedAt endedAt"
        )
        .lean();

    // Not generated yet
    if (!insight) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    insight: null,
                    status: "not_generated",
                    message: "AI insights have not been generated yet.",
                    hasSummary: false,
                    hasActionItems: false,
                    hasTranscript: false,
                },
                "AI insights not generated yet"
            )
        );
    }

    // Friendly message based on state
    let message = "AI insights fetched successfully";
    const state = insight.status;

    if (insight.status === "unavailable") {
        message =
            "This meeting has no transcript, so AI insights cannot be generated.";
    } else if (insight.status === "failed") {
        message = insight.error || "AI generation failed. Please retry.";
    } else if (
        insight.status === "completed" &&
        (!insight.actionItems || insight.actionItems.length === 0)
    ) {
        message = "No action items were found in this meeting.";
    } else if (
        insight.status === "completed" &&
        (!insight.summary || insight.summary.trim() === "")
    ) {
        message = "No summary could be generated for this meeting.";
    }

    const hasSummary =
        insight.status === "completed" && !!insight.summary?.trim();

    const hasActionItems =
        insight.status === "completed" &&
        Array.isArray(insight.actionItems) &&
        insight.actionItems.length > 0;

    const hasTranscript = !!insight.transcript?.trim();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                insight,
                status: state,
                message,
                hasSummary,
                hasActionItems,
                hasTranscript,
            },
            "AI insights fetched successfully"
        )
    );
});

/* ============================================================
   POST /ai-insights/meetings/:meetingId/generate
   ------------------------------------------------------------
   - Idempotent (skips if summary + actionItems exist)
   - ?force=true to regenerate
   - Only allowed after meeting ends (not live/scheduled)
   ============================================================ */
const generateMeetingAIInsight = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const force = req.query.force === "true";

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    // Access check
    await ensureMeetingAccess(req.user, meetingId);

    // Only after meeting ends
    if (meeting.status === "live") {
        throw new ApiError(
            409,
            "AI insights can only be generated after the meeting has ended"
        );
    }
    if (meeting.status === "scheduled") {
        throw new ApiError(409, "Meeting has not started yet");
    }

    try {
        const insight = await processMeetingAI(meetingId, {
            force,
            triggeredBy: req.user._id,
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                insight,
                force
                    ? "AI insights regenerated successfully"
                    : "AI insights generated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            502,
            error.message || "Unable to generate AI insights"
        );
    }
});

export { getMeetingAIInsight, generateMeetingAIInsight };