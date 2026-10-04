import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import {
    saveTranscriptSegment,
    getMeetingTranscript,
} from "../services/transcript.service.js";

const createTranscriptSegment = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    const {
        text,
        language,
        sequence,
        startedAt,
        endedAt,
    } = req.body;

    const segment = await saveTranscriptSegment({
        meetingId,
        speakerId: req.user._id,
        text,
        language,
        sequence,
        startedAt,
        endedAt,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            segment,
            "Transcript segment saved successfully"
        )
    );
});

const fetchMeetingTranscript = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    if (!meetingId) {
        throw new ApiError(400, "Meeting ID is required");
    }

    const segments = await getMeetingTranscript(meetingId);

    return res.status(200).json(
        new ApiResponse(
            200,
            segments,
            "Meeting transcript fetched successfully"
        )
    );
});

export {
    createTranscriptSegment,
    fetchMeetingTranscript,
};