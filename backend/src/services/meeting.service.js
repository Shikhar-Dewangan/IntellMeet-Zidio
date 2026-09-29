import mongoose from "mongoose";

import Meeting from "../models/meeting.model.js";
import ApiError from "../utils/ApiError.js";

const hostInactivityTimers = new Map();

const hostInactivityGraceMs = () => {
    const configuredValue = Number(process.env.MEETING_HOST_INACTIVITY_GRACE_MS);
    return Number.isFinite(configuredValue) && configuredValue >= 5000
        ? configuredValue
        : 60_000;
};

const getMeeting = async (meetingId) => {
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    return meeting;
};

const startMeetingLifecycle = async (meetingId, hostId) => {
    const meeting = await getMeeting(meetingId);

    if (meeting.host.toString() !== hostId.toString()) {
        throw new ApiError(403, "Only the meeting host can start this meeting");
    }

    if (meeting.status === "live") {
        throw new ApiError(409, "Meeting is already live");
    }

    if (meeting.status === "completed" || meeting.status === "cancelled") {
        throw new ApiError(400, `A ${meeting.status} meeting cannot be started`);
    }

    meeting.status = "live";
    meeting.startedAt = new Date();
    meeting.endedAt = null;
    await meeting.save();
    clearHostInactivityEnd(meetingId);

    return meeting;
};

const endMeetingLifecycle = async (meetingId, hostId, { reason = "host" } = {}) => {
    const meeting = await getMeeting(meetingId);

    if (reason !== "host-inactivity" && meeting.host.toString() !== hostId?.toString()) {
        throw new ApiError(403, "Only the meeting host can end this meeting");
    }

    if (meeting.status === "scheduled") {
        throw new ApiError(400, "Meeting has not started yet");
    }

    if (meeting.status === "completed") {
        throw new ApiError(409, "Meeting has already ended");
    }

    if (meeting.status === "cancelled") {
        throw new ApiError(400, "Cancelled meeting cannot be ended");
    }

    if (!meeting.startedAt) {
        throw new ApiError(400, "Meeting start time is missing");
    }

    const endedAt = new Date();
    if (endedAt < meeting.startedAt) {
        throw new ApiError(500, "Invalid meeting timing");
    }

    meeting.status = "completed";
    meeting.endedAt = endedAt;
    await meeting.save();
    clearHostInactivityEnd(meetingId);

    return meeting;
};

const clearHostInactivityEnd = (meetingId) => {
    const key = meetingId?.toString();
    const timer = hostInactivityTimers.get(key);

    if (timer) {
        clearTimeout(timer);
        hostInactivityTimers.delete(key);
    }
};

const scheduleHostInactivityEnd = (meetingId, onEnded) => {
    const key = meetingId?.toString();
    if (!key) {
        return;
    }

    clearHostInactivityEnd(key);

    const timer = setTimeout(async () => {
        hostInactivityTimers.delete(key);

        try {
            const meeting = await endMeetingLifecycle(key, null, { reason: "host-inactivity" });
            await onEnded?.(meeting);
        } catch (error) {
            if (error.statusCode !== 409 && error.statusCode !== 404) {
                console.error("Unable to end meeting after host inactivity:", error.message);
            }
        }
    }, hostInactivityGraceMs());

    timer.unref?.();
    hostInactivityTimers.set(key, timer);
};

export {
    startMeetingLifecycle,
    endMeetingLifecycle,
    scheduleHostInactivityEnd,
    clearHostInactivityEnd,
};
