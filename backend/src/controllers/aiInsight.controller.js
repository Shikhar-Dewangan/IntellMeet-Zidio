import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import AIInsight from "../models/aiInsight.model.js";
import Meeting from "../models/meeting.model.js";

const ensureMeetingAccess = async (
    user,
    meetingId
) => {
    const meeting =
        await Meeting.findById(meetingId)
            .select(
                "host participants"
            );

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    const userId =
        user._id.toString();

    const isHost =
        meeting.host.toString() ===
        userId;

    const isParticipant =
        meeting.participants.some(
            (participant) =>
                participant.toString() ===
                userId
        );

    const isAdmin =
        user.role === "admin";

    if (
        !isHost &&
        !isParticipant &&
        !isAdmin
    ) {
        throw new ApiError(
            403,
            "You are not authorized to access AI insights"
        );
    }

    return meeting;
};

const getMeetingAIInsight =
    asyncHandler(async (req, res) => {
        const { meetingId } =
            req.params;

        await ensureMeetingAccess(
            req.user,
            meetingId
        );

        const insight =
            await AIInsight.findOne({
                meeting: meetingId,
            })
                .populate(
                    "meeting",
                    "title description status scheduledAt startedAt endedAt"
                )
                .populate(
                    "recording",
                    "title recordingUrl duration recordedAt"
                );

        if (!insight) {
            throw new ApiError(
                404,
                "AI insights are not available yet"
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                insight,
                "AI insights fetched successfully"
            )
        );
    });

export {
    getMeetingAIInsight,
};