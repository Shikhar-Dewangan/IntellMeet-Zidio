import mongoose from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import Meeting from "../models/meeting.model.js";
import ActionItem from "../models/actionItem.model.js";

const validStatus = ["todo", "in-progress", "completed"];
const validPriority = ["low", "medium", "high"];

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

const ensureProjectAccess = async (user, projectId, requireMembership = true) => {
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

    if (requireMembership && !isAdmin && !isOwner && !isMember) {
        throw new ApiError(403, "You do not have access to this project");
    }

    return project;
};

const ensureTeamAccess = async (user, teamId) => {
    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const isOwner = team.owner.toString() === user._id.toString();
    const isMember = team.members.some((memberId) => memberId.toString() === user._id.toString());

    if (user.role !== "admin" && !isOwner && !isMember) {
        throw new ApiError(403, "You do not have access to this team");
    }

    return team;
};

const ensureMeetingAccess = async (user, meetingId) => {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(404, "Meeting not found");
    }

    const isHost = meeting.host.toString() === user._id.toString();
    const isParticipant = meeting.participants.some((memberId) => memberId.toString() === user._id.toString());

    if (user.role !== "admin" && !isHost && !isParticipant) {
        throw new ApiError(403, "You do not have access to this meeting");
    }

    return meeting;
};

const ensureTaskActionItem = async (user, actionItemId, projectId, meetingId) => {
    const actionItem = await ActionItem.findById(actionItemId);

    if (!actionItem) {
        throw new ApiError(404, "Action item not found");
    }

    if (actionItem.project && actionItem.project.toString() !== projectId.toString()) {
        throw new ApiError(400, "Action item belongs to a different project");
    }

    if (actionItem.meeting) {
        await ensureMeetingAccess(user, actionItem.meeting.toString());

        if (meetingId && actionItem.meeting.toString() !== meetingId.toString()) {
            throw new ApiError(400, "Action item belongs to a different meeting");
        }
    }

    return actionItem;
};

const normalizeTaskFilters = async (user, query = {}) => {
    const filter = {};
    const { project, status, priority, assignee } = query;

    if (project) {
        if (!isValidObjectId(project)) {
            throw new ApiError(400, "Invalid project id");
        }

        const projectDoc = await ensureProjectAccess(user, project);
        filter.project = projectDoc._id;
    } else if (user.role !== "admin") {
        const accessibleProjects = await Project.find(
            { $or: [{ owner: user._id }, { members: user._id }] },
            { _id: 1 }
        );

        filter.project = { $in: accessibleProjects.map((item) => item._id) };
    }

    if (status) {
        if (!validStatus.includes(status)) {
            throw new ApiError(400, "Invalid task status");
        }
        filter.status = status;
    }

    if (priority) {
        if (!validPriority.includes(priority)) {
            throw new ApiError(400, "Invalid task priority");
        }
        filter.priority = priority;
    }

    if (assignee) {
        if (!isValidObjectId(assignee)) {
            throw new ApiError(400, "Invalid assignee id");
        }
        filter.assignee = assignee;
    }

    return filter;
};

const getTaskAccessContext = async (user, task) => {
    const project = await Project.findById(task.project?._id || task.project);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isAdmin = user.role === "admin";
    const isProjectOwner = project.owner.toString() === user._id.toString();
    const isProjectMember = project.members.some((memberId) => memberId.toString() === user._id.toString());
    const isCreator = idString(task.createdBy) === user._id.toString();
    const isAssignee = task.assignee && idString(task.assignee) === user._id.toString();

    if (!isAdmin && !isProjectOwner && !isProjectMember && !isCreator && !isAssignee) {
        throw new ApiError(403, "You do not have access to this task");
    }

    return { project, isAdmin, isProjectOwner, isProjectMember, isCreator, isAssignee };
};

const createTask = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        project,
        team,
        assignee,
        status,
        priority,
        dueDate,
        meeting,
        actionItem,
    } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
        throw new ApiError(400, "Task title is required");
    }

    if (!project || !isValidObjectId(project)) {
        throw new ApiError(400, "Valid project id is required");
    }

    const projectDoc = await ensureProjectAccess(req.user, project);

    if (team !== undefined && team !== null && team !== "") {
        if (!isValidObjectId(team)) {
            throw new ApiError(400, "Invalid team id");
        }

        await ensureTeamAccess(req.user, team);
    }

    if (assignee !== undefined && assignee !== null && assignee !== "") {
        if (!isValidObjectId(assignee)) {
            throw new ApiError(400, "Invalid assignee id");
        }

        const assigneeUser = await User.findById(assignee);
        if (!assigneeUser || !assigneeUser.isActive) {
            throw new ApiError(404, "Assignee not found");
        }

        const isAssigneeProjectMember = projectDoc.owner.toString() === assigneeUser._id.toString()
            || projectDoc.members.some((memberId) => memberId.toString() === assigneeUser._id.toString());

        if (!isAssigneeProjectMember && req.user.role !== "admin") {
            throw new ApiError(403, "Assignee must belong to the project");
        }
    }

    if (meeting !== undefined && meeting !== null && meeting !== "") {
        if (!isValidObjectId(meeting)) {
            throw new ApiError(400, "Invalid meeting id");
        }
        await ensureMeetingAccess(req.user, meeting);
    }

    if (actionItem !== undefined && actionItem !== null && actionItem !== "") {
        if (!isValidObjectId(actionItem)) {
            throw new ApiError(400, "Invalid actionItem id");
        }
        await ensureTaskActionItem(req.user, actionItem, projectDoc._id, meeting);
    }

    if (status !== undefined && !validStatus.includes(status)) {
        throw new ApiError(400, "Invalid task status");
    }

    if (priority !== undefined && !validPriority.includes(priority)) {
        throw new ApiError(400, "Invalid task priority");
    }

    const parsedDueDate = parseOptionalDate(dueDate, "dueDate");

    const task = await Task.create({
        title: title.trim(),
        description: description ? description.trim() : "",
        project: projectDoc._id,
        team: team || null,
        createdBy: req.user._id,
        assignee: assignee || null,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: parsedDueDate || null,
        completedAt: status === "completed" ? new Date() : null,
        meeting: meeting || null,
        actionItem: actionItem || null,
    });

    const populatedTask = await Task.findById(task._id)
        .populate("project", "name owner members status")
        .populate("team", "name owner")
        .populate("createdBy", "fullName email avatar")
        .populate("assignee", "fullName email avatar")
        .populate("meeting", "title scheduledAt status")
        .populate("actionItem", "title status");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

const getTasks = asyncHandler(async (req, res) => {
    const filter = await normalizeTaskFilters(req.user, req.query);

    const tasks = await Task.find(filter)
        .populate("project", "name owner members status")
        .populate("team", "name owner")
        .populate("createdBy", "fullName email avatar")
        .populate("assignee", "fullName email avatar")
        .populate("meeting", "title scheduledAt status")
        .populate("actionItem", "title status")
        .sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await Task.findById(taskId)
        .populate("project", "name owner members status")
        .populate("team", "name owner")
        .populate("createdBy", "fullName email avatar")
        .populate("assignee", "fullName email avatar")
        .populate("meeting", "title scheduledAt status")
        .populate("actionItem", "title status");

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    await getTaskAccessContext(req.user, task);

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await Task.findById(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const { project, team, assignee, status, priority, dueDate, description, meeting, actionItem, title } = req.body;
    const access = await getTaskAccessContext(req.user, task);

    if (
        !access.isAdmin &&
        !access.isProjectOwner &&
        !access.isCreator &&
        !(access.isAssignee && Object.keys(req.body).every((key) => ["status", "priority", "dueDate", "description"].includes(key)))
    ) {
        throw new ApiError(403, "You are not allowed to update this task");
    }

    if (project !== undefined && project !== null && project !== "" && project.toString() !== task.project.toString()) {
        throw new ApiError(403, "Task project cannot be changed");
    }

    if (req.body.createdBy !== undefined || req.body.project !== undefined && req.body.project !== task.project.toString()) {
        throw new ApiError(403, "Unauthorized task field update");
    }

    if (team !== undefined && team !== null && team !== "") {
        if (!isValidObjectId(team)) {
            throw new ApiError(400, "Invalid team id");
        }

        const teamDoc = await ensureTeamAccess(req.user, team);

        task.team = teamDoc._id;
    }

    if (team === null || team === "") {
        task.team = null;
    }

    if (assignee !== undefined) {
        if (assignee === null || assignee === "") {
            task.assignee = null;
        } else {
            if (!isValidObjectId(assignee)) {
                throw new ApiError(400, "Invalid assignee id");
            }

            const assigneeUser = await User.findById(assignee);
            if (!assigneeUser || !assigneeUser.isActive) {
                throw new ApiError(404, "Assignee not found");
            }

            const projectDoc = await Project.findById(task.project);
            const isAssigneeProjectMember = projectDoc.owner.toString() === assigneeUser._id.toString()
                || projectDoc.members.some((memberId) => memberId.toString() === assigneeUser._id.toString());

            if (!isAssigneeProjectMember && req.user.role !== "admin") {
                throw new ApiError(403, "Assignee must belong to the project");
            }

            task.assignee = assigneeUser._id;
        }
    }

    if (status !== undefined) {
        if (!validStatus.includes(status)) {
            throw new ApiError(400, "Invalid task status");
        }
        task.status = status;
        task.completedAt = status === "completed" ? (task.completedAt || new Date()) : null;
    }

    if (priority !== undefined) {
        if (!validPriority.includes(priority)) {
            throw new ApiError(400, "Invalid task priority");
        }
        task.priority = priority;
    }

    if (dueDate !== undefined) {
        task.dueDate = parseOptionalDate(dueDate, "dueDate") || null;
    }

    if (description !== undefined) {
        task.description = description ? description.trim() : "";
    }

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new ApiError(400, "Task title cannot be empty");
        }
        task.title = title.trim();
    }

    if (meeting !== undefined) {
        if (meeting === null || meeting === "") {
            task.meeting = null;
        } else {
            if (!isValidObjectId(meeting)) {
                throw new ApiError(400, "Invalid meeting id");
            }
            await ensureMeetingAccess(req.user, meeting);
            task.meeting = meeting;
        }
    }

    if (actionItem !== undefined) {
        if (actionItem === null || actionItem === "") {
            task.actionItem = null;
        } else {
            if (!isValidObjectId(actionItem)) {
                throw new ApiError(400, "Invalid actionItem id");
            }
            await ensureTaskActionItem(req.user, actionItem, task.project, meeting || task.meeting);
            task.actionItem = actionItem;
        }
    }

    if (task.meeting) {
        await ensureMeetingAccess(req.user, task.meeting.toString());
    }

    if (task.actionItem) {
        await ensureTaskActionItem(req.user, task.actionItem.toString(), task.project, task.meeting);
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
        .populate("project", "name owner members status")
        .populate("team", "name owner")
        .populate("createdBy", "fullName email avatar")
        .populate("assignee", "fullName email avatar")
        .populate("meeting", "title scheduledAt status")
        .populate("actionItem", "title status");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await Task.findById(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const access = await getTaskAccessContext(req.user, task);

    if (!access.isAdmin && !access.isProjectOwner && !access.isCreator) {
        throw new ApiError(403, "You are not allowed to delete this task");
    }

    await task.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

export {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
};