import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Project from "../models/project.model.js";

// Create Project
const createProject = asyncHandler(async (req, res) => {
    // logic
});

// Get Team Projects
const getTeamProjects = asyncHandler(async (req, res) => {
    // logic
});

// Get Project By ID
const getProjectById = asyncHandler(async (req, res) => {
    // logic
});

// Update Project
const updateProject = asyncHandler(async (req, res) => {
    // logic
});

// Delete Project
const deleteProject = asyncHandler(async (req, res) => {
    // logic
});

export {
    createProject,
    getTeamProjects,
    getProjectById,
    updateProject,
    deleteProject
};