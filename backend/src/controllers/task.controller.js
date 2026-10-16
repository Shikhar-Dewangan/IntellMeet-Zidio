// backend/controllers/task.controller.js
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

import {
    canManageTasksInTeam,
    getTaskManageableTeamIds,
    requireTaskManageInTeam,
    requireProjectLinkedToTeam,
    requireUserIsTeamMember,
} from "../utils/taskAuth.util.js";

import {
    buildCloudinaryFolder,
    uploadFileToCloudinary,
    deleteFileFromCloudinary,
} from "../utils/FileUplode.js";
import { createBulkNotifications } from "../services/notification.service.js";

const validStatus = ["todo", "in-progress", "completed"];
const validPriority = ["low", "medium", "high"];

const MAX_ATTACHMENTS_PER_TASK = 5;
const MAX_ATTACHMENTS_PER_REQUEST = 5;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const idString = (value) => (value?._id || value)?.toString();

/* ============================================================
   HELPERS
   ============================================================ */

const parseOptionalDate = (value, fieldName) => {
    if (value === undefined || value === null || value === "") return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
    return d;
};

/**
 * Legacy-safe project access check.
 * Access if user can manage tasks in ANY team linked to the project,
 * OR is a member/owner of any linked team, OR project owner.
 * (Project owner no longer gets automatic task MANAGEMENT; that is
 * enforced separately in create/update/delete.)
 */
const canReadProjectTasks = async (user, project) => {
    if (user.role === "admin") return true;
    const userId = user._id.toString();

    const ownerId = idString(project.owner);
    if (ownerId && ownerId === userId) return true;

    const members = Array.isArray(project.members) ? project.members : [];
    if (members.some((m) => idString(m) === userId)) return true;

    const teamIds = (project.teams || []).map((t) => t.toString());
    if (teamIds.length === 0) return false;

    const accessible = await Team.findOne(
        {
            _id: { $in: teamIds },
            $or: [{ owner: user._id }, { members: user._id }],
        },
        { _id: 1 }
    ).lean();

    return !!accessible;
};

const populateTask = (query) =>
    query
        .populate("project", "name owner members teams status")
        .populate("team", "name owner members")
        .populate("createdBy", "fullName email avatar")
        .populate("assignee", "fullName email avatar")
        .populate("meeting", "title scheduledAt status")
        .populate("actionItem", "title status")
        .populate("attachments.uploadedBy", "fullName email avatar");

/**
 * Upload attachments to Cloudinary. Best-effort cleanup on failure.
 */
const uploadTaskAttachments = async (localFiles, folder, userId) => {
    const uploaded = [];
    try {
        for (const f of localFiles) {
            const result = await uploadFileToCloudinary(f.path, folder);
            if (!result?.secure_url || !result?.public_id) {
                throw new ApiError(500, "Attachment upload failed");
            }
            uploaded.push({
                name: f.originalname || "file",
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type || "raw",
                mimeType: f.mimetype || "",
                size: f.size || 0,
                uploadedBy: userId,
                uploadedAt: new Date(),
            });
        }
        return uploaded;
    } catch (err) {
        await Promise.all(
            uploaded.map((u) =>
                deleteFileFromCloudinary(u.publicId, u.resourceType).catch(
                    (e) =>
                        console.error(
                            "Task attachment cleanup failed:",
                            u.publicId,
                            e?.message
                        )
                )
            )
        );
        throw err;
    }
};

/* ============================================================
   CREATE TASK
   ------------------------------------------------------------
   Authorization (per spec):
     - admin
     - team owner of task.team
     - valid TeamTaskOwner of task.team (live membership)
   Project Owner does NOT get automatic task management rights.
   ============================================================ */

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
    if (!team || !isValidObjectId(team)) {
        throw new ApiError(400, "Valid team id is required");
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) throw new ApiError(404, "Project not found");

    const teamDoc = await Team.findById(team);
    if (!teamDoc) throw new ApiError(404, "Team not found");

    // Project must be linked to the team
    await requireProjectLinkedToTeam(projectDoc, team);

    // Authorization: only team owner / Task Owner / admin
    await requireTaskManageInTeam(req.user, team);

    if (assignee !== undefined && assignee !== null && assignee !== "") {
        await requireUserIsTeamMember(teamDoc, assignee);
    }

    if (meeting !== undefined && meeting !== null && meeting !== "") {
        if (!isValidObjectId(meeting)) {
            throw new ApiError(400, "Invalid meeting id");
        }
        const m = await Meeting.findById(meeting);
        if (!m) throw new ApiError(404, "Meeting not found");
    }

    if (actionItem !== undefined && actionItem !== null && actionItem !== "") {
        if (!isValidObjectId(actionItem)) {
            throw new ApiError(400, "Invalid actionItem id");
        }
        const ai = await ActionItem.findById(actionItem);
        if (!ai) throw new ApiError(404, "Action item not found");
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
        description: description ? String(description).trim() : "",
        project: projectDoc._id,
        team: teamDoc._id,
        createdBy: req.user._id,
        assignee: assignee || null,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: parsedDueDate || null,
        completedAt: status === "completed" ? new Date() : null,
        meeting: meeting || null,
        actionItem: actionItem || null,
        attachments: [],
    });

    // Attachments
    const localFiles = req.files || [];
    if (localFiles.length > MAX_ATTACHMENTS_PER_REQUEST) {
        await task.deleteOne().catch(() => {});
        throw new ApiError(
            400,
            `Maximum ${MAX_ATTACHMENTS_PER_REQUEST} attachments per request`
        );
    }

    if (localFiles.length > 0) {
        const folder = buildCloudinaryFolder({
            entityType: "tasks",
            userId: req.user._id.toString(),
            projectId: projectDoc._id.toString(),
            meetingId: task._id.toString(), // reuse slot for task id
        });

        try {
            const uploaded = await uploadTaskAttachments(
                localFiles,
                folder,
                req.user._id
            );
            task.attachments = uploaded;
            await task.save();
        } catch (err) {
            console.error("createTask: attachment upload failed", err);
            await task.deleteOne().catch((delErr) =>
                console.error(
                    "createTask: rollback failed, orphan task:",
                    task._id,
                    delErr?.message
                )
            );
            throw new ApiError(
                500,
                "Attachment upload failed; task was not created"
            );
        }
    }

    const populatedTask = await populateTask(Task.findById(task._id));

    if (task.assignee && idString(task.assignee) !== req.user._id.toString()) {
        await createBulkNotifications([{
            recipient: task.assignee,
            actor: req.user._id,
            type: "task_assigned",
            title: "Task assigned to you",
            message: `You were assigned "${task.title}".`,
            relatedTask: task._id,
            relatedProject: task.project,
            relatedTeam: task.team,
            actionUrl: `/tasks/${task._id}`,
        }]);
    }

    return res
        .status(201)
        .json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

/* ============================================================
   GET TASKS (scoped)
   ============================================================ */

const normalizeTaskFilters = async (user, query = {}) => {
    const filter = {};
    const { project, team, status, priority, assignee } = query;

    // Direct team filter
    if (team) {
        if (!isValidObjectId(team)) {
            throw new ApiError(400, "Invalid team id");
        }
        const teamDoc = await Team.findById(team);
        if (!teamDoc) throw new ApiError(404, "Team not found");

        const isMember = (teamDoc.members || []).some(
            (m) => m.toString() === user._id.toString()
        );
        const isOwner = teamDoc.owner.toString() === user._id.toString();

        if (user.role !== "admin" && !isMember && !isOwner) {
            throw new ApiError(403, "No access to this team");
        }
        filter.team = team;
    }

    // Direct project filter (must be accessible)
    if (project) {
        if (!isValidObjectId(project)) {
            throw new ApiError(400, "Invalid project id");
        }
        const projectDoc = await Project.findById(project);
        if (!projectDoc) throw new ApiError(404, "Project not found");

        const ok = await canReadProjectTasks(user, projectDoc);
        if (!ok) throw new ApiError(403, "No access to this project");

        filter.project = projectDoc._id;
    }

    // If no direct project/team filter → scope by accessible teams+projects
    if (!project && !team && user.role !== "admin") {
        const accessibleTeams = await Team.find(
            { $or: [{ owner: user._id }, { members: user._id }] },
            { _id: 1 }
        ).lean();
        const teamIds = accessibleTeams.map((t) => t._id);

        const accessibleProjects = await Project.find(
            {
                $or: [
                    { owner: user._id },
                    { members: user._id },
                    ...(teamIds.length ? [{ teams: { $in: teamIds } }] : []),
                ],
            },
            { _id: 1 }
        );
        const projectIds = accessibleProjects.map((p) => p._id);

        filter.$or = [
            { project: { $in: projectIds } },
            { team: { $in: teamIds } },
            { assignee: user._id },
            { createdBy: user._id },
        ];
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

const getTasks = asyncHandler(async (req, res) => {
    const filter = await normalizeTaskFilters(req.user, req.query);

    const tasks = await populateTask(
        Task.find(filter).sort({ updatedAt: -1 })
    );

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

/* ============================================================
   GET TASK BY ID
   ============================================================ */

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await populateTask(Task.findById(taskId));
    if (!task) throw new ApiError(404, "Task not found");

    // Access: admin / team owner / task owner / assignee / creator / team member / project member
    if (req.user.role !== "admin") {
        const userId = req.user._id.toString();
        const assigneeId = idString(task.assignee);
        const creatorId = idString(task.createdBy);

        let allowed = assigneeId === userId || creatorId === userId;

        if (!allowed && task.project) {
            const projectDoc = await Project.findById(task.project._id || task.project);
            if (projectDoc) {
                allowed = await canReadProjectTasks(req.user, projectDoc);
            }
        }

        if (!allowed && task.team) {
            const teamDoc = await Team.findById(task.team._id || task.team);
            if (teamDoc) {
                allowed =
                    teamDoc.owner.toString() === userId ||
                    (teamDoc.members || []).some(
                        (m) => m.toString() === userId
                    );
            }
        }

        if (!allowed) {
            throw new ApiError(403, "You do not have access to this task");
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task fetched successfully"));
});

/* ============================================================
   UPDATE TASK
   ------------------------------------------------------------
   Manager (team owner / task owner / admin) → full update
   Assignee (own task) → can only update status (with allowed transitions)
   Others → forbidden
   ============================================================ */

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");
    const previousState = {
        assignee: idString(task.assignee),
        status: task.status,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate?.getTime() ?? null,
    };

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    const isManager =
        task.team && (await canManageTasksInTeam(req.user, task.team));
    const isAssignee = idString(task.assignee) === userId;
    const isCreator = idString(task.createdBy) === userId;

    // Determine if allowed at all
    if (!isAdmin && !isManager && !isAssignee && !isCreator) {
        throw new ApiError(403, "You are not allowed to update this task");
    }

    // Assignee-only restriction (not manager)
    if (!isAdmin && !isManager && !isCreator) {
        // Assignee-only → status only
        const allowedKeys = ["status"];
        const provided = Object.keys(req.body);
        const bad = provided.filter((k) => !allowedKeys.includes(k));
        if (bad.length > 0) {
            throw new ApiError(
                403,
                "You can only update the status of your own task"
            );
        }
    }

    // Reject unauthorized fields
    if (req.body.createdBy !== undefined) {
        throw new ApiError(403, "createdBy cannot be changed");
    }
    if (req.body.project !== undefined && idString(req.body.project) !== idString(task.project)) {
        throw new ApiError(403, "Task project cannot be changed");
    }

    const {
        title,
        description,
        status,
        priority,
        dueDate,
        assignee,
        team: newTeam,
        meeting,
        actionItem,
    } = req.body;

    // Managers can only change team to another team they can manage
    if (newTeam !== undefined && newTeam !== null && newTeam !== "") {
        if (!isValidObjectId(newTeam)) {
            throw new ApiError(400, "Invalid team id");
        }
        const teamDoc = await Team.findById(newTeam);
        if (!teamDoc) throw new ApiError(404, "Team not found");
        await requireTaskManageInTeam(req.user, newTeam);
        const projectDoc = await Project.findById(task.project);
        await requireProjectLinkedToTeam(projectDoc, newTeam);
        task.team = teamDoc._id;
    }

    if (assignee !== undefined) {
        if (assignee === null || assignee === "") {
            task.assignee = null;
        } else {
            if (!isValidObjectId(assignee)) {
                throw new ApiError(400, "Invalid assignee id");
            }
            const teamDoc = await Team.findById(task.team);
            await requireUserIsTeamMember(teamDoc, assignee);
            task.assignee = assignee;
        }
    }

    if (status !== undefined) {
        if (!validStatus.includes(status)) {
            throw new ApiError(400, "Invalid task status");
        }
        task.status = status;
        task.completedAt =
            status === "completed" ? task.completedAt || new Date() : null;
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
        task.description = description ? String(description).trim() : "";
    }

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new ApiError(400, "Task title cannot be empty");
        }
        task.title = title.trim();
    }

    if (meeting !== undefined) {
        task.meeting = meeting || null;
    }

    if (actionItem !== undefined) {
        task.actionItem = actionItem || null;
    }

    await task.save();

    const updatedTask = await populateTask(Task.findById(task._id));

    const actorId = req.user._id.toString();
    const currentAssigneeId = idString(task.assignee);
    const assignmentChanged = previousState.assignee !== currentAssigneeId;
    const notifications = [];
    const notifiedRecipients = new Set();
    const addTaskNotification = (
        recipient,
        type,
        title,
        message,
        actionUrl = `/tasks/${task._id}`
    ) => {
        if (!recipient || recipient === actorId || notifiedRecipients.has(recipient)) {
            return;
        }
        notifiedRecipients.add(recipient);
        notifications.push({
            recipient,
            actor: req.user._id,
            type,
            title,
            message,
            relatedTask: task._id,
            relatedProject: task.project,
            relatedTeam: task.team,
            actionUrl,
        });
    };

    if (assignmentChanged) {
        const type = previousState.assignee ? "task_reassigned" : "task_assigned";
        if (currentAssigneeId) {
            addTaskNotification(
                currentAssigneeId,
                type,
                previousState.assignee ? "Task reassigned to you" : "Task assigned to you",
                `You were assigned "${task.title}".`
            );
        }
        if (previousState.assignee) {
            addTaskNotification(
                previousState.assignee,
                "task_reassigned",
                "Task reassigned",
                `"${task.title}" was reassigned to someone else.`,
                "/tasks"
            );
        }
    }

    if (previousState.status !== "completed" && task.status === "completed") {
        addTaskNotification(
            idString(task.createdBy),
            "task_completed",
            "Task completed",
            `"${task.title}" was marked complete.`
        );
        addTaskNotification(
            currentAssigneeId,
            "task_completed",
            "Task completed",
            `"${task.title}" was marked complete.`
        );
    } else {
        const detailsChanged =
            previousState.title !== task.title ||
            previousState.description !== task.description ||
            previousState.priority !== task.priority ||
            previousState.dueDate !== (task.dueDate?.getTime() ?? null);
        if (detailsChanged) {
            const recipient = currentAssigneeId !== actorId
                ? currentAssigneeId
                : idString(task.createdBy);
            addTaskNotification(
                recipient,
                "task_updated",
                "Task updated",
                `"${task.title}" was updated.`
            );
        }
    }

    await createBulkNotifications(notifications);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

/* ============================================================
   DELETE TASK
   Manager-only (admin / team owner / task owner) OR creator
   ============================================================ */

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isManager =
        task.team && (await canManageTasksInTeam(req.user, task.team));
    const isCreator = idString(task.createdBy) === userId;

    if (!isAdmin && !isManager && !isCreator) {
        throw new ApiError(403, "You are not allowed to delete this task");
    }

    // Best-effort attachment cleanup
    const failed = [];
    if (Array.isArray(task.attachments) && task.attachments.length) {
        const results = await Promise.allSettled(
            task.attachments.map((a) =>
                deleteFileFromCloudinary(a.publicId, a.resourceType)
            )
        );
        results.forEach((r, i) => {
            if (r.status === "rejected") {
                failed.push({
                    publicId: task.attachments[i].publicId,
                    reason: r.reason?.message || "unknown",
                });
            }
        });
    }

    if (failed.length) {
        console.error("deleteTask: orphaned task attachments", failed);
    }

    await task.deleteOne();

    const recipients = new Set([
        idString(task.createdBy),
        idString(task.assignee),
    ]);
    recipients.delete(userId);
    await createBulkNotifications(
        [...recipients].filter(Boolean).map((recipient) => ({
            recipient,
            actor: req.user._id,
            type: "task_updated",
            title: "Task deleted",
            message: `The task "${task.title}" was deleted.`,
            relatedProject: task.project,
            relatedTeam: task.team,
            actionUrl: "/tasks",
        }))
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                failed.length ? { orphanedAssets: failed } : {},
                "Task deleted successfully"
            )
        );
});

/* ============================================================
   ADD ATTACHMENTS
   ============================================================ */

const addTaskAttachments = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid task id");
    }

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    const isAdmin = req.user.role === "admin";
    const isManager =
        task.team && (await canManageTasksInTeam(req.user, task.team));
    const isCreator = idString(task.createdBy) === req.user._id.toString();

    if (!isAdmin && !isManager && !isCreator) {
        throw new ApiError(
            403,
            "You are not authorized to add attachments to this task"
        );
    }

    const files = req.files || [];
    if (files.length === 0) {
        throw new ApiError(400, "No files provided");
    }
    if (files.length > MAX_ATTACHMENTS_PER_REQUEST) {
        throw new ApiError(
            400,
            `Maximum ${MAX_ATTACHMENTS_PER_REQUEST} attachments per request`
        );
    }
    const current = (task.attachments || []).length;
    if (current + files.length > MAX_ATTACHMENTS_PER_TASK) {
        throw new ApiError(
            400,
            `Task can have at most ${MAX_ATTACHMENTS_PER_TASK} attachments`
        );
    }

    const folder = buildCloudinaryFolder({
        entityType: "tasks",
        userId: req.user._id.toString(),
        projectId: task.project.toString(),
        meetingId: task._id.toString(),
    });

    const uploaded = await uploadTaskAttachments(
        files,
        folder,
        req.user._id
    );

    task.attachments = [...(task.attachments || []), ...uploaded];

    try {
        await task.save();
    } catch (err) {
        console.error("addTaskAttachments: save failed, cleaning up", err);
        await Promise.all(
            uploaded.map((u) =>
                deleteFileFromCloudinary(u.publicId, u.resourceType).catch(
                    (e) =>
                        console.error(
                            "cleanup failed",
                            u.publicId,
                            e?.message
                        )
                )
            )
        );
        throw new ApiError(500, "Could not save task attachments");
    }

    const populated = await populateTask(Task.findById(task._id));
    return res
        .status(200)
        .json(
            new ApiResponse(200, populated, "Attachments uploaded successfully")
        );
});

/* ============================================================
   DELETE ATTACHMENT
   ============================================================ */

const deleteTaskAttachment = asyncHandler(async (req, res) => {
    const { taskId, attachmentId } = req.params;

    if (!isValidObjectId(taskId) || !isValidObjectId(attachmentId)) {
        throw new ApiError(400, "Invalid task or attachment id");
    }

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    const isAdmin = req.user.role === "admin";
    const isManager =
        task.team && (await canManageTasksInTeam(req.user, task.team));
    const isCreator = idString(task.createdBy) === req.user._id.toString();

    if (!isAdmin && !isManager && !isCreator) {
        throw new ApiError(
            403,
            "You are not authorized to delete attachments"
        );
    }

    const list = task.attachments || [];
    const target = list.find((a) => a._id.toString() === attachmentId);
    if (!target) throw new ApiError(404, "Attachment not found");

    try {
        await deleteFileFromCloudinary(target.publicId, target.resourceType);
    } catch (err) {
        console.error("deleteTaskAttachment: cloudinary failed", err);
        throw new ApiError(
            500,
            "Could not delete attachment from storage"
        );
    }

    task.attachments = list.filter(
        (a) => a._id.toString() !== attachmentId
    );

    try {
        await task.save();
    } catch (err) {
        console.error(
            "deleteTaskAttachment: DB save failed after Cloudinary delete",
            err
        );
        throw new ApiError(
            500,
            "Storage deleted but DB update failed. Contact support."
        );
    }

    const populated = await populateTask(Task.findById(task._id));
    return res
        .status(200)
        .json(new ApiResponse(200, populated, "Attachment deleted"));
});

/* ============================================================
   TASK STATISTICS (Dashboard)
   ============================================================ */

const getTaskStats = asyncHandler(async (req, res) => {
    const { team: teamFilter, project: projectFilter } = req.query;

    const isAdmin = req.user.role === "admin";
    const userId = req.user._id;

    // Accessible teams
    const accessibleTeams = isAdmin
        ? await Team.find({}, { _id: 1 }).lean()
        : await Team.find(
            { $or: [{ owner: userId }, { members: userId }] },
            { _id: 1 }
        ).lean();
    const accessibleTeamIds = accessibleTeams.map((t) => t._id);

    // Accessible projects
    const accessibleProjects = isAdmin
        ? await Project.find({}, { _id: 1 }).lean()
        : await Project.find(
            {
                $or: [
                    { owner: userId },
                    { members: userId },
                    ...(accessibleTeamIds.length
                        ? [{ teams: { $in: accessibleTeamIds } }]
                        : []),
                ],
            },
            { _id: 1 }
        ).lean();
    const accessibleProjectIds = accessibleProjects.map((p) => p._id);

    // Base filter
    const base = isAdmin
        ? {}
        : {
            $or: [
                { project: { $in: accessibleProjectIds } },
                { team: { $in: accessibleTeamIds } },
                { assignee: userId },
                { createdBy: userId },
            ],
        };

    if (teamFilter && isValidObjectId(teamFilter)) {
        base.team = teamFilter;
    }
    if (projectFilter && isValidObjectId(projectFilter)) {
        base.project = projectFilter;
    }

    const now = new Date();

    const [
        total,
        todo,
        inProgress,
        completed,
        overdue,
        upcomingDeadlines,
        projectProgress,
        teamWorkload,
    ] = await Promise.all([
        Task.countDocuments(base),
        Task.countDocuments({ ...base, status: "todo" }),
        Task.countDocuments({ ...base, status: "in-progress" }),
        Task.countDocuments({ ...base, status: "completed" }),
        Task.countDocuments({
            ...base,
            status: { $ne: "completed" },
            dueDate: { $lt: now },
        }),
        Task.find({
            ...base,
            status: { $ne: "completed" },
            dueDate: { $gte: now },
        })
            .populate("project", "name")
            .populate("team", "name")
            .populate("assignee", "fullName avatar")
            .sort({ dueDate: 1 })
            .limit(5)
            .lean(),
        // Per-project progress (aggregate)
        Task.aggregate([
            {
                $match: isAdmin
                    ? {}
                    : { project: { $in: accessibleProjectIds } },
            },
            {
                $group: {
                    _id: "$project",
                    total: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "_id",
                    as: "projectInfo",
                },
            },
            { $unwind: { path: "$projectInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    projectId: "$_id",
                    name: { $ifNull: ["$projectInfo.name", "Unknown project"] },
                    total: 1,
                    completed: 1,
                },
            },
            { $sort: { total: -1 } },
            { $limit: 10 },
        ]),
        // Team workload
        Task.aggregate([
            {
                $match: isAdmin
                    ? { team: { $ne: null } }
                    : { team: { $in: accessibleTeamIds } },
            },
            { $match: { team: { $ne: null } } },
            {
                $group: {
                    _id: "$team",
                    total: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "_id",
                    foreignField: "_id",
                    as: "teamInfo",
                },
            },
            { $unwind: { path: "$teamInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    teamId: "$_id",
                    name: { $ifNull: ["$teamInfo.name", "Unknown team"] },
                    total: 1,
                    completed: 1,
                },
            },
            { $sort: { total: -1 } },
            { $limit: 10 },
        ]),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totals: { total, todo, inProgress, completed, overdue },
                completionRate,
                upcomingDeadlines,
                projectProgress: projectProgress.map((p) => ({
                    ...p,
                    completionRate:
                        p.total > 0
                            ? Math.round((p.completed / p.total) * 100)
                            : 0,
                })),
                teamWorkload: teamWorkload.map((t) => ({
                    ...t,
                    completionRate:
                        t.total > 0
                            ? Math.round((t.completed / t.total) * 100)
                            : 0,
                })),
            },
            "Task statistics fetched successfully"
        )
    );
});

/* ============================================================
   ELIGIBLE ENDPOINTS (for Create Task form)
   ============================================================ */

/**
 * GET /tasks/eligible-teams
 * Returns teams where user can manage tasks.
 */
const getEligibleTeams = asyncHandler(async (req, res) => {
    const teamIds = await getTaskManageableTeamIds(req.user);
    if (teamIds.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No eligible teams"));
    }
    const teams = await Team.find({ _id: { $in: teamIds } })
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar")
        .sort({ name: 1 })
        .lean();
    return res
        .status(200)
        .json(new ApiResponse(200, teams, "Eligible teams fetched"));
});

/**
 * GET /tasks/eligible-projects?team=teamId
 * Returns projects linked to that team.
 */
const getEligibleProjects = asyncHandler(async (req, res) => {
    const { team: teamId } = req.query;
    if (!teamId || !isValidObjectId(teamId)) {
        throw new ApiError(400, "Valid team id is required");
    }

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");

    const isAdmin = req.user.role === "admin";
    const userId = req.user._id.toString();
    const isOwner = team.owner.toString() === userId;
    const isMember = (team.members || []).some(
        (m) => m.toString() === userId
    );

    if (!isAdmin && !isOwner && !isMember) {
        throw new ApiError(403, "No access to this team");
    }

    const projects = await Project.find({ teams: teamId })
        .populate("owner", "fullName email avatar")
        .sort({ name: 1 })
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Eligible projects fetched"));
});

/**
 * GET /tasks/eligible-members?team=teamId
 * Returns current members of that team.
 */
const getEligibleMembers = asyncHandler(async (req, res) => {
    const { team: teamId } = req.query;
    if (!teamId || !isValidObjectId(teamId)) {
        throw new ApiError(400, "Valid team id is required");
    }

    const team = await Team.findById(teamId)
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar");
    if (!team) throw new ApiError(404, "Team not found");

    const isAdmin = req.user.role === "admin";
    const userId = req.user._id.toString();
    const isOwner = team.owner._id.toString() === userId;
    const isMember = (team.members || []).some(
        (m) => m._id.toString() === userId
    );

    if (!isAdmin && !isOwner && !isMember) {
        throw new ApiError(403, "No access to this team");
    }

    // Union of owner + members, deduped
    const map = new Map();
    if (team.owner) map.set(team.owner._id.toString(), team.owner);
    for (const m of team.members || []) {
        map.set(m._id.toString(), m);
    }
    const members = Array.from(map.values());

    return res
        .status(200)
        .json(new ApiResponse(200, members, "Eligible members fetched"));
});

export {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    addTaskAttachments,
    deleteTaskAttachment,
    getTaskStats,
    getEligibleTeams,
    getEligibleProjects,
    getEligibleMembers,
};