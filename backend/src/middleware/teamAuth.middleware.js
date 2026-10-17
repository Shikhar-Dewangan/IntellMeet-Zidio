// backend/middleware/teamAuth.middleware.js
import Team from "../models/team.model.js";
import TeamProjectOwner from "../models/teamProjectOwner.model.js";
import ApiError from "../utils/ApiError.js";

/**
 * Whether the user is allowed to MANAGE a team (update, delete,
 * add/remove members, grant/revoke Project Owner).
 *
 * Allowed:
 *   - admin
 *   - team.owner
 */
export const canManageTeam = (team, user) => {
    const isOwner = team.owner.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    return isOwner || isAdmin;
};

/**
 * Whether the user has TEAM-SCOPED Project Owner authorization
 * for a specific team.
 *
 * Rules:
 *   - admin            → true
 *   - team.owner       → true (implicit, no record needed)
 *   - team.members     → must ALSO have a TeamProjectOwner record
 *   - other            → false
 *
 * IMPORTANT: We re-check that the user is STILL in team.members.
 * A stale TeamProjectOwner record must NOT grant access if the
 * user has been removed from the team.
 */
export const isTeamProjectOwner = async (user, teamId) => {
    if (!user) return false;
    if (user.role === "admin") return true;

    const team = await Team.findById(teamId);
    if (!team) return false;

    const userId = user._id.toString();

    // Team owner always has it (implicit)
    if (team.owner.toString() === userId) return true;

    // Must be a current member
    const isMember = (team.members || []).some(
        (m) => m.toString() === userId
    );
    if (!isMember) return false;

    // And must have an explicit TeamProjectOwner record
    const record = await TeamProjectOwner.findOne({
        team: teamId,
        user: user._id,
    }).lean();

    return !!record;
};

/**
 * Fetch the Team doc and enforce canManageTeam.
 * Throws ApiError(404) if team missing, ApiError(403) if not allowed.
 */
export const requireTeamManage = async (teamId, user) => {
    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }
    if (!canManageTeam(team, user)) {
        throw new ApiError(
            403,
            "You are not authorized to manage this team"
        );
    }
    return team;
};