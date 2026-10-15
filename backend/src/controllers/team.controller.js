import mongoose from "mongoose";

import Team from "../models/team.model.js";
import User from "../models/user.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";



//  Helper: Check Team Management Permission

//  Team owner can manage their own team.
//  Admin can manage any team.

const canManageTeam = (team, user) => {
    const isOwner =
        team.owner.toString() === user._id.toString();

    const isAdmin = user.role === "admin";

    return isOwner || isAdmin;
};


//  Create Team

//  Any authenticated user can create a team.
//  Creator automatically becomes owner + member.

const createTeam = asyncHandler(async (req, res) => {
    const { name, description, } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Team name is required");
    }

    const team = await Team.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id,
        members: [req.user._id],
    });

    const populatedTeam = await Team.findById(team._id)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    return res.status(201).json(
        new ApiResponse(
            201,
            populatedTeam,
            "Team created successfully"
        )
    );
});




//  Get My Teams
// 
//  Returns teams where:
//  - current user is owner
// - OR current user is a member
// 
// Admin also gets all teams.

const getMyTeams = asyncHandler(async (req, res) => {
    let teams;

    if (req.user.role === "admin") {
        teams = await Team.find({})
            .populate("owner", "fullName email avatar role")
            .populate("members", "fullName email avatar role")
            .sort({ createdAt: -1 });
    } else {
        teams = await Team.find({
            $or: [
                { owner: req.user._id },
                { members: req.user._id },
            ],
        })
            .populate("owner", "fullName email avatar role")
            .populate("members", "fullName email avatar role")
            .sort({ createdAt: -1 });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            teams,
            "Teams fetched successfully"
        )
    );
});



// Get Team By ID

// 
//  Allowed:
//  - Team owner
//  - Team member
//  - Admin

const getTeamById = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const userId = req.user._id.toString();

    const isOwner =
        team.owner._id.toString() === userId;

    const isMember = team.members.some(
        (member) => member._id.toString() === userId
    );

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isMember && !isAdmin) {
        throw new ApiError(
            403,
            "You are not authorized to view this team"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            team,
            "Team fetched successfully"
        )
    );
});



// | Update Team

//  Allowed:
//  - Team owner
//  - Admin

const updateTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    if (!canManageTeam(team, req.user)) {
        throw new ApiError(
            403,
            "You are not authorized to update this team"
        );
    }

    if (name !== undefined) {
        if (!name.trim()) {
            throw new ApiError(
                400,
                "Team name cannot be empty"
            );
        }

        team.name = name.trim();
    }

    if (description !== undefined) {
        team.description = description.trim();
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedTeam,
            "Team updated successfully"
        )
    );
});



//  Delete Team

//  DELETE /api/v1/teams/:teamId

//  Allowed:
//  - Team owner
// - Admin


const deleteTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    if (!canManageTeam(team, req.user)) {
        throw new ApiError(
            403,
            "You are not authorized to delete this team"
        );
    }

    await Team.findByIdAndDelete(teamId);

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Team deleted successfully"
        )
    );
});



// | Add Member


//  Allowed:
//  - Team owner
//  - Admin

const addMember = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    if (!canManageTeam(team, req.user)) {
        throw new ApiError(
            403,
            "You are not authorized to add members"
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.isActive) {
        throw new ApiError(
            400,
            "Cannot add an inactive user"
        );
    }

    const alreadyMember = team.members.some(
        (member) => member.toString() === userId.toString()
    );

    if (alreadyMember) {
        throw new ApiError(
            400,
            "User is already a member of this team"
        );
    }

    team.members.push(userId);

    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedTeam,
            "Member added successfully"
        )
    );
});



// | Remove Member

//  Allowed:
// - Team owner
// - Admin

//  Owner cannot be removed from their own team.

const removeMember = asyncHandler(async (req, res) => {
    const { teamId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    if (!canManageTeam(team, req.user)) {
        throw new ApiError(
            403,
            "You are not authorized to remove members"
        );
    }

    if (team.owner.toString() === userId.toString()) {
        throw new ApiError(
            400,
            "Team owner cannot be removed from the team"
        );
    }

    const memberExists = team.members.some(
        (member) => member.toString() === userId.toString()
    );

    if (!memberExists) {
        throw new ApiError(
            404,
            "User is not a member of this team"
        );
    }

    team.members = team.members.filter(
        (member) => member.toString() !== userId.toString()
    );

    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedTeam,
            "Member removed successfully"
        )
    );
});


export {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
};