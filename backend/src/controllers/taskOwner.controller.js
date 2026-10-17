// backend/controllers/taskOwner.controller.js
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import Team from "../models/team.model.js";
import TeamTaskOwner from "../models/teamTaskOwner.model.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

/* ============================================================
   LIST TASK OWNERS FOR A TEAM
   ============================================================ */

const listTaskOwners = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    if (!isValidObjectId(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");

    const userId = req.user._id.toString();
    const isOwner = team.owner.toString() === userId;
    const isMember = (team.members || []).some(
        (m) => m.toString() === userId
    );
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isMember && !isAdmin) {
        throw new ApiError(403, "You are not authorized to view this team");
    }

    const records = await TeamTaskOwner.find({ team: teamId })
        .populate("user", "fullName email avatar role")
        .populate("grantedBy", "fullName email avatar role")
        .sort({ grantedAt: -1 })
        .lean();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                records,
                "Task Owner authorizations fetched"
            )
        );
});

/* ============================================================
   GRANT TASK OWNER
   Only team owner or admin
   ============================================================ */

const grantTaskOwner = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!isValidObjectId(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Valid userId is required");
    }

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");

    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        throw new ApiError(
            403,
            "Only the team owner or admin can grant Task Owner authorization"
        );
    }

    const targetId = userId.toString();

    // Target must not already be the team owner (implicit access)
    if (team.owner.toString() === targetId) {
        throw new ApiError(
            400,
            "Team owner already has full task permissions"
        );
    }

    // Target must be a current member
    const isMember = (team.members || []).some(
        (m) => m.toString() === targetId
    );
    if (!isMember) {
        throw new ApiError(400, "User must be a member of the team");
    }

    // Prevent duplicate
    const existing = await TeamTaskOwner.findOne({
        team: teamId,
        user: targetId,
    });
    if (existing) {
        throw new ApiError(
            400,
            "User is already a Task Owner in this team"
        );
    }

    let record;
    try {
        record = await TeamTaskOwner.create({
            team: teamId,
            user: targetId,
            grantedBy: req.user._id,
            grantedAt: new Date(),
        });
    } catch (err) {
        if (err?.code === 11000) {
            throw new ApiError(
                400,
                "User is already a Task Owner in this team"
            );
        }
        throw new ApiError(500, "Failed to grant authorization");
    }

    const populated = await TeamTaskOwner.findById(record._id)
        .populate("user", "fullName email avatar role")
        .populate("grantedBy", "fullName email avatar role");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                populated,
                "Task Owner authorization granted successfully"
            )
        );
});

/* ============================================================
   REVOKE TASK OWNER
   Only team owner or admin
   ============================================================ */

const revokeTaskOwner = asyncHandler(async (req, res) => {
    const { teamId, userId } = req.params;

    if (!isValidObjectId(teamId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid team or user ID");
    }

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");

    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        throw new ApiError(
            403,
            "Only the team owner or admin can revoke Task Owner authorization"
        );
    }

    const record = await TeamTaskOwner.findOne({
        team: teamId,
        user: userId,
    });
    if (!record) {
        throw new ApiError(404, "Authorization not found");
    }

    try {
        await record.deleteOne();
    } catch (err) {
        throw new ApiError(500, "Failed to revoke authorization");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Task Owner authorization revoked successfully"
            )
        );
});

export { listTaskOwners, grantTaskOwner, revokeTaskOwner };