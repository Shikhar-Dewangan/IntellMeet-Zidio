import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Project from "../models/project.model.js";

const isValidProjectId = (projectId) => mongoose.Types.ObjectId.isValid(projectId);

const parseOptionalDate = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, `Invalid ${fieldName} value`);
    }

    return date;
};

const normalizeMemberIds = (members, ownerId) => {
    const uniqueMembers = new Set();
    const ownerIdString = ownerId?.toString();

    if (ownerIdString) {
        uniqueMembers.add(ownerIdString);
    }

    if (members === undefined) {
        return Array.from(uniqueMembers);
    }

    if (!Array.isArray(members)) {
        throw new ApiError(400, "Members must be an array of user IDs");
    }

    members.forEach((memberId) => {
        if (memberId === undefined || memberId === null || memberId === "") {
            return;
        }

        const candidate = memberId.toString();

        if (!mongoose.Types.ObjectId.isValid(candidate)) {
            throw new ApiError(400, `Invalid member ID: ${candidate}`);
        }

        uniqueMembers.add(candidate);
    });

    return Array.from(uniqueMembers);
};

const createProject = asyncHandler(async (req, res) => {
    const { name, description, status, priority, startDate, dueDate, repositoryUrl, members } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Project name is required");
    }

    const project = await Project.create({
        name: name.trim(),
        description: description ? description.trim() : "",
        owner: req.user._id,
        members: normalizeMemberIds(members, req.user._id),
        status: status || "active",
        priority: priority || "medium",
        startDate: parseOptionalDate(startDate, "startDate"),
        dueDate: parseOptionalDate(dueDate, "dueDate"),
        repositoryUrl: repositoryUrl ? repositoryUrl.trim() : "",
    });

    const populatedProject = await Project.findById(project._id)
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedProject, "Project created successfully"));
});

const getProjects = asyncHandler(async (req, res) => {
    const query = req.user.role === "admin"
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(query)
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar")
        .sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidProjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId)
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar");

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner?._id?.toString() === req.user._id.toString();
    const isMember = project.members.some((member) => member?._id?.toString() === req.user._id.toString());
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isMember && !isAdmin) {
        throw new ApiError(403, "Access denied to this project");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status, priority, startDate, dueDate, repositoryUrl, members } = req.body;

    if (!isValidProjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Only project owner or admin can update this project");
    }

    if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
            throw new ApiError(400, "Project name cannot be empty");
        }
        project.name = name.trim();
    }

    if (description !== undefined) {
        project.description = typeof description === "string" ? description.trim() : "";
    }

    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (startDate !== undefined) project.startDate = parseOptionalDate(startDate, "startDate");
    if (dueDate !== undefined) project.dueDate = parseOptionalDate(dueDate, "dueDate");
    if (repositoryUrl !== undefined) project.repositoryUrl = repositoryUrl ? repositoryUrl.trim() : "";

    if (members !== undefined) {
        project.members = normalizeMemberIds(members, project.owner);
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidProjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Only project owner or admin can delete this project");
    }

    await project.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

export {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};