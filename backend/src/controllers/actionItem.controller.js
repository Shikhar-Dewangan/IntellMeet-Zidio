import mongoose from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import ActionItem from "../models/actionItem.model.js";
import Meeting from "../models/meeting.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import Recording from "../models/recording.model.js";
import Task from "../models/task.model.js";

const validStatus = ["open", "completed"];
const validSource = ["manual", "ai"];

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
        throw new ApiError(403, "You are not authorized to access this meeting");
    }

    return meeting;
};

const ensureProjectAccess = async (user, projectId) => {
    if (!projectId || !isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isAdmin = user.role === "admin";
    const isOwner = project.owner.toString() === user._id.toString();
    const isMember = project.members.some((memberId) => memberId.toString() === user._id.toString());

    if (!isAdmin && !isOwner && !isMember) {
        throw new ApiError(403, "You do not have access to this project");
    }

    return project;
};

const ensureRecordingAccess = async (user, recordingId, meetingId) => {
    const recording = await Recording.findById(recordingId);

    if (!recording) {
        throw new ApiError(404, "Recording not found");
    }

    await ensureMeetingAccess(user, recording.meeting.toString());

    const expectedMeetingId = meetingId?._id || meetingId;
    if (expectedMeetingId && recording.meeting.toString() !== expectedMeetingId.toString()) {
        throw new ApiError(400, "Recording belongs to a different meeting");
    }

    return recording;
};

const ensureActionItemAccess = async (user, actionItem) => {
    const isAdmin = user.role === "admin";
    const isCreator = idString(actionItem.createdBy) === user._id.toString();
    const isAssignee = actionItem.assignee && idString(actionItem.assignee) === user._id.toString();

    let projectAccess = false;
    if (actionItem.project) {
        const projectId = actionItem.project?._id || actionItem.project;
        const project = await ensureProjectAccess(user, projectId.toString());
        projectAccess = !!project;
    }

    let meetingAccess = false;
    if (actionItem.meeting) {
        const meetingId = actionItem.meeting?._id || actionItem.meeting;
        const meeting = await ensureMeetingAccess(user, meetingId.toString());
        meetingAccess = !!meeting;
    }

    let recordingAccess = false;
    if (actionItem.recording) {
        const recordingId = actionItem.recording?._id || actionItem.recording;
        const recording = await ensureRecordingAccess(user, recordingId.toString(), actionItem.meeting?._id || actionItem.meeting);
        recordingAccess = !!recording;
    }

    if (!isAdmin && !isCreator && !isAssignee && !projectAccess && !meetingAccess && !recordingAccess) {
        throw new ApiError(403, "You are not authorized to access this action item");
    }

    return {
        isAdmin,
        isCreator,
        isAssignee,
    };
};

const createActionItem = asyncHandler(async (req, res) => {
    const {
        meeting,
        recording,
        project,
        title,
        description,
        assignee,
        dueDate,
        status,
        source,
    } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
        throw new ApiError(400, "Action item title is required");
    }

    if (!meeting && !project) {
        throw new ApiError(400, "Action item must belong to a meeting or project");
    }

    if (meeting && !isValidObjectId(meeting)) {
        throw new ApiError(400, "Invalid meeting id");
    }

    if (project && !isValidObjectId(project)) {
        throw new ApiError(400, "Invalid project id");
    }

    if (recording && !isValidObjectId(recording)) {
        throw new ApiError(400, "Invalid recording id");
    }

    if (meeting) {
        await ensureMeetingAccess(req.user, meeting);
    }

    if (recording) {
        await ensureRecordingAccess(req.user, recording, meeting);
    }

    if (project) {
        await ensureProjectAccess(req.user, project);
    }

    if (assignee && !isValidObjectId(assignee)) {
        throw new ApiError(400, "Invalid assignee id");
    }

    if (assignee) {
        const assigneeUser = await User.findById(assignee);
        if (!assigneeUser) {
            throw new ApiError(404, "Assignee not found");
        }

        if (project) {
            const projectDoc = await Project.findById(project);
            const allowed = projectDoc.owner.toString() === assigneeUser._id.toString()
                || projectDoc.members.some((memberId) => memberId.toString() === assigneeUser._id.toString());

            if (!allowed && req.user.role !== "admin") {
                throw new ApiError(403, "Assignee must belong to the project");
            }
        }
    }

    if (status && !validStatus.includes(status)) {
        throw new ApiError(400, "Invalid action item status");
    }

    if (source && !validSource.includes(source)) {
        throw new ApiError(400, "Invalid action item source");
    }

    const actionItem = await ActionItem.create({
        meeting: meeting || null,
        recording: recording || null,
        project: project || null,
        title: title.trim(),
        description: description ? description.trim() : "",
        assignee: assignee || null,
        dueDate: parseOptionalDate(dueDate, "dueDate") || null,
        status: status || "open",
        createdBy: req.user._id,
        source: source || "manual",
    });

    const populatedActionItem = await ActionItem.findById(actionItem._id)
        .populate("meeting", "title status scheduledAt")
        .populate("recording", "title recordingUrl")
        .populate("project", "name status")
        .populate("assignee", "fullName email avatar")
        .populate("createdBy", "fullName email avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedActionItem, "Action item created successfully"));
});

const getActionItems = asyncHandler(async (req, res) => {
    const { meetingId, projectId, status } = req.query;

    const filter = {};

    if (meetingId) {
        if (!isValidObjectId(meetingId)) {
            throw new ApiError(400, "Invalid meeting id");
        }
        await ensureMeetingAccess(req.user, meetingId);
        filter.meeting = meetingId;
    }

    if (projectId) {
        if (!isValidObjectId(projectId)) {
            throw new ApiError(400, "Invalid project id");
        }
        await ensureProjectAccess(req.user, projectId);
        filter.project = projectId;
    }

    if (status && !validStatus.includes(status)) {
        throw new ApiError(400, "Invalid action item status");
    }

    if (status) {
        filter.status = status;
    }

    if (!meetingId && !projectId && req.user.role !== "admin") {
        const accessibleProjectIds = await Project.find(
            { $or: [{ owner: req.user._id }, { members: req.user._id }] },
            { _id: 1 }
        );

        const accessibleMeetingIds = await Meeting.find(
            { $or: [{ host: req.user._id }, { participants: req.user._id }] },
            { _id: 1 }
        );

        filter.$or = [
            { createdBy: req.user._id },
            { assignee: req.user._id },
            { project: { $in: accessibleProjectIds.map((item) => item._id) } },
            { meeting: { $in: accessibleMeetingIds.map((item) => item._id) } },
        ];
    }

    const actionItems = await ActionItem.find(filter)
        .populate("meeting", "title status scheduledAt")
        .populate("recording", "title recordingUrl")
        .populate("project", "name status")
        .populate("assignee", "fullName email avatar")
        .populate("createdBy", "fullName email avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, actionItems, "Action items fetched successfully"));
});

const getActionItemById = asyncHandler(async (req, res) => {
    const { actionItemId } = req.params;

    if (!isValidObjectId(actionItemId)) {
        throw new ApiError(400, "Invalid action item id");
    }

    const actionItem = await ActionItem.findById(actionItemId)
        .populate("meeting", "title status scheduledAt")
        .populate("recording", "title recordingUrl")
        .populate("project", "name status")
        .populate("assignee", "fullName email avatar")
        .populate("createdBy", "fullName email avatar");

    if (!actionItem) {
        throw new ApiError(404, "Action item not found");
    }

    await ensureActionItemAccess(req.user, actionItem);

    return res
        .status(200)
        .json(new ApiResponse(200, actionItem, "Action item fetched successfully"));
});

const updateActionItem = asyncHandler(async (req, res) => {
    const { actionItemId } = req.params;
    const {
        meeting,
        recording,
        project,
        title,
        description,
        assignee,
        dueDate,
        status,
        source,
    } = req.body;

    if (!isValidObjectId(actionItemId)) {
        throw new ApiError(400, "Invalid action item id");
    }

    const actionItem = await ActionItem.findById(actionItemId);

    if (!actionItem) {
        throw new ApiError(404, "Action item not found");
    }

    const auth = await ensureActionItemAccess(req.user, actionItem);

    if (!auth.isAdmin && !auth.isCreator && !auth.isAssignee) {
        throw new ApiError(403, "You are not allowed to update this action item");
    }

    if (meeting !== undefined) {
        if (meeting === null || meeting === "") {
            actionItem.meeting = null;
        } else {
            if (!isValidObjectId(meeting)) {
                throw new ApiError(400, "Invalid meeting id");
            }
            await ensureMeetingAccess(req.user, meeting);
            actionItem.meeting = meeting;
        }
    }

    if (project !== undefined) {
        if (project === null || project === "") {
            actionItem.project = null;
        } else {
            if (!isValidObjectId(project)) {
                throw new ApiError(400, "Invalid project id");
            }
            await ensureProjectAccess(req.user, project);
            actionItem.project = project;
        }
    }

    if (recording !== undefined) {
        if (recording === null || recording === "") {
            actionItem.recording = null;
        } else {
            if (!isValidObjectId(recording)) {
                throw new ApiError(400, "Invalid recording id");
            }
            await ensureRecordingAccess(req.user, recording, meeting || actionItem.meeting);
            actionItem.recording = recording;
        }
    }

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new ApiError(400, "Action item title is required");
        }
        actionItem.title = title.trim();
    }

    if (description !== undefined) {
        actionItem.description = description ? description.trim() : "";
    }

    if (assignee !== undefined) {
        if (assignee === null || assignee === "") {
            actionItem.assignee = null;
        } else {
            if (!isValidObjectId(assignee)) {
                throw new ApiError(400, "Invalid assignee id");
            }

            const assigneeUser = await User.findById(assignee);
            if (!assigneeUser) {
                throw new ApiError(404, "Assignee not found");
            }

            if (actionItem.project) {
                const projectDoc = await Project.findById(actionItem.project);
                const allowed = projectDoc.owner.toString() === assigneeUser._id.toString()
                    || projectDoc.members.some((memberId) => memberId.toString() === assigneeUser._id.toString());

                if (!allowed && req.user.role !== "admin") {
                    throw new ApiError(403, "Assignee must belong to the project");
                }
            }

            actionItem.assignee = assigneeUser._id;
        }
    }

    if (dueDate !== undefined) {
        actionItem.dueDate = parseOptionalDate(dueDate, "dueDate") || null;
    }

    if (status !== undefined) {
        if (!validStatus.includes(status)) {
            throw new ApiError(400, "Invalid action item status");
        }
        actionItem.status = status;
    }

    if (source !== undefined) {
        if (!validSource.includes(source)) {
            throw new ApiError(400, "Invalid action item source");
        }
        actionItem.source = source;
    }

    if (actionItem.recording) {
        await ensureRecordingAccess(req.user, actionItem.recording.toString(), actionItem.meeting);
    }

    await actionItem.save();

    const updatedActionItem = await ActionItem.findById(actionItem._id)
        .populate("meeting", "title status scheduledAt")
        .populate("recording", "title recordingUrl")
        .populate("project", "name status")
        .populate("assignee", "fullName email avatar")
        .populate("createdBy", "fullName email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedActionItem, "Action item updated successfully"));
});

const deleteActionItem = asyncHandler(async (req, res) => {
    const { actionItemId } = req.params;

    if (!isValidObjectId(actionItemId)) {
        throw new ApiError(400, "Invalid action item id");
    }

    const actionItem = await ActionItem.findById(actionItemId);

    if (!actionItem) {
        throw new ApiError(404, "Action item not found");
    }

    const auth = await ensureActionItemAccess(req.user, actionItem);

    if (!auth.isAdmin && !auth.isCreator) {
        throw new ApiError(403, "You are not allowed to delete this action item");
    }

    await actionItem.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Action item deleted successfully"));
});

const convertActionItemToTask = asyncHandler(async (req, res) => {
    const { actionItemId } = req.params;

    if (!isValidObjectId(actionItemId)) {
        throw new ApiError(400, "Invalid action item id");
    }

    const actionItem = await ActionItem.findById(actionItemId);
    if (!actionItem) {
        throw new ApiError(404, "Action item not found");
    }

    const access = await ensureActionItemAccess(req.user, actionItem);
    const requestedProjectId = req.body.project;

    if (actionItem.project && requestedProjectId && actionItem.project.toString() !== requestedProjectId.toString()) {
        throw new ApiError(400, "Action item belongs to a different project");
    }

    const projectId = actionItem.project || requestedProjectId;
    if (!projectId) {
        throw new ApiError(400, "A project is required to convert this action item into a task");
    }

    const project = await ensureProjectAccess(req.user, projectId.toString());
    const isProjectOwner = project.owner.toString() === req.user._id.toString();
    if (!access.isAdmin && !access.isCreator && !isProjectOwner) {
        throw new ApiError(403, "Only the action-item creator, project owner, or admin can convert it");
    }

    const existingTask = await Task.findOne({ actionItem: actionItem._id });
    if (existingTask) {
        return res.status(200).json(
            new ApiResponse(200, existingTask, "Action item already has a task")
        );
    }

    const assigneeIsProjectMember = !actionItem.assignee
        || project.owner.toString() === actionItem.assignee.toString()
        || project.members.some((memberId) => memberId.toString() === actionItem.assignee.toString());

    if (!assigneeIsProjectMember && req.user.role !== "admin") {
        throw new ApiError(400, "Action-item assignee must belong to the target project");
    }

    let task;
    try {
        task = await Task.create({
            title: actionItem.title,
            description: actionItem.description,
            project: project._id,
            createdBy: req.user._id,
            assignee: actionItem.assignee,
            status: actionItem.status === "completed" ? "completed" : "todo",
            priority: "medium",
            dueDate: actionItem.dueDate,
            meeting: actionItem.meeting,
            actionItem: actionItem._id,
        });
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }
        task = await Task.findOne({ actionItem: actionItem._id });
    }

    const populatedTask = await Task.findById(task._id)
        .populate("project", "name owner members status")
        .populate("createdBy", "fullName email avatar")
        .populate("assignee", "fullName email avatar")
        .populate("meeting", "title scheduledAt status")
        .populate("actionItem", "title status source");

    return res.status(201).json(
        new ApiResponse(201, populatedTask, "Action item converted to task")
    );
});

export {
    createActionItem,
    getActionItems,
    getActionItemById,
    updateActionItem,
    deleteActionItem,
    convertActionItemToTask,
};