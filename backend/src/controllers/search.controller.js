// backend/controllers/search.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import Task from "../models/task.model.js";
import Meeting from "../models/meeting.model.js";

/**
 * Global search across user's accessible teams, projects, tasks,
 * and meetings. Strictly user-scoped — no cross-team leakage.
 *
 * GET /api/v1/search?q=<query>&limit=5
 *
 * Response:
 *   {
 *     teams: [...],
 *     projects: [...],
 *     tasks: [...],
 *     meetings: [...],
 *   }
 */
const globalSearch = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const limit = Math.min(Number(req.query.limit) || 5, 10);

    if (!q || !q.trim()) {
        throw new ApiError(400, "Search query is required");
    }

    const query = q.trim();
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const userId = req.user._id;

    /* ============ USER SCOPE ============ */

    // User's teams
    const teams = await Team.find(
        { $or: [{ owner: userId }, { members: userId }] },
        { _id: 1, name: 1, description: 1, owner: 1, members: 1 }
    ).lean();

    const teamIds = teams.map((t) => t._id);

    // User's accessible projects
    const accessibleProjects = await Project.find(
        {
            $or: [
                { owner: userId },
                { members: userId },
                ...(teamIds.length ? [{ teams: { $in: teamIds } }] : []),
            ],
        },
        { _id: 1 }
    ).lean();

    const projectIds = accessibleProjects.map((p) => p._id);

    /* ============ SEARCH QUERIES ============ */

    const [teamResults, projectResults, taskResults, meetingResults] =
        await Promise.all([
            // Teams — user's own teams filtered by name/description
            Team.find({
                _id: { $in: teamIds },
                $or: [
                    { name: regex },
                    { description: regex },
                ],
            })
                .select("name description members owner")
                .limit(limit)
                .lean(),

            // Projects — accessible projects filtered by name/description
            Project.find({
                _id: { $in: projectIds },
                $or: [
                    { name: regex },
                    { description: regex },
                ],
            })
                .select("name description status priority teams")
                .limit(limit)
                .lean(),

            // Tasks — user's tasks (created/assigned/team-scoped)
            Task.find({
                $or: [
                    { createdBy: userId },
                    { assignee: userId },
                    ...(teamIds.length ? [{ team: { $in: teamIds } }] : []),
                    ...(projectIds.length
                        ? [{ project: { $in: projectIds } }]
                        : []),
                ],
                $and: [
                    {
                        $or: [
                            { title: regex },
                            { description: regex },
                        ],
                    },
                ],
            })
                .populate("project", "name")
                .populate("team", "name")
                .select("title description status priority project team")
                .limit(limit)
                .lean(),

            // Meetings — user hosted/attended, filtered by title/description
            Meeting.find({
                $or: [{ host: userId }, { participants: userId }],
                $and: [
                    {
                        $or: [
                            { title: regex },
                            { description: regex },
                        ],
                    },
                ],
            })
                .select("title description status scheduledAt")
                .limit(limit)
                .lean(),
        ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                query,
                teams: teamResults,
                projects: projectResults,
                tasks: taskResults,
                meetings: meetingResults,
            },
            "Search results fetched successfully"
        )
    );
});

export { globalSearch };