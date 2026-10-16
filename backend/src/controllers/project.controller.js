// backend/controllers/project.controller.js
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import TeamProjectOwner from "../models/teamProjectOwner.model.js";
import {
    buildCloudinaryFolder,
    uploadFileToCloudinary,
    deleteFileFromCloudinary,
} from "../utils/FileUplode.js";
import { canManageProject } from "../utils/projectAuth.util.js";
import { createBulkNotifications } from "../services/notification.service.js";

/* ============================================================
   CONSTANTS
   ============================================================ */

const MAX_FILES_PER_PROJECT = 10;
const MAX_FILES_PER_REQUEST = 5;
const VALID_STATUS = ["planning", "active", "completed", "archived"];
const VALID_PRIORITY = ["low", "medium", "high"];

/* ============================================================
   HELPERS
   ============================================================ */

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeTeamIds = (teams) => {
    if (!Array.isArray(teams)) return [];
    return teams
        .map((t) => (t && t._id ? t._id : t))
        .filter((id) => id && isValidObjectId(id))
        .map((id) => id.toString());
};

const uniqueObjectIdStrings = (ids = []) => {
    const seen = new Set();
    const out = [];
    for (const id of ids) {
        if (!id) continue;
        const s = String(id);
        if (!isValidObjectId(s)) continue;
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
};

const parseOptionalDate = (value, fieldName) => {
    if (value === undefined || value === null || value === "") return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, `Invalid ${fieldName} value`);
    }
    return date;
};

const validateStatus = (status) => {
    if (status === undefined) return undefined;
    if (!VALID_STATUS.includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }
    return status;
};

const validatePriority = (priority) => {
    if (priority === undefined) return undefined;
    if (!VALID_PRIORITY.includes(priority)) {
        throw new ApiError(400, "Invalid priority value");
    }
    return priority;
};

const validateDateOrder = (startDate, dueDate) => {
    if (startDate && dueDate && startDate.getTime() > dueDate.getTime()) {
        throw new ApiError(400, "Start date cannot be after due date");
    }
};

const parseTeamIdsInput = (teamIds) => {
    if (teamIds === undefined) return undefined;
    if (Array.isArray(teamIds)) return teamIds;
    if (typeof teamIds === "string") {
        try {
            const parsed = JSON.parse(teamIds);
            if (!Array.isArray(parsed)) {
                throw new ApiError(400, "teamIds must be a JSON array");
            }
            return parsed;
        } catch {
            throw new ApiError(400, "teamIds must be a valid JSON array");
        }
    }
    throw new ApiError(400, "teamIds must be an array of team IDs");
};

const getAssignableTeamIds = async (user) => {
    if (user.role === "admin") {
        const all = await Team.find({}, { _id: 1 }).lean();
        return all.map((t) => t._id.toString());
    }

    const userId = user._id;

    const owned = await Team.find({ owner: userId }, { _id: 1 }).lean();
    const ownedSet = new Set(owned.map((t) => t._id.toString()));

    const poRecords = await TeamProjectOwner.find(
        { user: userId },
        { team: 1 }
    ).lean();

    const candidateTeamIds = poRecords
        .map((r) => r.team.toString())
        .filter((id) => !ownedSet.has(id));

    if (candidateTeamIds.length > 0) {
        const stillMemberTeams = await Team.find(
            {
                _id: { $in: candidateTeamIds },
                members: userId,
            },
            { _id: 1 }
        ).lean();
        for (const t of stillMemberTeams) {
            ownedSet.add(t._id.toString());
        }
    }

    return Array.from(ownedSet);
};

const getAccessibleTeamIds = async (user) => {
    if (user.role === "admin") {
        const all = await Team.find({}, { _id: 1 }).lean();
        return all.map((t) => t._id.toString());
    }
    const teams = await Team.find(
        { $or: [{ owner: user._id }, { members: user._id }] },
        { _id: 1 }
    ).lean();
    return teams.map((t) => t._id.toString());
};

const validateAssignableTeams = async (user, teamIds) => {
    if (teamIds === undefined) return undefined;

    if (!Array.isArray(teamIds)) {
        throw new ApiError(400, "teamIds must be an array of team IDs");
    }

    const unique = uniqueObjectIdStrings(teamIds);
    if (unique.length === 0) return [];

    const assignable = new Set(await getAssignableTeamIds(user));

    for (const id of unique) {
        if (!assignable.has(id)) {
            throw new ApiError(
                403,
                "You are not authorized to assign this project to one or more selected teams"
            );
        }
    }

    const existing = await Team.find(
        { _id: { $in: unique } },
        { _id: 1 }
    ).lean();
    const existingIds = new Set(existing.map((t) => t._id.toString()));
    const missing = unique.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
        throw new ApiError(400, "One or more selected teams do not exist");
    }

    return unique;
};

const userCanAccessProject = async (user, project) => {
    if (user.role === "admin") return true;

    const userId = user._id.toString();
    const ownerId =
        (project.owner?._id || project.owner)?.toString?.() || null;
    if (ownerId && ownerId === userId) return true;

    const members = Array.isArray(project.members) ? project.members : [];
    if (members.some((m) => (m?._id || m)?.toString?.() === userId)) return true;

    const teamIds = normalizeTeamIds(project.teams);
    if (teamIds.length === 0) return false;

    const accessibleTeams = await Team.find(
        {
            _id: { $in: teamIds },
            $or: [{ owner: user._id }, { members: user._id }],
        },
        { _id: 1 }
    ).lean();

    return accessibleTeams.length > 0;
};

const filterVisibleTeams = async (user, project) => {
    const allTeamIds = normalizeTeamIds(project.teams);
    if (allTeamIds.length === 0) return [];

    if (user.role === "admin") return allTeamIds;

    const ownerId =
        (project.owner?._id || project.owner)?.toString?.() || null;
    if (ownerId && ownerId === user._id.toString()) return allTeamIds;

    const visible = await Team.find(
        {
            _id: { $in: allTeamIds },
            $or: [{ owner: user._id }, { members: user._id }],
        },
        { _id: 1 }
    ).lean();

    return visible.map((t) => t._id.toString());
};

const populateProject = (query) =>
    query
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role")
        .populate("teams", "name description owner members")
        .populate("files.uploadedBy", "fullName email avatar");

const notifyProjectCollaborators = async (
    project,
    actor,
    { type = "project_updated", title, message, deleted = false }
) => {
    const teams = await Team.find({ _id: { $in: project.teams || [] } })
        .select("members")
        .lean();
    const actorId = actor.toString();
    const recipients = new Set([
        ...(project.members || []).map((memberId) => memberId.toString()),
        ...teams.flatMap((team) => team.members.map(String)),
    ]);
    recipients.delete(actorId);

    await createBulkNotifications(
        [...recipients].map((recipient) => ({
            recipient,
            actor,
            type,
            title,
            message,
            relatedProject: deleted ? null : project._id,
            actionUrl: deleted ? "/projects" : `/projects/${project._id}`,
        }))
    );
};

/**
 * Upload an array of Multer files to Cloudinary.
 * Returns array of file metadata objects ready for `project.files.push(...)`.
 * On failure: best-effort cleanup of already-uploaded files → rethrow.
 */
const uploadFilesToCloudinary = async (localFiles, folder, userId) => {
    const uploaded = [];
    try {
        for (const f of localFiles) {
            const result = await uploadFileToCloudinary(f.path, folder);
            if (!result || !result.secure_url || !result.public_id) {
                throw new ApiError(500, "File upload failed");
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
                    (cleanupErr) => {
                        console.error(
                            "Cloudinary cleanup failed for",
                            u.publicId,
                            cleanupErr?.message
                        );
                    }
                )
            )
        );
        throw err;
    }
};

/* ============================================================
   CREATE PROJECT
   ------------------------------------------------------------
   Multipart form-data expected when files are present.
   Field `files` → array (max 5). Fields otherwise in req.body.
   teamIds may arrive as JSON string → parsed.
   ============================================================ */

const createProject = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
        repositoryUrl,
        teamIds,
    } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
        throw new ApiError(400, "Project name is required");
    }
    if (req.body.owner !== undefined) {
        throw new ApiError(403, "Project ownership cannot be set via request");
    }

    const parsedTeamIds = parseTeamIdsInput(teamIds);
    const validTeamIds = await validateAssignableTeams(req.user, parsedTeamIds);

    const parsedStart = parseOptionalDate(startDate, "startDate");
    const parsedDue = parseOptionalDate(dueDate, "dueDate");
    validateDateOrder(parsedStart, parsedDue);
    validateStatus(status);
    validatePriority(priority);

    const localFiles = req.files || [];
    if (localFiles.length > MAX_FILES_PER_REQUEST) {
        throw new ApiError(
            400,
            `Maximum ${MAX_FILES_PER_REQUEST} files per request`
        );
    }
    if (localFiles.length > MAX_FILES_PER_PROJECT) {
        throw new ApiError(
            400,
            `Maximum ${MAX_FILES_PER_PROJECT} files per project`
        );
    }

    // Step 1: create project shell
    let project;
    try {
        project = await Project.create({
            name: name.trim(),
            description: description ? String(description).trim() : "",
            owner: req.user._id,
            members: [req.user._id],
            teams: validTeamIds || [],
            status: status || "active",
            priority: priority || "medium",
            startDate: parsedStart,
            dueDate: parsedDue,
            repositoryUrl: repositoryUrl ? String(repositoryUrl).trim() : "",
            files: [],
        });
    } catch (err) {
        console.error("createProject: create failed", err);
        throw new ApiError(500, "Could not create project");
    }

    // Step 2: upload files if any
    if (localFiles.length > 0) {
        const folder = buildCloudinaryFolder({
            entityType: "projects",
            userId: req.user._id.toString(),
            projectId: project._id.toString(),
        });

        try {
            const uploaded = await uploadFilesToCloudinary(
                localFiles,
                folder,
                req.user._id
            );
            project.files = uploaded;
            await project.save();
        } catch (err) {
            console.error("createProject: upload failed, rolling back", err);
            try {
                await project.deleteOne();
            } catch (delErr) {
                console.error(
                    "createProject: rollback failed; project orphan:",
                    project._id,
                    delErr?.message
                );
                throw new ApiError(
                    500,
                    `File upload failed and project rollback failed. Project ID: ${project._id}`
                );
            }
            throw new ApiError(
                500,
                "File upload failed; project was not created"
            );
        }
    }

    const populated = await populateProject(Project.findById(project._id));
    const visibleTeamIds = await filterVisibleTeams(req.user, populated);
    const response = populated.toObject();
    response.teams = (response.teams || []).filter((t) =>
        visibleTeamIds.includes(t._id.toString())
    );

    if (validTeamIds?.length) {
        await notifyProjectCollaborators(project, req.user._id, {
            type: "project_member_added",
            title: "Project added to your team",
            message: `"${project.name}" was added to one of your teams.`,
        });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, response, "Project created successfully"));
});

/* ============================================================
   LIST PROJECTS
   ============================================================ */

const getProjects = asyncHandler(async (req, res) => {
    let query;

    if (req.user.role === "admin") {
        query = {};
    } else {
        const accessibleTeamIds = await getAccessibleTeamIds(req.user);
        query = {
            $or: [
                { owner: req.user._id },
                { members: req.user._id },
                ...(accessibleTeamIds.length
                    ? [{ teams: { $in: accessibleTeamIds } }]
                    : []),
            ],
        };
    }

    const projects = await populateProject(
        Project.find(query).sort({ updatedAt: -1 })
    ).lean();

    const accessibleTeamIds = await getAccessibleTeamIds(req.user);
    const accessibleSet = new Set(accessibleTeamIds);
    const isAdmin = req.user.role === "admin";

    const scoped = projects.map((p) => {
        const ownerId = (p.owner?._id || p.owner)?.toString?.();
        const isOwner = ownerId && ownerId === req.user._id.toString();

        if (isAdmin || isOwner) return p;

        const teams = Array.isArray(p.teams) ? p.teams : [];
        return {
            ...p,
            teams: teams.filter((t) => accessibleSet.has(t._id.toString())),
        };
    });

    return res
        .status(200)
        .json(new ApiResponse(200, scoped, "Projects fetched successfully"));
});

/* ============================================================
   GET PROJECT BY ID
   ============================================================ */

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await populateProject(Project.findById(projectId));
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const canAccess = await userCanAccessProject(req.user, project);
    if (!canAccess) {
        throw new ApiError(403, "Access denied to this project");
    }

    const visibleTeamIds = await filterVisibleTeams(req.user, project);
    const response = project.toObject();
    response.teams = (response.teams || []).filter((t) =>
        visibleTeamIds.includes(t._id.toString())
    );

    return res
        .status(200)
        .json(new ApiResponse(200, response, "Project fetched successfully"));
});

/* ============================================================
   UPDATE PROJECT (metadata; files via dedicated endpoints)
   ============================================================ */
/* ============================================================
   UPDATE PROJECT (metadata + team assignment)
   ------------------------------------------------------------
   Authorization:
     - Admin, Project Owner:
         Can update everything (metadata + teamIds).
     - Team Owner / TeamProjectOwner
       of any team already in project.teams:
         Can ONLY update teamIds.
         Any other field in body → 403.
     - Project Member:
         Cannot update.
   ============================================================ */

const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const {
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
        repositoryUrl,
        teamIds,
    } = req.body;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const previousState = {
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate?.getTime() ?? null,
        dueDate: project.dueDate?.getTime() ?? null,
        repositoryUrl: project.repositoryUrl,
    };
    const previousTeamIds = project.teams.map((teamId) => teamId.toString());

    if (!isOwner && !isAdmin) {
        // Not project owner, not admin → allow only if user can manage
        // this project via team ownership or TeamProjectOwner.
        const canManage = await canManageProject(req.user, project);
        if (!canManage) {
            throw new ApiError(
                403,
                "Only project owner or admin can update this project"
            );
        }

        // Team Owner / TeamProjectOwner: restrict to teamIds only.
        const providedKeys = Object.keys(req.body);
        const unauthorizedKeys = providedKeys.filter(
            (k) => k !== "teamIds"
        );
        if (unauthorizedKeys.length > 0) {
            throw new ApiError(
                403,
                "You are only allowed to modify team assignments on this project"
            );
        }
    }

    if (req.body.owner !== undefined) {
        throw new ApiError(
            403,
            "Project ownership cannot be changed via update"
        );
    }

    const parsedTeamIds = parseTeamIdsInput(teamIds);
    const validTeamIds = await validateAssignableTeams(
        req.user,
        parsedTeamIds
    );

    if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
            throw new ApiError(400, "Project name cannot be empty");
        }
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 100) {
            throw new ApiError(400, "Project name must be 2-100 characters");
        }
        project.name = trimmed;
    }

    if (description !== undefined) {
        if (description && String(description).length > 1000) {
            throw new ApiError(400, "Description too long");
        }
        project.description =
            typeof description === "string" ? description.trim() : "";
    }

    if (status !== undefined) project.status = validateStatus(status);
    if (priority !== undefined) project.priority = validatePriority(priority);

    let nextStart = project.startDate;
    let nextDue = project.dueDate;
    if (startDate !== undefined) {
        nextStart = parseOptionalDate(startDate, "startDate");
    }
    if (dueDate !== undefined) {
        nextDue = parseOptionalDate(dueDate, "dueDate");
    }
    validateDateOrder(nextStart, nextDue);
    if (startDate !== undefined) project.startDate = nextStart;
    if (dueDate !== undefined) project.dueDate = nextDue;

    if (repositoryUrl !== undefined) {
        project.repositoryUrl = repositoryUrl
            ? String(repositoryUrl).trim()
            : "";
    }

    if (validTeamIds !== undefined) {
        project.teams = validTeamIds;
    }

    await project.save();

    const populated = await populateProject(Project.findById(project._id));
    const visibleTeamIds = await filterVisibleTeams(req.user, populated);
    const response = populated.toObject();
    response.teams = (response.teams || []).filter((t) =>
        visibleTeamIds.includes(t._id.toString())
    );

    const currentTeamIds = project.teams.map((teamId) => teamId.toString());
    const addedTeamIds = currentTeamIds.filter((teamId) => !previousTeamIds.includes(teamId));
    const removedTeamIds = previousTeamIds.filter((teamId) => !currentTeamIds.includes(teamId));
    const changedDetails =
        previousState.name !== project.name ||
        previousState.description !== project.description ||
        previousState.status !== project.status ||
        previousState.priority !== project.priority ||
        previousState.startDate !== (project.startDate?.getTime() ?? null) ||
        previousState.dueDate !== (project.dueDate?.getTime() ?? null) ||
        previousState.repositoryUrl !== project.repositoryUrl;

    const [addedTeams, removedTeams, currentTeams] = await Promise.all([
        Team.find({ _id: { $in: addedTeamIds } }).select("members").lean(),
        Team.find({ _id: { $in: removedTeamIds } }).select("members").lean(),
        Team.find({ _id: { $in: currentTeamIds } }).select("members").lean(),
    ]);
    const notifications = [];
    const notifiedRecipients = new Set();
    const notifiedRecipientIds = new Set();
    const addTeamNotifications = (teams, type, title, message) => {
        for (const team of teams) {
            for (const memberId of team.members) {
                const recipient = memberId.toString();
                const notificationKey = `${recipient}:${type}`;
                if (
                    recipient === req.user._id.toString() ||
                    notifiedRecipients.has(notificationKey)
                ) {
                    continue;
                }
                notifiedRecipients.add(notificationKey);
                notifiedRecipientIds.add(recipient);
                notifications.push({
                    recipient,
                    actor: req.user._id,
                    type,
                    title,
                    message,
                    relatedProject: project._id,
                    actionUrl: type === "project_member_removed"
                        ? "/projects"
                        : `/projects/${project._id}`,
                });
            }
        }
    };

    addTeamNotifications(
        addedTeams,
        "project_member_added",
        "Project added to your team",
        `"${project.name}" was added to one of your teams.`
    );
    addTeamNotifications(
        removedTeams,
        "project_member_removed",
        "Project removed from your team",
        `"${project.name}" was removed from one of your teams.`
    );

    if (changedDetails) {
        const currentMembers = new Set([
            ...project.members.map((memberId) => memberId.toString()),
            ...currentTeams.flatMap((team) => team.members.map(String)),
        ]);
        for (const recipient of currentMembers) {
            const notificationKey = `${recipient}:project_updated`;
            if (
                recipient === req.user._id.toString() ||
                notifiedRecipientIds.has(recipient) ||
                notifiedRecipients.has(notificationKey)
            ) {
                continue;
            }
            notifiedRecipients.add(notificationKey);
            notifications.push({
                recipient,
                actor: req.user._id,
                type: "project_updated",
                title: "Project updated",
                message: `"${project.name}" was updated by ${req.user.fullName || "a team member"}.`,
                relatedProject: project._id,
                actionUrl: `/projects/${project._id}`,
            });
        }
    }

    await createBulkNotifications(notifications);

    return res
        .status(200)
        .json(new ApiResponse(200, response, "Project updated successfully"));
});

/* ============================================================
   ADD FILES
   ============================================================ */

const addProjectFiles = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const allowed = await canManageProject(req.user, project);
    if (!allowed) {
        throw new ApiError(
            403,
            "You are not authorized to manage this project"
        );
    }

    const localFiles = req.files || [];
    if (localFiles.length === 0) {
        throw new ApiError(400, "No files provided");
    }
    if (localFiles.length > MAX_FILES_PER_REQUEST) {
        throw new ApiError(
            400,
            `Maximum ${MAX_FILES_PER_REQUEST} files per request`
        );
    }

    const currentCount = (project.files || []).length;
    if (currentCount + localFiles.length > MAX_FILES_PER_PROJECT) {
        throw new ApiError(
            400,
            `Project can have at most ${MAX_FILES_PER_PROJECT} files`
        );
    }

    const folder = buildCloudinaryFolder({
        entityType: "projects",
        userId: req.user._id.toString(),
        projectId: project._id.toString(),
    });

    const uploaded = await uploadFilesToCloudinary(
        localFiles,
        folder,
        req.user._id
    );

    project.files = [...(project.files || []), ...uploaded];

    try {
        await project.save();
    } catch (err) {
        console.error("addProjectFiles: save failed, cleaning up", err);
        await Promise.all(
            uploaded.map((u) =>
                deleteFileFromCloudinary(u.publicId, u.resourceType).catch(
                    (cleanupErr) => {
                        console.error(
                            "addProjectFiles: cleanup failed",
                            u.publicId,
                            cleanupErr?.message
                        );
                    }
                )
            )
        );
        throw new ApiError(500, "Could not save project files");
    }

    await notifyProjectCollaborators(project, req.user._id, {
        title: "Project files updated",
        message: `Files were added to "${project.name}".`,
    });

    const populated = await populateProject(Project.findById(project._id));
    return res
        .status(200)
        .json(new ApiResponse(200, populated, "Files uploaded successfully"));
});

/* ============================================================
   DELETE FILE
   ------------------------------------------------------------
   Cloudinary delete FIRST, then DB pull.
   If Cloudinary delete fails → fail request, DB unchanged.
   ============================================================ */

const deleteProjectFile = asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;

    if (!isValidObjectId(projectId) || !isValidObjectId(fileId)) {
        throw new ApiError(400, "Invalid project or file id");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const allowed = await canManageProject(req.user, project);
    if (!allowed) {
        throw new ApiError(
            403,
            "You are not authorized to manage this project"
        );
    }

    const files = project.files || [];
    const target = files.find((f) => f._id.toString() === fileId);
    if (!target) {
        throw new ApiError(404, "File not found in this project");
    }

    try {
        await deleteFileFromCloudinary(target.publicId, target.resourceType);
    } catch (err) {
        console.error("deleteProjectFile: cloudinary delete failed", err);
        throw new ApiError(
            500,
            "Could not delete file from storage. Please try again."
        );
    }

    project.files = files.filter((f) => f._id.toString() !== fileId);

    try {
        await project.save();
    } catch (err) {
        console.error(
            "deleteProjectFile: DB save failed after Cloudinary delete. Orphaned asset:",
            target.publicId,
            err
        );
        throw new ApiError(
            500,
            "File removed from storage but database update failed. Please contact support."
        );
    }

    const populated = await populateProject(Project.findById(project._id));
    await notifyProjectCollaborators(project, req.user._id, {
        title: "Project files updated",
        message: `"${target.name}" was removed from "${project.name}".`,
    });
    return res
        .status(200)
        .json(new ApiResponse(200, populated, "File deleted successfully"));
});

/* ============================================================
   REPLACE FILE
   ------------------------------------------------------------
   1. Upload new file to Cloudinary
   2. Verify URL + publicId
   3. Update DB (replace metadata)
   4. Delete old file from Cloudinary
   If step 4 fails: DB is already updated; log orphan for cleanup.
   ============================================================ */

const replaceProjectFile = asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;

    if (!isValidObjectId(projectId) || !isValidObjectId(fileId)) {
        throw new ApiError(400, "Invalid project or file id");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const allowed = await canManageProject(req.user, project);
    if (!allowed) {
        throw new ApiError(
            403,
            "You are not authorized to manage this project"
        );
    }

    const localFiles = req.files || [];
    if (localFiles.length !== 1) {
        throw new ApiError(400, "Exactly one replacement file is required");
    }

    const files = project.files || [];
    const idx = files.findIndex((f) => f._id.toString() === fileId);
    if (idx === -1) {
        throw new ApiError(404, "File not found in this project");
    }

    const oldFile = files[idx];

    const folder = buildCloudinaryFolder({
        entityType: "projects",
        userId: req.user._id.toString(),
        projectId: project._id.toString(),
    });

    // Step 1: upload new (throws + cleans on failure)
    const [uploaded] = await uploadFilesToCloudinary(
        [localFiles[0]],
        folder,
        req.user._id
    );

    // Step 2: update DB
    project.files[idx] = uploaded;

    try {
        await project.save();
    } catch (err) {
        console.error(
            "replaceProjectFile: DB save failed; cleaning up new upload",
            err
        );
        await deleteFileFromCloudinary(
            uploaded.publicId,
            uploaded.resourceType
        ).catch((cleanupErr) => {
            console.error(
                "replaceProjectFile: cleanup of new upload failed",
                uploaded.publicId,
                cleanupErr?.message
            );
        });
        throw new ApiError(500, "Could not update project with new file");
    }

    // Step 3: delete old file (best-effort; do not fail the request)
    await deleteFileFromCloudinary(
        oldFile.publicId,
        oldFile.resourceType
    ).catch((cleanupErr) => {
        console.error(
            "replaceProjectFile: old file cleanup failed. Orphaned asset:",
            oldFile.publicId,
            cleanupErr?.message
        );
    });

    await notifyProjectCollaborators(project, req.user._id, {
        title: "Project files updated",
        message: `"${oldFile.name}" was replaced in "${project.name}".`,
    });

    const populated = await populateProject(Project.findById(project._id));
    return res
        .status(200)
        .json(new ApiResponse(200, populated, "File replaced successfully"));
});

/* ============================================================
   DELETE PROJECT
   ------------------------------------------------------------
   Best-effort Cloudinary cleanup of all files.
   Failed deletions logged with publicId for manual recovery.
   Project is deleted regardless.
   ============================================================ */

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new ApiError(
            403,
            "Only project owner or admin can delete this project"
        );
    }

    const files = project.files || [];
    const failedDeletions = [];

    if (files.length > 0) {
        const results = await Promise.allSettled(
            files.map((f) =>
                deleteFileFromCloudinary(f.publicId, f.resourceType)
            )
        );

        results.forEach((r, i) => {
            if (r.status === "rejected") {
                const f = files[i];
                failedDeletions.push({
                    publicId: f.publicId,
                    url: f.url,
                    resourceType: f.resourceType,
                    reason: r.reason?.message || "unknown",
                });
            }
        });

        if (failedDeletions.length > 0) {
            console.error(
                "deleteProject: orphaned Cloudinary assets (manual cleanup required):",
                JSON.stringify(failedDeletions, null, 2)
            );
        }
    }

    await project.deleteOne();

    await notifyProjectCollaborators(project, req.user._id, {
        title: "Project deleted",
        message: `The project "${project.name}" was deleted.`,
        deleted: true,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                projectId,
                filesDeleted: files.length - failedDeletions.length,
                filesOrphaned: failedDeletions.length,
                orphanedAssets:
                    failedDeletions.length > 0 ? failedDeletions : undefined,
            },
            "Project deleted successfully"
        )
    );
});

export {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    addProjectFiles,
    deleteProjectFile,
    replaceProjectFile,
    deleteProject,
};