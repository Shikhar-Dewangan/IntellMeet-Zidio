// backend/utils/projectAuth.util.js
import Team from "../models/team.model.js";
import TeamProjectOwner from "../models/teamProjectOwner.model.js";
import ApiError from "./ApiError.js";

/**
 * Can the user MODIFY the project (metadata + files)?
 *
 * Allowed:
 *   - admin
 *   - project.owner
 *   - team.owner of ANY team in project.teams
 *   - TeamProjectOwner of ANY team in project.teams (live membership)
 */
export const canManageProject = async (user, project) => {
    if (!user || !project) return false;
    if (user.role === "admin") return true;

    const userId = user._id.toString();
    const ownerId = (project.owner?._id || project.owner)?.toString?.();
    if (ownerId && ownerId === userId) return true;

    const teamIds = Array.isArray(project.teams)
        ? project.teams
              .map((t) => (t?._id || t)?.toString?.())
              .filter(Boolean)
        : [];

    if (teamIds.length === 0) return false;

    const teams = await Team.find(
        { _id: { $in: teamIds } },
        { _id: 1, owner: 1, members: 1 }
    ).lean();

    if (teams.length === 0) return false;

    for (const t of teams) {
        if (t.owner.toString() === userId) return true;
    }

    const tpoRecords = await TeamProjectOwner.find(
        { user: user._id, team: { $in: teamIds } },
        { team: 1 }
    ).lean();

    if (tpoRecords.length === 0) return false;

    const userTeamIds = new Set(tpoRecords.map((r) => r.team.toString()));

    for (const t of teams) {
        const tid = t._id.toString();
        if (!userTeamIds.has(tid)) continue;
        const isMember = (t.members || []).some(
            (m) => m.toString() === userId
        );
        if (isMember) return true;
    }

    return false;
};

export const requireProjectManage = async (user, project) => {
    const ok = await canManageProject(user, project);
    if (!ok) {
        throw new ApiError(
            403,
            "You are not authorized to manage this project"
        );
    }
};