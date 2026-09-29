import mongoose from "mongoose";
import { createHash } from "node:crypto";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Recording from "../models/recording.model.js";
import Meeting from "../models/meeting.model.js";
import ActionItem from "../models/actionItem.model.js";
import { uploadRecordingToCloudinary, deleteRecordingFromCloudinary } from "../services/recording.service.js";
import { transcribeRecording } from "../services/transcription.service.js";
import { generateMeetingInsights } from "../services/ai.service.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const idString = (value) => (value?._id || value)?.toString();

const parseOptionalDate = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }

    return date;
};

const ensureMeetingAccess = async (user, meetingId) => {
    if (!meetingId || !isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting id");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const isHost = meeting.host.toString() === user._id.toString();
    const isParticipant = meeting.participants.some((participantId) => participantId.toString() === user._id.toString());
    const isAdmin = user.role === "admin";

    if (!isHost && !isParticipant && !isAdmin) {
        throw new ApiError(403, "You are not authorized to access this meeting recording");
    }

    return meeting;
};

const createRecording = asyncHandler(async (req, res) => {
    const { meeting, title, description, duration, recordedAt } = req.body;

    if (!meeting || !isValidObjectId(meeting)) {
        throw new ApiError(400, "Valid meeting id is required");
    }

    const meetingDoc = await ensureMeetingAccess(req.user, meeting);

    if (!title || typeof title !== "string" || title.trim() === "") {
        throw new ApiError(400, "Recording title is required");
    }

    let recordingUrl = req.body.recordingUrl || "";
    let publicId = "";

    if (req.file) {
        const uploaded = await uploadRecordingToCloudinary(req.file.path, {
            userId: req.user._id.toString(),
            meetingId: meetingDoc._id.toString(),
        });

        recordingUrl = uploaded?.secure_url || uploaded?.url || recordingUrl;
        publicId = uploaded?.public_id || "";
    }

    if (!recordingUrl) {
        throw new ApiError(400, "Recording file or recordingUrl is required");
    }

    const parsedDuration = Number(duration);
    const finalDuration = Number.isFinite(parsedDuration) && parsedDuration >= 0 ? parsedDuration : 0;

    const recording = await Recording.create({
        meeting: meetingDoc._id,
        recordedBy: req.user._id,
        title: title.trim(),
        description: description ? description.trim() : "",
        recordingUrl: recordingUrl.trim(),
        publicId,
        duration: finalDuration,
        recordedAt: parseOptionalDate(recordedAt, "recordedAt") || new Date(),
    });

    const populatedRecording = await Recording.findById(recording._id)
        .populate("meeting", "title status scheduledAt")
        .populate("recordedBy", "fullName email avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedRecording, "Recording created successfully"));
});

const processRecording = asyncHandler(async (req, res) => {
    const { recordingId } = req.params;

    if (!isValidObjectId(recordingId)) {
        throw new ApiError(400, "Invalid recording id");
    }

    const recording = await Recording.findById(recordingId);
    if (!recording) {
        throw new ApiError(404, "Recording not found");
    }

    if (req.user.role !== "admin" && recording.recordedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to process this recording");
    }

    const meeting = await ensureMeetingAccess(req.user, recording.meeting.toString());
    if (meeting.status !== "completed") {
        throw new ApiError(409, "Recording can only be processed after the meeting has ended");
    }

    const transcript = recording.transcription?.trim() || await transcribeRecording(recording);
    recording.transcription = transcript;
    await recording.save();

    const insights = await generateMeetingInsights({
        transcript,
        meetingTitle: meeting.title,
        meetingDescription: meeting.description,
    });

    recording.summary = insights.summary;
    recording.keyPoints = insights.keyPoints;
    recording.processedAt = new Date();
    meeting.transcription = transcript;
    meeting.summary = insights.summary;
    meeting.keyPoints = insights.keyPoints;

    await Promise.all([recording.save(), meeting.save()]);

    const actionItems = await Promise.all(insights.actionItems.map((item) => {
        const sourceKey = createHash("sha256")
            .update(item.title.toLocaleLowerCase())
            .digest("hex");

        return ActionItem.findOneAndUpdate(
            { recording: recording._id, sourceKey },
            {
                $set: {
                    meeting: meeting._id,
                    title: item.title,
                    description: item.description,
                    source: "ai",
                },
                $setOnInsert: {
                    recording: recording._id,
                    createdBy: recording.recordedBy,
                    status: "open",
                },
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            recording: await Recording.findById(recording._id),
            meeting: {
                _id: meeting._id,
                summary: meeting.summary,
                keyPoints: meeting.keyPoints,
            },
            actionItems,
        }, "Recording transcription and AI insights completed")
    );
});

const getRecordings = asyncHandler(async (req, res) => {
    const filter = req.user.role === "admin" ? {} : { recordedBy: req.user._id };

    const recordings = await Recording.find(filter)
        .populate("meeting", "title status scheduledAt")
        .populate("recordedBy", "fullName email avatar")
        .sort({ recordedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, recordings, "Recordings fetched successfully"));
});

const getRecordingById = asyncHandler(async (req, res) => {
    const { recordingId } = req.params;

    if (!isValidObjectId(recordingId)) {
        throw new ApiError(400, "Invalid recording id");
    }

    const recording = await Recording.findById(recordingId)
        .populate("meeting", "title status scheduledAt")
        .populate("recordedBy", "fullName email avatar");

    if (!recording) {
        throw new ApiError(404, "Recording not found");
    }

    if (req.user.role !== "admin" && idString(recording.recordedBy) !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to access this recording");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, recording, "Recording fetched successfully"));
});

const updateRecording = asyncHandler(async (req, res) => {
    const { recordingId } = req.params;
    const { title, description, duration, recordedAt, recordingUrl } = req.body;

    if (!isValidObjectId(recordingId)) {
        throw new ApiError(400, "Invalid recording id");
    }

    const recording = await Recording.findById(recordingId);

    if (!recording) {
        throw new ApiError(404, "Recording not found");
    }

    if (req.user.role !== "admin" && recording.recordedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this recording");
    }

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new ApiError(400, "Recording title is required");
        }
        recording.title = title.trim();
    }

    if (description !== undefined) {
        recording.description = description ? description.trim() : "";
    }

    if (duration !== undefined) {
        const parsed = Number(duration);
        recording.duration = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    if (recordedAt !== undefined) {
        recording.recordedAt = parseOptionalDate(recordedAt, "recordedAt") || new Date();
    }

    if (recordingUrl !== undefined && recordingUrl !== "") {
        const oldUrl = recording.recordingUrl;

        if (oldUrl && oldUrl !== recordingUrl && recording.publicId) {
            await deleteRecordingFromCloudinary(recording.publicId, recording.recordedBy.toString());
        }

        recording.recordingUrl = recordingUrl.trim();
        recording.publicId = "";
    }

    await recording.save();

    const updatedRecording = await Recording.findById(recording._id)
        .populate("meeting", "title status scheduledAt")
        .populate("recordedBy", "fullName email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedRecording, "Recording updated successfully"));
});

const deleteRecording = asyncHandler(async (req, res) => {
    const { recordingId } = req.params;

    if (!isValidObjectId(recordingId)) {
        throw new ApiError(400, "Invalid recording id");
    }

    const recording = await Recording.findById(recordingId);

    if (!recording) {
        throw new ApiError(404, "Recording not found");
    }

    if (req.user.role !== "admin" && recording.recordedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this recording");
    }

    if (recording.publicId) {
        await deleteRecordingFromCloudinary(recording.publicId, recording.recordedBy.toString());
    }

    await recording.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Recording deleted successfully"));
});

export {
    createRecording,
    processRecording,
    getRecordings,
    getRecordingById,
    updateRecording,
    deleteRecording,
};
