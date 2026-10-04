import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import Meeting from "../models/meeting.model.js";

import {
    transcribeAudioChunk,
} from "../services/transcription.service.js";

import {
    saveTranscriptSegment,
} from "../services/transcript.service.js";

import {
    getSocketServer,
} from "../sockets/socket.js";

const transcribeLiveAudio =
    asyncHandler(async (req, res) => {
        const { meetingId } =
            req.params;

        if (!req.file) {
            throw new ApiError(
                400,
                "Audio chunk is required"
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
            req.user._id.toString();

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
                "You are not a meeting participant"
            );
        }

        if (meeting.status !== "live") {
            throw new ApiError(
                400,
                "Meeting is not live"
            );
        }

        const text =
            await transcribeAudioChunk(
                req.file
            );

        if (!text) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    null,
                    "No speech detected"
                )
            );
        }

        const sequence =
            Number(req.body.sequence) || 0;

        const startedAt =
            req.body.startedAt
                ? new Date(req.body.startedAt)
                : new Date();

        const endedAt =
            req.body.endedAt
                ? new Date(req.body.endedAt)
                : new Date();

        const segment =
            await saveTranscriptSegment({
                meetingId,
                speakerId:
                    req.user._id,
                text,
                language:
                    req.body.language ||
                    "unknown",
                sequence,
                startedAt,
                endedAt,
            });

        const io =
            getSocketServer();

        io?.to(
            `meeting:${meetingId}`
        ).emit(
            "transcript:segment",
            {
                meetingId,

                speakerId:
                    req.user._id.toString(),

                speakerName:
                    req.user.fullName,

                text: segment.text,

                language:
                    segment.language,

                sequence:
                    segment.sequence,

                timestamp:
                    segment.createdAt,
            }
        );

        return res.status(201).json(
            new ApiResponse(
                201,
                segment,
                "Transcript segment generated successfully"
            )
        );
    });

export {
    transcribeLiveAudio,
};