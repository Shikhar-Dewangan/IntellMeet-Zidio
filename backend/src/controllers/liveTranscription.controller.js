import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Meeting from "../models/meeting.model.js";
import { transcribeAudioChunk } from "../services/transcription.service.js";
import { saveTranscriptSegment } from "../services/transcript.service.js";
import { getSocketServer } from "../sockets/socket.js";
import { readFile } from "node:fs/promises";

/**
 * POST /live-transcription/:meetingId/chunk
 *
 * Receives a 15-second audio chunk from the browser,
 * transcribes it via OpenAI, saves as a transcript segment,
 * and broadcasts via socket to everyone in the meeting.
 */
const uploadLiveTranscriptChunk = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    // 1. Validate meeting ID
    if (!meetingId) {
        throw new ApiError(400, "Meeting ID is required");
    }

    const meeting = await Meeting.findById(meetingId).select(
        "host participants status"
    );

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    if (meeting.status !== "live") {
        throw new ApiError(
            400,
            "Transcript can only be uploaded while the meeting is live"
        );
    }

    // 2. Verify user is host or participant
    const isHost = meeting.host.toString() === userId.toString();
    const isParticipant = meeting.participants.some(
        (p) => p.toString() === userId.toString()
    );

    if (!isHost && !isParticipant) {
        throw new ApiError(
            403,
            "You are not a participant of this meeting"
        );
    }

    // 3. Validate audio file (disk storage → path)
    if (!req.file || !req.file.path) {
        throw new ApiError(400, "Audio chunk is required");
    }

    // 4. Read from disk
    const audioBuffer = await readFile(req.file.path);

    // 5. Transcribe via OpenAI
    const { text, language } = await transcribeAudioChunk({
        buffer: audioBuffer,
        filename: req.file.originalname || "chunk.webm",
    });

    if (!text || !text.trim()) {
        // Empty chunk → silently succeed
        return res.status(200).json(
            new ApiResponse(
                200,
                { text: "", language: null, saved: false },
                "Empty transcript chunk"
            )
        );
    }

    // 6. Save segment
    const sequence = Number(req.body?.sequence) || 0;
    const startedAt = req.body?.startedAt
        ? new Date(req.body.startedAt)
        : new Date();
    const endedAt = req.body?.endedAt
        ? new Date(req.body.endedAt)
        : new Date();

    const segment = await saveTranscriptSegment({
        meetingId,
        speakerId: userId,
        text,
        language,
        sequence,
        startedAt,
        endedAt,
    });

    // 7. Broadcast via socket
    const io = getSocketServer();
    if (io) {
        const speakerName =
            req.user.fullName || req.user.name || "Participant";

        io.to(`meeting:${meetingId.toString()}`).emit(
            "transcript:segment",
            {
                meetingId: meetingId.toString(),
                speakerId: userId.toString(),
                speakerName,
                text: text.trim(),
                language: language || null,
                timestamp: new Date().toISOString(),
                sequence,
            }
        );
    }

    // 8. Respond
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                text: text.trim(),
                language,
                segmentId: segment?._id,
                saved: true,
            },
            "Transcript chunk processed"
        )
    );
});

export { uploadLiveTranscriptChunk as transcribeLiveAudio };