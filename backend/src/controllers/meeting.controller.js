import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Meeting from "../models/meeting.model.js";
import { getSocketServer } from "../sockets/socket.js";
import User from "../models/user.model.js";
import {
    startMeetingLifecycle,
    endMeetingLifecycle,
    scheduleHostInactivityEnd,
    clearHostInactivityEnd,
} from "../services/meeting.service.js";
import { createNotification } from "../services/notification.service.js";
import { processMeetingAI } from "../services/aiInsight.service.js";
import crypto from "crypto";
import { isValidObjectId } from "mongoose";

// Generate a unique meeting code
const generateMeetingCode = () => {
    return crypto.randomBytes(6).toString("hex");
};

const populateMeeting = (query) =>
    query
        .populate("host", "fullName email avatar")
        .populate("participants", "fullName email avatar")
        .populate("invitedUsers.user", "fullName email avatar");


// Create Meeting
const createMeeting = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        scheduledAt,
    } = req.body;

    // Required field validation
    if (!title?.trim()) {
        throw new ApiError(400, "Meeting title is required");
    }

    if (!scheduledAt) {
        throw new ApiError(
            400,
            "Scheduled date and time is required"
        );
    }

    // Validate scheduled date
    const scheduledDate = new Date(scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
        throw new ApiError(
            400,
            "Invalid scheduled date and time"
        );
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

    const createdMeeting = await populateMeeting(
        Meeting.findById(meeting._id)
    );

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
        throw new ApiError(
            400,
            "Invalid meeting ID"
        );
    }

    const meeting = await populateMeeting(
        Meeting.findById(meetingId)
    );

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    const userId = req.user._id.toString();

    const isHost =
        meeting.host?._id?.toString() === userId ||
        meeting.host?.toString() === userId;

    const isParticipant = meeting.participants.some(
        (participant) =>
            (participant?._id?.toString() ||
                participant?.toString()) === userId
    );


    const isAdmin = req.user.role === "admin";

    const isInvited = meeting.invitedUsers?.some(
        (invite) =>
            (invite.user?._id?.toString() || invite.user?.toString()) === userId
    );

    if (!isHost && !isParticipant && !isInvited && !isAdmin) {
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

    const meetings = await populateMeeting(
        Meeting.find({
            $or: [
                { host: userId },
                { participants: userId },

                // Pending / accepted / rejected invitation records
                {
                    "invitedUsers.user": userId,
                },
            ],
        }).sort({
            scheduledAt: 1,
        })
    );

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
        throw new ApiError(
            400,
            "Invalid meeting ID"
        );
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    // Only host can update
    if (
        meeting.host.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Only the meeting host can update this meeting"
        );
    }

    // Completed meetings cannot be edited
    if (meeting.status === "completed") {
        throw new ApiError(
            400,
            "Completed meetings cannot be updated"
        );
    }

    // Cancelled meetings cannot be edited
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

        // Scheduled meeting cannot move into past
        if (
            meeting.status === "scheduled" &&
            scheduledDate <= new Date()
        ) {
            throw new ApiError(
                400,
                "Meeting cannot be scheduled in the past"
            );
        }

        // Cannot change scheduledAt after meeting starts
        if (meeting.status === "live") {
            throw new ApiError(
                400,
                "Scheduled time cannot be changed after the meeting has started"
            );
        }

        meeting.scheduledAt = scheduledDate;
    }

    // Status must be controlled by lifecycle endpoints
    if (status !== undefined) {
        throw new ApiError(
            400,
            "Meeting status cannot be changed directly"
        );
    }

    await meeting.save();

    const updatedMeeting = await populateMeeting(
        Meeting.findById(meeting._id)
    );

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
        throw new ApiError(
            400,
            "Invalid meeting ID"
        );
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    const isHost =
        meeting.host.toString() ===
        req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isHost && !isAdmin) {
        throw new ApiError(
            403,
            "Only the meeting host or system admin can delete this meeting"
        );
    }

    // Live meetings cannot be deleted
    if (meeting.status === "live") {
        throw new ApiError(
            400,
            "Active meeting cannot be deleted"
        );
    }

    // scheduled, completed and cancelled can be deleted
    await Meeting.findByIdAndDelete(meetingId);

    clearHostInactivityEnd(meetingId);

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
        throw new ApiError(
            400,
            "Invalid meeting ID"
        );
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
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

    // Cannot join before scheduled time
    if (
        meeting.status === "scheduled" &&
        new Date() < meeting.scheduledAt
    ) {
        throw new ApiError(
            400,
            "Meeting has not started yet"
        );
    }

    const alreadyParticipant =
        meeting.participants.some(
            (participantId) =>
                participantId.toString() ===
                userId.toString()
        );

    if (alreadyParticipant) {
        throw new ApiError(
            409,
            "You are already a participant in this meeting"
        );
    }

    meeting.participants.push(userId);

    meeting.lastActivityAt = new Date();

    await meeting.save();

    // Someone joined again.
    // Cancel host inactivity shutdown timer.
    clearHostInactivityEnd(meeting._id);

    const updatedMeeting = await populateMeeting(
        Meeting.findById(meeting._id)
    );

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
        throw new ApiError(
            400,
            "Invalid meeting ID"
        );
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    const isHost =
        meeting.host.toString() ===
        userId.toString();

    const isParticipant =
        meeting.participants.some(
            (participantId) =>
                participantId.toString() ===
                userId.toString()
        );

    if (!isParticipant) {
        throw new ApiError(
            400,
            "You are not a participant of this meeting"
        );
    }

    // Host is allowed to leave.
    meeting.participants =
        meeting.participants.filter(
            (participantId) =>
                participantId.toString() !==
                userId.toString()
        );

    meeting.lastActivityAt = new Date();

    await meeting.save();

    const io = getSocketServer();

    if (io) {
        const roomName =
            `meeting:${meeting._id.toString()}`;

        io.to(roomName).emit(
            "participant:left",
            {
                userId: userId.toString(),
                meetingId: meeting._id.toString(),
            }
        );

        const userSockets =
            await io
                .in(`user:${userId.toString()}`)
                .fetchSockets();

        await Promise.all(
            userSockets.map((socket) =>
                socket.leave(roomName)
            )
        );
    }

    /*
     * If host has left and nobody else is active,
     * start the 10-minute server-side inactivity timer.
     */
    if (
        isHost &&
        meeting.participants.length === 0
    ) {
        scheduleHostInactivityEnd(
            meeting._id,
            async (endedMeeting) => {
                getSocketServer()
                    ?.to(
                        `meeting:${endedMeeting._id.toString()}`
                    )
                    .emit(
                        "meeting:ended",
                        {
                            meetingId:
                                endedMeeting._id.toString(),

                            endedBy:
                                "host-inactivity",
                        }
                    );
            }
        );
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

    const meeting =
        await startMeetingLifecycle(
            meetingId,
            req.user._id
        );

    getSocketServer()
        ?.to(
            `meeting:${meeting._id.toString()}`
        )
        .emit(
            "meeting:started",
            {
                meetingId:
                    meeting._id.toString(),

                startedAt:
                    meeting.startedAt,
            }
        );

    const startedMeeting =
        await populateMeeting(
            Meeting.findById(meeting._id)
        );

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

    const meeting =
        await endMeetingLifecycle(
            meetingId,
            req.user._id
        );

    const io = getSocketServer();

    io?.to(
        `meeting:${meeting._id.toString()}`
    ).emit("meeting:ended", {
        meetingId:
            meeting._id.toString(),

        endedBy:
            req.user._id.toString(),
    });

    /*
     * AI is intentionally NOT dependent
     * on recording or live captions.
     *
     * Transcript is generated continuously
     * during the meeting.
     *
     * AI starts after meeting completion.
     *
     * Do not await this here because the user
     * should not wait for OpenAI before receiving
     * the meeting-ended response.
     */
    void processMeetingAI(
        meeting._id
    ).catch((error) => {
        console.error(
            "Background meeting AI processing failed:",
            error.message
        );
    });

    const endedMeeting =
        await Meeting.findById(
            meeting._id
        )
            .populate(
                "host",
                "fullName email avatar"
            )
            .populate(
                "participants",
                "fullName email avatar"
            );

    return res.status(200).json(
        new ApiResponse(
            200,
            endedMeeting,
            "Meeting ended successfully"
        )
    );
});

const inviteUsersToMeeting = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const { userIds } = req.body;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError(400, "At least one user must be selected");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const isHost =
        meeting.host.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isHost && !isAdmin) {
        throw new ApiError(
            403,
            "Only the meeting host or admin can invite users"
        );
    }

    if (meeting.status === "completed") {
        throw new ApiError(
            400,
            "Cannot invite users to a completed meeting"
        );
    }

    if (meeting.status === "cancelled") {
        throw new ApiError(
            400,
            "Cannot invite users to a cancelled meeting"
        );
    }

    const uniqueUserIds = [
        ...new Set(userIds.map((id) => id.toString())),
    ];

    const users = await User.find({
        _id: { $in: uniqueUserIds },
    }).select("_id fullName email avatar");

    if (users.length !== uniqueUserIds.length) {
        throw new ApiError(
            400,
            "One or more selected users do not exist"
        );
    }

    const participantIds = new Set(
        meeting.participants.map((id) => id.toString())
    );

    const invitedUserIds = new Set(
        meeting.invitedUsers.map((invite) =>
            invite.user.toString()
        )
    );

    const newInvitations = [];

    for (const user of users) {
        const userId = user._id.toString();

        if (participantIds.has(userId)) {
            continue;
        }

        if (invitedUserIds.has(userId)) {
            continue;
        }

        newInvitations.push({
            user: user._id,
            status: "pending",
        });
    }

    if (newInvitations.length === 0) {
        throw new ApiError(
            400,
            "All selected users are already participants or invited"
        );
    }

    meeting.invitedUsers.push(...newInvitations);
    await meeting.save();

    // Create notifications for invited users
    const hostName =
        req.user.fullName || req.user.email || "Someone";

    try {
        const notificationPromises = newInvitations.map((invitation) =>
            createNotification({
                recipient: invitation.user,
                type: "meeting_invitation",
                title: "Meeting Invitation",
                message: `${hostName} invited you to "${meeting.title}"`,
                relatedMeeting: meeting._id,
            }),
        );
        await Promise.all(notificationPromises);
    } catch (err) {
        console.error("Failed to create invitation notifications:", err.message);
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                invitedUsers: newInvitations,
            },
            "Meeting invitations sent successfully"
        )
    );
});

const acceptMeetingInvitation = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const userId = req.user._id.toString();

    const invitation = meeting.invitedUsers.find(
        (invite) =>
            (invite.user?._id?.toString() || invite.user?.toString()) ===
            userId
    );

    if (!invitation) {
        throw new ApiError(404, "No invitation found for this meeting");
    }

    if (invitation.status === "accepted") {
        throw new ApiError(400, "Invitation has already been accepted");
    }

    if (invitation.status === "rejected") {
        throw new ApiError(
            400,
            "Invitation has already been rejected. Cannot accept now."
        );
    }

    // Mark invitation as accepted
    invitation.status = "accepted";

    // Add to participants if not already present
    const alreadyParticipant = meeting.participants.some(
        (participantId) => participantId.toString() === userId
    );

    if (!alreadyParticipant) {
        meeting.participants.push(req.user._id);
    }

    await meeting.save();

    const updatedMeeting = await populateMeeting(
        Meeting.findById(meeting._id)
    );

    // Notify host that invitation was accepted
    try {
        const inviteeName = req.user.fullName || req.user.email || "A user";
        await createNotification({
            recipient: meeting.host,
            type: "meeting_invitation",
            title: "Invitation Accepted",
            message: `${inviteeName} accepted your invitation to "${meeting.title}"`,
            relatedMeeting: meeting._id,
        });
    } catch (err) {
        console.error("Failed to notify host:", err.message);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedMeeting,
            "Invitation accepted successfully"
        )
    );
});

const rejectMeetingInvitation = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    if (!isValidObjectId(meetingId)) {
        throw new ApiError(400, "Invalid meeting ID");
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const userId = req.user._id.toString();

    const invitation = meeting.invitedUsers.find(
        (invite) =>
            (invite.user?._id?.toString() || invite.user?.toString()) ===
            userId
    );

    if (!invitation) {
        throw new ApiError(404, "No invitation found for this meeting");
    }

    if (invitation.status === "accepted") {
        throw new ApiError(
            400,
            "Invitation has already been accepted. Cannot reject now."
        );
    }

    if (invitation.status === "rejected") {
        throw new ApiError(400, "Invitation has already been rejected");
    }

    invitation.status = "rejected";

    await meeting.save();

    const updatedMeeting = await populateMeeting(
        Meeting.findById(meeting._id)
    );

    //  Notify host that invitation was rejected
    try {
        const inviteeName = req.user.fullName || req.user.email || "A user";
        await createNotification({
            recipient: meeting.host,
            type: "meeting_invitation",
            title: "Invitation Declined",
            message: `${inviteeName} declined your invitation to "${meeting.title}"`,
            relatedMeeting: meeting._id,
        });
    } catch (err) {
        console.error("Failed to notify host (reject):", err.message);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedMeeting,
            "Invitation rejected successfully"
        )
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedMeeting,
            "Invitation rejected successfully"
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
    endMeeting,
    inviteUsersToMeeting,
    acceptMeetingInvitation,
    rejectMeetingInvitation,
};

