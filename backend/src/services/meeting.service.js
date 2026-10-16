import mongoose from "mongoose";

import Meeting from "../models/meeting.model.js";
import ApiError from "../utils/ApiError.js";
import { processMeetingAI } from "./aiInsight.service.js";
import { createBulkNotifications } from "./notification.service.js";

const hostInactivityTimers = new Map();

const hostInactivityGraceMs = () => {
    const configuredValue = Number(
        process.env.MEETING_HOST_INACTIVITY_GRACE_MS
    );

    return Number.isFinite(configuredValue) &&
        configuredValue >= 5000
        ? configuredValue
        : 10 * 60 * 1000;
};

const getMeeting = async (meetingId) => {
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
        throw new ApiError(
            400,
            "Invalid meeting ID"
        );
    }

    const meeting =
        await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    return meeting;
};

/*
 * AI processing is intentionally triggered after
 * the meeting becomes completed.
 *
 * Recording is NOT required.
 *
 * processMeetingAI() will:
 * 1. Find the persisted transcript
 * 2. Build the final transcript
 * 3. Generate AI insights
 * 4. Save AIInsight
 * 5. Send notification
 */
const triggerMeetingAI = (meetingId, triggeredBy = null) => {
    void processMeetingAI(meetingId, { triggeredBy }).catch(
        (error) => {
            console.error(
                "Meeting AI processing failed:",
                error.message
            );
        }
    );
};

// Start Meeting
const startMeetingLifecycle = async (
    meetingId,
    hostId
) => {
    const meeting =
        await getMeeting(meetingId);

    if (
        meeting.host.toString() !==
        hostId.toString()
    ) {
        throw new ApiError(
            403,
            "Only the meeting host can start this meeting"
        );
    }

    if (meeting.status === "live") {
        throw new ApiError(
            409,
            "Meeting is already live"
        );
    }

    if (
        meeting.status === "completed" ||
        meeting.status === "cancelled"
    ) {
        throw new ApiError(
            400,
            `A ${meeting.status} meeting cannot be started`
        );
    }

    meeting.status = "live";
    meeting.startedAt = new Date();
    meeting.endedAt = null;
    meeting.lastActivityAt = new Date();

    await meeting.save();

    const hostIdString = hostId.toString();
    const recipients = [
        ...new Set(meeting.participants.map((participant) => participant.toString())),
    ].filter((participantId) => participantId !== hostIdString);
    await createBulkNotifications(
        recipients.map((recipient) => ({
            recipient,
            actor: hostId,
            type: "meeting_started",
            title: "Meeting started",
            message: `"${meeting.title}" has started.`,
            relatedMeeting: meeting._id,
            actionUrl: `/meetings/${meeting._id}/room`,
        }))
    );

    clearHostInactivityEnd(meetingId);

    return meeting;
};

// End Meeting
const endMeetingLifecycle = async (
    meetingId,
    hostId,
    { reason = "host" } = {}
) => {
    const meeting =
        await getMeeting(meetingId);

    /*
     * Normal ending:
     * only host can end.
     *
     * Host inactivity:
     * server can end automatically.
     */
    if (
        reason !== "host-inactivity" &&
        reason !== "auto-end-no-participants" &&
        reason !== "auto-end-no-activity" &&    
        meeting.host.toString() !== hostId?.toString()
    ) {
        throw new ApiError(
            403,
            "Only the meeting host can end this meeting"
        );
    }

    if (meeting.status === "scheduled") {
        throw new ApiError(
            400,
            "Meeting has not started yet"
        );
    }

    if (meeting.status === "completed") {
        throw new ApiError(
            409,
            "Meeting has already ended"
        );
    }

    if (meeting.status === "cancelled") {
        throw new ApiError(
            400,
            "Cancelled meeting cannot be ended"
        );
    }

    if (!meeting.startedAt) {
        throw new ApiError(
            400,
            "Meeting start time is missing"
        );
    }

    const endedAt = new Date();

    if (endedAt < meeting.startedAt) {
        throw new ApiError(
            500,
            "Invalid meeting timing"
        );
    }

    meeting.status = "completed";
    meeting.endedAt = endedAt;

    await meeting.save();

    const actorId = hostId?.toString();
    const recipients = [
        ...new Set(meeting.participants.map((participant) => participant.toString())),
    ].filter((participantId) => !actorId || participantId !== actorId);
    await createBulkNotifications(
        recipients.map((recipient) => ({
            recipient,
            actor: hostId || null,
            type: "meeting_ended",
            title: "Meeting ended",
            message: `"${meeting.title}" has ended.`,
            relatedMeeting: meeting._id,
            actionUrl: `/meetings/${meeting._id}`,
        }))
    );

    clearHostInactivityEnd(meetingId);

    /*
     * IMPORTANT:
     * AI does NOT depend on recording.
     *
     * If recording exists:
     * recording/transcript can be used.
     *
     * If recording does not exist:
     * persisted live transcript is used.
     */
    triggerMeetingAI(meeting._id, hostId);

    return meeting;
};

// Clear inactivity timer
const clearHostInactivityEnd = (
    meetingId
) => {
    const key = meetingId?.toString();

    const timer =
        hostInactivityTimers.get(key);

    if (timer) {
        clearTimeout(timer);

        hostInactivityTimers.delete(key);
    }
};

// Schedule automatic meeting end
const scheduleHostInactivityEnd = (
    meetingId,
    onEnded
) => {
    const key = meetingId?.toString();

    if (!key) {
        return;
    }

    clearHostInactivityEnd(key);

    const timer = setTimeout(
        async () => {
            hostInactivityTimers.delete(
                key
            );

            try {
                const meeting =
                    await endMeetingLifecycle(
                        key,
                        null,
                        {
                            reason:
                                "host-inactivity",
                        }
                    );

                await onEnded?.(
                    meeting
                );
            } catch (error) {
                if (
                    error.statusCode !==
                    409 &&
                    error.statusCode !==
                    404
                ) {
                    console.error(
                        "Unable to end meeting after host inactivity:",
                        error.message
                    );
                }
            }
        },
        hostInactivityGraceMs()
    );

    timer.unref?.();

    hostInactivityTimers.set(
        key,
        timer
    );
};

const touchMeetingActivity = async (meetingId) => {
    if (!meetingId) return;

    try {
        await Meeting.findByIdAndUpdate(
            meetingId,
            { $set: { lastActivityAt: new Date() } },
            { new: false }
        );
    } catch (error) {
        // Log but don't throw — activity tracking is best-effort
        console.error(
            "Failed to touch meeting activity:",
            error.message
        );
    }
};

export {
    startMeetingLifecycle,
    endMeetingLifecycle,
    scheduleHostInactivityEnd,
    clearHostInactivityEnd,
    touchMeetingActivity,
};