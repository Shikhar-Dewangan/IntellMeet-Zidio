import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Team from "../models/team.model.js";

// Create Team
const createTeam = asyncHandler(async (req, res) => {
    // logic
});

// Get My Teams
const getMyTeams = asyncHandler(async (req, res) => {
    // logic
});

// Get Team By ID
const getTeamById = asyncHandler(async (req, res) => {
    // logic
});

// Update Team
const updateTeam = asyncHandler(async (req, res) => {
    // logic
});

// Delete Team
const deleteTeam = asyncHandler(async (req, res) => {
    // logic
});

// Invite Member
const inviteMember = asyncHandler(async (req, res) => {
    // logic
});

// Remove Member
const removeMember = asyncHandler(async (req, res) => {
    // logic
});

export {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    inviteMember,
    removeMember
};