// backend/utils/taskAuth.util.js
import mongoose from "mongoose";
import Team from "../models/team.model.js";
import TeamTaskOwner from "../models/teamTaskOwner.model.js";
import ApiError from "./ApiError.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ============================================================
   TASK MANAGEMENT AUTHORIZATION
   ------------------------------------------------------------
   A user can manage tasks in team T if ANY:
     - admin
     - team T's owner
     - user has a TeamTaskOwner record for T AND is still a member of T
   ============================================================ */

export const canManageTasksInTeam = async (user, teamId) => {
    if (!user || !teamId || !isValidId(teamId)) return false;
    if (user.role === "admin") return true;

    const team = await Team.findById(teamId, { owner: 1, members: 1 }).lean();
    if (!team) return false;

    const userId = user._id.toString();

    // Team owner
    if (team.owner.toString() === userId) return true;

    // Live membership check
    const isMember = (team.members || []).some(
        (m) => m.toString() === userId
    );
    if (!isMember) return false;

    // Task Owner grant
    const grant = await TeamTaskOwner.findOne(
        { team: teamId, user: user._id },
        { _id: 1 }
    ).lean();

    return !!grant;
};

/**
 * Return the list of team IDs where user can manage tasks.
 */
export const getTaskManageableTeamIds = async (user) => {
    if (!user) return [];
    if (user.role === "admin") {
        const all = await Team.find({}, { _id: 1 }).lean();
        return all.map((t) => t._id.toString());
    }

    const userId = user._id;

    // Owned teams
    const owned = await Team.find({ owner: userId }, { _id: 1 }).lean();
    const ownedSet = new Set(owned.map((t) => t._id.toString()));

    // Task Owner grants with live membership
    const grants = await TeamTaskOwner.find(
        { user: userId },
        { team: 1 }
    ).lean();

    const grantTeamIds = grants
        .map((g) => g.team.toString())
        .filter((id) => !ownedSet.has(id));

    if (grantTeamIds.length > 0) {
        const stillMember = await Team.find(
            { _id: { $in: grantTeamIds }, members: userId },
            { _id: 1 }
        ).lean();

        for (const t of stillMember) {
            ownedSet.add(t._id.toString());
        }
    }

    return Array.from(ownedSet);
};

/**
 * Throw 403 if user cannot manage tasks in the team.
 */
export const requireTaskManageInTeam = async (user, teamId) => {
    const ok = await canManageTasksInTeam(user, teamId);
    if (!ok) {
        throw new ApiError(
            403,
            "You are not authorized to manage tasks for this team"
        );
    }
};

/**
 * Verify a project belongs to a team (project.teams contains teamId).
 * Throws 400 if not linked.
 */
export const requireProjectLinkedToTeam = async (project, teamId) => {
    if (!project || !teamId) {
        throw new ApiError(400, "Project and team are required");
    }
    const teamIds = (project.teams || []).map((t) => t.toString());
    if (!teamIds.includes(teamId.toString())) {
        throw new ApiError(
            400,
            "Selected project is not linked to the selected team"
        );
    }
};

/**
 * Verify a user is a current member of a team.
 * Throws 400 if not.
 */
export const requireUserIsTeamMember = async (team, userId) => {
    if (!team) throw new ApiError(404, "Team not found");
    if (!userId || !isValidId(userId)) {
        throw new ApiError(400, "Valid assignee id is required");
    }
    const isMember = (team.members || []).some(
        (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
        throw new ApiError(
            400,
            "Assignee must be a current member of the team"
        );
    }
};