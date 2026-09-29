import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Meeting from "../models/meeting.model.js";
import { getSocketServer } from "../sockets/socket.js";
import { startMeetingLifecycle, endMeetingLifecycle } from "../services/meeting.service.js";
import crypto from "crypto"
import { isValidObjectId } from "mongoose";


// Generate a unique meeting code
const generateMeetingCode = () => {
    return crypto.randomBytes(6).toString("hex");
};


// Create Meeting
const createMeeting = asyncHandler(async (req, res) => {

    const { title, description, scheduledAt } = req.body;

    // Required field validation
    if (!title?.trim()) {
        throw new ApiError(400, "Meeting title is required");
    }

    if (!scheduledAt) {
        throw new ApiError(400, "Scheduled date and time is required");
    }

    // Validate scheduled date
    const scheduledDate = new Date(scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
        throw new ApiError(400, "Invalid scheduled date and time");
    }

    // Do not allow meetings to be scheduled in the past
    if (scheduledDate <= new Date()) {
        throw new ApiError(
            400,
            "Meeting cannot be scheduled in the past"
        );
    }

    // Generate a unique meeting code
    let meetingCode;
    let existingMeeting;

    do {
        meetingCode = generateMeetingCode();

        existingMeeting = await Meeting.findOne({
            meetingCode,
        });
    } while (existingMeeting);

    // Create meeting
    const meeting = await Meeting.create({
        title: title.trim(),
        description: description?.trim() || "",
        host: req.user._id,

        // Host is initially a participant as well
        participants: [req.user._id],
        meetingCode,
        status: "scheduled",
        scheduledAt: scheduledDate,
    });

    const createdMeeting = await Meeting.findById(meeting._id)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    return res.status(201).json(
        new ApiResponse(
            201,
            createdMeeting,
            "Meeting created successfully"
        )
    );

});

// Get Meeting By ID
const getMeetingById = asyncHandler(async (req, res) => {

    const { meetingId } = req.params;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const userId = req.user._id.toString();
    const isHost = meeting.host?._id?.toString() === userId || meeting.host?.toString() === userId;
    const isParticipant = meeting.participants.some((participant) =>
        (participant?._id?.toString() || participant?.toString()) === userId
    );

    if (!isHost && !isParticipant && req.user.role !== "admin") {
        throw new ApiError(403, "You are not authorized to access this meeting");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            meeting,
            "Meeting fetched successfully"
        )
    );

});

// Get My Meetings
const getMyMeetings = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const meetings = await Meeting.find({
        $or: [
            { host: userId },
            { participants: userId },
        ],
    })
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar")
        .sort({ scheduledAt: 1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            meetings,
            "Meetings fetched successfully"
        )
    );

});

// Update Meeting
const updateMeeting = asyncHandler(async (req, res) => {

    const { meetingId } = req.params;
    const {
        title,
        description,
        scheduledAt,
        status,
    } = req.body;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    // Only host can update the meeting
    if (
        meeting.host.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Only the meeting host can update this meeting"
        );
    }

    // Do not allow updates after meeting has ended
    if (meeting.status === "completed") {
        throw new ApiError(
            400,
            "Completed meetings cannot be updated"
        );
    }

    // Do not allow updates to cancelled meetings
    if (meeting.status === "cancelled") {
        throw new ApiError(
            400,
            "Cancelled meetings cannot be updated"
        );
    }

    // Title
    if (title !== undefined) {
        if (!title.trim()) {
            throw new ApiError(
                400,
                "Meeting title cannot be empty"
            );
        }

        meeting.title = title.trim();
    }

    // Description
    if (description !== undefined) {
        meeting.description = description.trim();
    }

    // Scheduled time
    if (scheduledAt !== undefined) {
        const scheduledDate = new Date(scheduledAt);

        if (Number.isNaN(scheduledDate.getTime())) {
            throw new ApiError(
                400,
                "Invalid scheduled date and time"
            );
        }

        // A scheduled meeting cannot be moved into the past
        if (
            meeting.status === "scheduled" &&
            scheduledDate <= new Date()
        ) {
            throw new ApiError(
                400,
                "Meeting cannot be scheduled in the past"
            );
        }

        // Once meeting has started, scheduledAt shouldn't change
        if (meeting.status === "live") {
            throw new ApiError(
                400,
                "Scheduled time cannot be changed after the meeting has started"
            );
        }

        meeting.scheduledAt = scheduledDate;
    }

    // Status should NOT normally be changed directly here.
    // Lifecycle should be controlled by startMeeting/endMeeting.
    if (status !== undefined) {
        throw new ApiError(
            400,
            "Meeting status cannot be changed directly"
        );
    }

    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedMeeting,
            "Meeting updated successfully"
        )
    );

});

// Delete Meeting
const deleteMeeting = asyncHandler(async (req, res) => {

    const { meetingId } = req.params;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    // Only host can delete
    if (
        meeting.host.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Only the meeting host can delete this meeting"
        );
    }

    // Do not delete an active meeting
    if (meeting.status === "live") {
        throw new ApiError(
            400,
            "Active meeting cannot be deleted"
        );
    }

    // Already completed
    if (meeting.status === "completed") {
        throw new ApiError(
            400,
            "Completed meeting cannot be deleted"
        );
    }

    await Meeting.findByIdAndDelete(meetingId);

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Meeting deleted successfully"
        )
    );

});

// Join Meeting
const joinMeeting = asyncHandler(async (req, res) => {

    const { meetingId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    // Cannot join cancelled meeting
    if (meeting.status === "cancelled") {
        throw new ApiError(
            400,
            "Cannot join a cancelled meeting"
        );
    }

    // Cannot join completed meeting
    if (meeting.status === "completed") {
        throw new ApiError(
            400,
            "Cannot join a completed meeting"
        );
    }

    // Do not allow joining before scheduled time
    if (
        meeting.status === "scheduled" &&
        new Date() < meeting.scheduledAt
    ) {
        throw new ApiError(
            400,
            "Meeting has not started yet"
        );
    }

    // Check if user already joined
    const alreadyParticipant = meeting.participants.some(
        (participantId) =>
            participantId.toString() === userId.toString()
    );

    if (alreadyParticipant) {
        throw new ApiError(
            409,
            "You are already a participant in this meeting"
        );
    }

    meeting.participants.push(userId);

    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedMeeting,
            "Joined meeting successfully"
        )
    );

});

// Leave Meeting
const leaveMeeting = asyncHandler(async (req, res) => {

    const { meetingId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    // Host cannot leave their own meeting
    if (meeting.host.toString() === userId.toString()) {
        throw new ApiError(
            400,
            "Meeting host cannot leave the meeting"
        );
    }

    const isParticipant = meeting.participants.some(
        (participantId) =>
            participantId.toString() === userId.toString()
    );

    if (!isParticipant) {
        throw new ApiError(
            400,
            "You are not a participant of this meeting"
        );
    }

    meeting.participants = meeting.participants.filter(
        (participantId) =>
            participantId.toString() !== userId.toString()
    );

    await meeting.save();

    const io = getSocketServer();
    if (io) {
        const roomName = `meeting:${meeting._id.toString()}`;
        io.to(roomName).emit("participant:left", {
            userId: userId.toString(),
            meetingId: meeting._id.toString(),
        });

        const userSockets = await io.in(`user:${userId.toString()}`).fetchSockets();
        await Promise.all(userSockets.map((socket) => socket.leave(roomName)));
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Left meeting successfully"
        )
    );

});

// Start Meeting
const startMeeting = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const meeting = await startMeetingLifecycle(meetingId, req.user._id);

    getSocketServer()?.to(`meeting:${meeting._id.toString()}`).emit("meeting:started", {
        meetingId: meeting._id.toString(),
        startedAt: meeting.startedAt,
    });

    const startedMeeting = await Meeting.findById(meeting._id)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            startedMeeting,
            "Meeting started successfully"
        )
    );
});


// End Meeting
const endMeeting = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const meeting = await endMeetingLifecycle(meetingId, req.user._id);

    getSocketServer()?.to(`meeting:${meeting._id.toString()}`).emit("meeting:ended", {
        meetingId: meeting._id.toString(),
        endedBy: req.user._id.toString(),
    });

    const endedMeeting = await Meeting.findById(meeting._id)
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            endedMeeting,
            "Meeting ended successfully"
        )
    );
});

export {
    createMeeting,
    getMeetingById,
    getMyMeetings,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    leaveMeeting,
    startMeeting,
    endMeeting
};