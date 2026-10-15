import mongoose from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import MeetingNote from "../models/meetingNote.model.js";
import Meeting from "../models/meeting.model.js";

const isValidMeetingId = (value) => mongoose.Types.ObjectId.isValid(value);

const ensureMeetingAccess = async (user, meetingId) => {
    if (!isValidMeetingId(meetingId)) {
        throw new ApiError(400, "Invalid meeting id");
    }

    const meeting = await Meeting.findById(meetingId)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const isHost = meeting.host?._id?.toString() === user._id.toString();
    const isParticipant = meeting.participants.some((participant) => participant?._id?.toString() === user._id.toString());
    const isAdmin = user.role === "admin";

    if (!isHost && !isParticipant && !isAdmin) {
        throw new ApiError(403, "You are not authorized to access notes for this meeting");
    }

    return meeting;
};

const createMeetingNote = asyncHandler(async (req, res) => {
    const { meetingId, content } = req.body;

    if (!meetingId || !isValidMeetingId(meetingId)) {
        throw new ApiError(400, "Valid meeting id is required");
    }

    const meeting = await ensureMeetingAccess(req.user, meetingId);

    if (!content || typeof content !== "string" || content.trim() === "") {
        throw new ApiError(400, "Note content is required");
    }

    const note = await MeetingNote.create({
        meeting: meeting._id,
        createdBy: req.user._id,
        content: content.trim(),
    });

    const populatedNote = await MeetingNote.findById(note._id)
        .populate("meeting", "title status scheduledAt")
        .populate("createdBy", "fullName email avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedNote, "Meeting note created successfully"));
});

const getMeetingNotes = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    const meeting = await ensureMeetingAccess(req.user, meetingId);

    const notes = await MeetingNote.find({ meeting: meeting._id })
        .populate("meeting", "title status scheduledAt")
        .populate("createdBy", "fullName email avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Meeting notes fetched successfully"));
});

const getMeetingNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, "Invalid note id");
    }

    const note = await MeetingNote.findById(noteId)
        .populate("meeting", "title status scheduledAt host participants")
        .populate("createdBy", "fullName email avatar");

    if (!note) {
        throw new ApiError(404, "Meeting note not found");
    }

    await ensureMeetingAccess(req.user, note.meeting._id.toString());

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Meeting note fetched successfully"));
});

const updateMeetingNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, "Invalid note id");
    }

    const note = await MeetingNote.findById(noteId);

    if (!note) {
        throw new ApiError(404, "Meeting note not found");
    }

    const meeting = await ensureMeetingAccess(req.user, note.meeting.toString());
    const isCreator = note.createdBy.toString() === req.user._id.toString();
    const isHost = meeting.host?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isHost && !isAdmin) {
        throw new ApiError(403, "You are not authorized to update this meeting note");
    }

    if (content !== undefined) {
        if (typeof content !== "string" || content.trim() === "") {
            throw new ApiError(400, "Note content is required");
        }
        note.content = content.trim();
    }

    await note.save();

    const updatedNote = await MeetingNote.findById(note._id)
        .populate("meeting", "title status scheduledAt")
        .populate("createdBy", "fullName email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedNote, "Meeting note updated successfully"));
});

const deleteMeetingNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, "Invalid note id");
    }

    const note = await MeetingNote.findById(noteId);

    if (!note) {
        throw new ApiError(404, "Meeting note not found");
    }

    const meeting = await ensureMeetingAccess(req.user, note.meeting.toString());
    const isCreator = note.createdBy.toString() === req.user._id.toString();
    const isHost = meeting.host?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCreator && !isHost && !isAdmin) {
        throw new ApiError(403, "You are not authorized to delete this meeting note");
    }

    await note.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Meeting note deleted successfully"));
});

export {
    createMeetingNote,
    getMeetingNotes,
    getMeetingNoteById,
    updateMeetingNote,
    deleteMeetingNote,
};