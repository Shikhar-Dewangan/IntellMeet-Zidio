// backend/controllers/team.controller.js
import mongoose from "mongoose";

import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import TeamProjectOwner from "../models/teamProjectOwner.model.js";
import TeamTaskOwner from "../models/teamTaskOwner.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createBulkNotifications, createNotification } from "../services/notification.service.js";

/* ============================================================
   Helpers
   ============================================================ */

const canManageTeam = (team, user) => {
    const isOwner = team.owner.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    return isOwner || isAdmin;
};

/* ============================================================
   Create Team
   ============================================================ */

const createTeam = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

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

    return res
        .status(201)
        .json(new ApiResponse(201, populatedTeam, "Team created successfully"));
});

/* ============================================================
   Get My Teams
   ------------------------------------------------------------
   Returns teams where user is owner or member. Admin → all.

   Enriched with:
     - projects count (team-scoped: Project.find({ teams: team._id }))
     - tasks count (team-scoped: Task.find({ team: team._id }))
     - members count
     - projectOwners count

   NOTE: Meetings count is intentionally NOT included. The Meeting
   model does not yet have a reliable team relationship. This will
   be added once meeting.model.js is verified.
   ============================================================ */

const getMyTeams = asyncHandler(async (req, res) => {
    const query =
        req.user.role === "admin"
            ? {}
            : {
                $or: [
                    { owner: req.user._id },
                    { members: req.user._id },
                ],
            };

    const teams = await Team.find(query)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role")
        .sort({ createdAt: -1 })
        .lean();

    const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
            const [projectCount, taskCount, projectOwnerCount] =
                await Promise.all([
                    Project.countDocuments({ teams: team._id }),
                    Task.countDocuments({ team: team._id }),
                    TeamProjectOwner.countDocuments({ team: team._id }),
                ]);

            return {
                ...team,
                stats: {
                    projects: projectCount,
                    tasks: taskCount,
                    members: team.members?.length || 0,
                    projectOwners: projectOwnerCount,
                },
            };
        })
    );

    return res
        .status(200)
        .json(new ApiResponse(200, enrichedTeams, "Teams fetched successfully"));
});

/* ============================================================
   Get Team By ID
   ------------------------------------------------------------
   Allowed: team owner, team member, admin.
   ============================================================ */

const getTeamById = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role")
        .lean();

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const userId = req.user._id.toString();
    const isOwner = team.owner._id.toString() === userId;
    const isMember = team.members.some((m) => m._id.toString() === userId);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isMember && !isAdmin) {
        throw new ApiError(403, "You are not authorized to view this team");
    }

    const [
        projectCount,
        taskCount,
        projectOwnerCount,
        recentProjects,
        recentTasks,
        projectOwners,
    ] = await Promise.all([
        Project.countDocuments({ teams: team._id }),
        Task.countDocuments({ team: team._id }),
        TeamProjectOwner.countDocuments({ team: team._id }),

        Project.find({ teams: team._id })
            .populate("owner", "fullName avatar")
            .populate("members", "fullName avatar")
            .sort({ updatedAt: -1 })
            .limit(3)
            .lean(),

        Task.find({ team: team._id })
            .populate("assignee", "fullName avatar")
            .populate("project", "name")
            .sort({ updatedAt: -1 })
            .limit(3)
            .lean(),

        TeamProjectOwner.find({ team: team._id })
            .populate("user", "fullName email avatar role")
            .populate("grantedBy", "fullName email avatar role")
            .sort({ grantedAt: -1 })
            .lean(),
    ]);

    const enrichedTeam = {
        ...team,
        stats: {
            projects: projectCount,
            tasks: taskCount,
            members: team.members.length,
            projectOwners: projectOwnerCount,
        },
        recentProjects,
        recentTasks,
        projectOwners,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, enrichedTeam, "Team fetched successfully"));
});

/* ============================================================
   Update Team
   ============================================================ */

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
        throw new ApiError(403, "You are not authorized to update this team");
    }

    if (name !== undefined) {
        if (!name.trim()) {
            throw new ApiError(400, "Team name cannot be empty");
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

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTeam, "Team updated successfully"));
});

/* ============================================================
   Delete Team
   ------------------------------------------------------------
   Sequential cleanup (no transactions — deployment type unverified):

     1. Pull teamId from all projects' teams arrays
     2. Delete all TeamProjectOwner records for this team
     3. Delete the team

   Failure handling:
     - If step 1 fails  → return 500, do NOT proceed
     - If step 2 fails  → return 500, do NOT proceed (step 1 already
                          succeeded; stale PO records may exist but
                          isTeamProjectOwner re-checks team.members,
                          so they cannot grant access)
     - If step 3 fails  → return 500 (orphan PO records + project refs
                          already cleaned; retry safe)

   Future improvement: wrap in MongoDB transaction once replica-set
   deployment is confirmed.
   ============================================================ */

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
        throw new ApiError(403, "You are not authorized to delete this team");
    }

    // Step 1: Remove team references from all projects
    try {
        await Project.updateMany(
            { teams: teamId },
            { $pull: { teams: teamId } }
        );
    } catch (err) {
        console.error("deleteTeam: project ref cleanup failed", err);
        throw new ApiError(
            500,
            "Failed to clean up project references. Team was not deleted."
        );
    }

    // Step 2: Delete TeamProjectOwner records for this team
    try {
        await TeamProjectOwner.deleteMany({ team: teamId });
    } catch (err) {
        console.error("deleteTeam: project-owner cleanup failed", err);
        throw new ApiError(
            500,
            "Failed to clean up team-scoped authorizations. Team was not deleted."
        );
    }

    // 🆕 Step 3: Delete TeamTaskOwner records for this team
    try {
        await TeamTaskOwner.deleteMany({ team: teamId });
    } catch (err) {
        console.error("deleteTeam: task-owner cleanup failed", err);
        throw new ApiError(
            500,
            "Failed to clean up task-owner authorizations. Team was not deleted."
        );
    }

    // Step 4: Delete team
    try {
        await Team.findByIdAndDelete(teamId);
    } catch (err) {
        console.error("deleteTeam: team deletion failed", err);
        throw new ApiError(500, "Failed to delete team");
    }

    await createBulkNotifications(
        team.members
            .filter((memberId) => memberId.toString() !== req.user._id.toString())
            .map((recipient) => ({
                recipient,
                actor: req.user._id,
                type: "team_member_removed",
                title: "Team deleted",
                message: `The "${team.name}" team was deleted.`,
                actionUrl: "/teams",
            }))
    );

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Team deleted successfully"));
});

/* ============================================================
   Add Member
   ============================================================ */

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
        throw new ApiError(403, "You are not authorized to add members");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (!user.isActive) {
        throw new ApiError(400, "Cannot add an inactive user");
    }

    const alreadyMember = team.members.some(
        (m) => m.toString() === userId.toString()
    );
    if (alreadyMember) {
        throw new ApiError(400, "User is already a member of this team");
    }

    team.members.push(userId);
    await team.save();

    const updatedTeam = await Team.findById(team._id)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    if (user._id.toString() !== req.user._id.toString()) {
        await createNotification({
            recipient: user._id,
            actor: req.user._id,
            type: "team_member_added",
            title: "Added to a team",
            message: `${req.user.fullName || "A team manager"} added you to "${team.name}".`,
            relatedTeam: team._id,
            actionUrl: `/teams/${team._id}`,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTeam, "Member added successfully"));
});

/* ============================================================
   Remove Member
   ------------------------------------------------------------
   Sequential cleanup (no transactions):

     1. Remove from team.members
     2. Delete TeamProjectOwner({team, user}) records

   Failure handling:
     - If step 1 fails  → return 500
     - If step 2 fails  → return 500; the removed member no longer
                          passes isTeamProjectOwner because that
                          helper re-checks team.members. Stale PO
                          record is harmless.
   ============================================================ */

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
        throw new ApiError(403, "You are not authorized to remove members");
    }
    if (team.owner.toString() === userId.toString()) {
        throw new ApiError(400, "Team owner cannot be removed from the team");
    }

    const memberExists = team.members.some(
        (m) => m.toString() === userId.toString()
    );
    if (!memberExists) {
        throw new ApiError(404, "User is not a member of this team");
    }

    // Step 1: Remove from team.members
    team.members = team.members.filter(
        (m) => m.toString() !== userId.toString()
    );
    try {
        await team.save();
    } catch (err) {
        console.error("removeMember: team save failed", err);
        throw new ApiError(500, "Failed to remove member from team");
    }

    // Step 2: Revoke team-scoped Project Owner authorization (if any)
    try {
        await TeamProjectOwner.deleteMany({
            team: teamId,
            user: userId,
        });
    } catch (err) {
        console.error("removeMember: PO cleanup failed", err);
        // User is already removed from team.members, so they cannot
        // use any stale PO record. Safe to continue.
    }

    const updatedTeam = await Team.findById(team._id)
        .populate("owner", "fullName email avatar role")
        .populate("members", "fullName email avatar role");

    if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
            recipient: userId,
            actor: req.user._id,
            type: "team_member_removed",
            title: "Removed from a team",
            message: `You were removed from "${team.name}".`,
            actionUrl: "/teams",
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTeam, "Member removed successfully"));
});

/* ============================================================
   Grant Team Project Owner
   ------------------------------------------------------------
   Only team owner or admin can grant.
   Target must be a current team member and not the team owner.
   ============================================================ */

const grantProjectOwner = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Valid userId is required");
    }

    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }
    if (!canManageTeam(team, req.user)) {
        throw new ApiError(
            403,
            "You are not authorized to grant Project Owner authorization"
        );
    }

    const targetUserId = userId.toString();

    if (team.owner.toString() === targetUserId) {
        throw new ApiError(
            400,
            "Team owner already has full permissions and cannot be granted additional scope"
        );
    }

    const isMember = team.members.some(
        (m) => m.toString() === targetUserId
    );
    if (!isMember) {
        throw new ApiError(400, "User must be a member of the team");
    }

    const existing = await TeamProjectOwner.findOne({
        team: teamId,
        user: targetUserId,
    });
    if (existing) {
        throw new ApiError(
            400,
            "User is already a Project Owner in this team"
        );
    }

    let record;
    try {
        record = await TeamProjectOwner.create({
            team: teamId,
            user: targetUserId,
            grantedBy: req.user._id,
            grantedAt: new Date(),
        });
    } catch (err) {
        // Handle race-condition duplicate key error
        if (err?.code === 11000) {
            throw new ApiError(
                400,
                "User is already a Project Owner in this team"
            );
        }
        console.error("grantProjectOwner: create failed", err);
        throw new ApiError(500, "Failed to grant authorization");
    }

    const populated = await TeamProjectOwner.findById(record._id)
        .populate("user", "fullName email avatar role")
        .populate("grantedBy", "fullName email avatar role");

    if (targetUserId !== req.user._id.toString()) {
        await createNotification({
            recipient: targetUserId,
            actor: req.user._id,
            type: "project_owner_granted",
            title: "Project Owner access granted",
            message: `You were granted Project Owner access in "${team.name}".`,
            relatedTeam: team._id,
            actionUrl: `/teams/${team._id}`,
        });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                populated,
                "Project Owner authorization granted successfully"
            )
        );
});

/* ============================================================
   Revoke Team Project Owner
   ============================================================ */

const revokeProjectOwner = asyncHandler(async (req, res) => {
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
            "You are not authorized to revoke Project Owner authorization"
        );
    }

    const existing = await TeamProjectOwner.findOne({
        team: teamId,
        user: userId,
    });
    if (!existing) {
        throw new ApiError(404, "Authorization not found");
    }

    try {
        await existing.deleteOne();
    } catch (err) {
        console.error("revokeProjectOwner: delete failed", err);
        throw new ApiError(500, "Failed to revoke authorization");
    }

    if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
            recipient: userId,
            actor: req.user._id,
            type: "project_owner_revoked",
            title: "Project Owner access revoked",
            message: `Your Project Owner access in "${team.name}" was revoked.`,
            relatedTeam: team._id,
            actionUrl: `/teams/${team._id}`,
        });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Project Owner authorization revoked successfully"
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
    grantProjectOwner,
    revokeProjectOwner,
};