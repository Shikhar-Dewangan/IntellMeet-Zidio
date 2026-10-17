import MeetingTranscript from "../models/meetingTranscript.model.js";
import Meeting from "../models/meeting.model.js";
import ApiError from "../utils/ApiError.js";

// ----------------------------------------------------
// Save Live Transcript Segment
// ----------------------------------------------------

const saveTranscriptSegment = async ({
    meetingId,
    speakerId,
    text,
    language,
    sequence,
    startedAt,
    endedAt,
}) => {
    if (
        !meetingId ||
        !speakerId ||
        !text?.trim()
    ) {
        throw new ApiError(
            400,
            "Transcript segment data is incomplete"
        );
    }

    const meeting =
        await Meeting.findById(
            meetingId
        ).select(
            "host participants status"
        );

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    const userId =
        speakerId.toString();

    // ------------------------------------------------
    // Verify speaker is actually a meeting member
    // ------------------------------------------------

    const isHost =
        meeting.host.toString() ===
        userId;

    const isParticipant =
        meeting.participants.some(
            (participant) =>
                participant.toString() ===
                userId
        );

    if (
        !isHost &&
        !isParticipant
    ) {
        throw new ApiError(
            403,
            "Speaker is not a participant of this meeting"
        );
    }

    // ------------------------------------------------
    // Live transcription is captured during meeting
    // ------------------------------------------------

    if (
        meeting.status !==
        "live"
    ) {
        throw new ApiError(
            400,
            "Transcript can only be stored while the meeting is live"
        );
    }

    // ------------------------------------------------
    // Validate timestamps
    // ------------------------------------------------

    const startTime =
        startedAt
            ? new Date(startedAt)
            : new Date();

    const endTime =
        endedAt
            ? new Date(endedAt)
            : new Date();

    if (
        Number.isNaN(
            startTime.getTime()
        )
    ) {
        throw new ApiError(
            400,
            "Invalid transcript start time"
        );
    }

    if (
        Number.isNaN(
            endTime.getTime()
        )
    ) {
        throw new ApiError(
            400,
            "Invalid transcript end time"
        );
    }

    if (
        endTime < startTime
    ) {
        throw new ApiError(
            400,
            "Transcript end time cannot be before start time"
        );
    }

    // ------------------------------------------------
    // Save segment
    // ------------------------------------------------

    const segment =
        await MeetingTranscript.create(
            {
                meeting:
                    meeting._id,

                speaker:
                    speakerId,

                text:
                    text.trim(),

                language:
                    typeof language ===
                        "string" &&
                    language.trim()
                        ? language.trim()
                        : "unknown",

                /*
                 * Sequence is optional metadata.
                 * Do not depend on it for global ordering
                 * because multiple participants can generate
                 * segments concurrently.
                 */
                sequence:
                    Number.isFinite(
                        sequence
                    )
                        ? sequence
                        : 0,

                startedAt:
                    startTime,

                endedAt:
                    endTime,
            }
        );

    return segment;
};

// ----------------------------------------------------
// Get Meeting Transcript
// ----------------------------------------------------

const getMeetingTranscript = async (
    meetingId
) => {
    if (!meetingId) {
        throw new ApiError(
            400,
            "Meeting id is required"
        );
    }

    const segments =
        await MeetingTranscript.find(
            {
                meeting:
                    meetingId,
            }
        )
            .populate(
                "speaker",
                "fullName avatar"
            )
            .sort({
                startedAt: 1,
                createdAt: 1,
            })
            .lean();

    return segments;
};

// ----------------------------------------------------
// Build AI-ready Transcript Text
// ----------------------------------------------------

const buildTranscriptText = (
    segments
) => {
    if (
        !Array.isArray(
            segments
        ) ||
        segments.length === 0
    ) {
        return "";
    }

    return segments
        .map(
            (segment) => {
                const speakerName =
                    segment.speaker
                        ?.fullName ||
                    "Unknown Speaker";

                const text =
                    segment.text?.trim();

                if (!text) {
                    return null;
                }

                return `${speakerName}: ${text}`;
            }
        )
        .filter(Boolean)
        .join("\n");
};

// ----------------------------------------------------
// Get AI-ready transcript directly
// ----------------------------------------------------

const getMeetingTranscriptText =
    async (meetingId) => {
        const segments =
            await getMeetingTranscript(
                meetingId
            );

        return buildTranscriptText(
            segments
        );
    };

export {
    saveTranscriptSegment,
    getMeetingTranscript,
    buildTranscriptText,
    getMeetingTranscriptText,
};