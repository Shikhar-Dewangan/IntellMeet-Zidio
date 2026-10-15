// backend/controllers/analytics.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Project from "../models/project.model.js";
import Meeting from "../models/meeting.model.js";
import Task from "../models/task.model.js";
import ActionItem from "../models/actionItem.model.js";
import Team from "../models/team.model.js";

/* ============================================================
   HELPERS
   ============================================================ */
const groupedCounts = (rows) =>
    Object.fromEntries(
        rows.map(({ _id, count }) => [_id ?? "unknown", count])
    );

/**
 * Resolve the user's teams + team-derived project scope.
 *
 * Rules:
 *   - Teams: user is owner or member
 *   - Projects accessible:
 *       * user is project owner
 *       * user is project member
 *       * project.teams includes any of user's teams
 *   - Meetings accessible:
 *       * user is host
 *       * user is participant
 *   - Tasks visible (user-specific):
 *       * task.createdBy === user
 *       * task.assignee === user
 *       * task.team ∈ user's teams
 *       * task.project ∈ user's accessible projects
 *         (this stays but is scoped — see taskFilter below)
 */
const getUserScope = async (user) => {
    const userId = user._id;

    // Teams user is part of
    const teams = await Team.find(
        { $or: [{ owner: userId }, { members: userId }] },
        { _id: 1, owner: 1, members: 1, name: 1 }
    ).lean();

    const teamIds = teams.map((t) => t._id);

    // Accessible projects (owned / member / team-linked)
    const projects = await Project.find(
        {
            $or: [
                { owner: userId },
                { members: userId },
                ...(teamIds.length ? [{ teams: { $in: teamIds } }] : []),
            ],
        },
        { _id: 1 }
    ).lean();

    const projectIds = projects.map((p) => p._id);

    // Accessible meetings (host / participant)
    const meetings = await Meeting.find(
        { $or: [{ host: userId }, { participants: userId }] },
        { _id: 1 }
    ).lean();

    const meetingIds = meetings.map((m) => m._id);

    /**
     * User-specific task filter — ONLY tasks the user is directly
     * involved in OR belong to their teams.
     *
     * This is stricter than "any task in my projects".
     */
    const taskFilter = {
        $or: [
            { createdBy: userId },
            { assignee: userId },
            ...(teamIds.length ? [{ team: { $in: teamIds } }] : []),
            ...(projectIds.length
                ? [{ project: { $in: projectIds } }]
                : []),
        ],
    };

    /**
     * Project filter — user-owned / member / team-linked.
     */
    const projectFilter = {
        $or: [
            { owner: userId },
            { members: userId },
            ...(teamIds.length ? [{ teams: { $in: teamIds } }] : []),
        ],
    };

    /**
     * Meeting filter — host / participant only.
     */
    const meetingFilter = {
        $or: [{ host: userId }, { participants: userId }],
    };

    /**
     * Action items — user's own or those linked to their
     * projects / meetings.
     */
    const actionItemFilter = {
        $or: [
            { createdBy: userId },
            { assignee: userId },
            ...(projectIds.length
                ? [{ project: { $in: projectIds } }]
                : []),
            ...(meetingIds.length
                ? [{ meeting: { $in: meetingIds } }]
                : []),
        ],
    };

    return {
        userId,
        teamIds,
        teamDocs: teams,
        projectIds,
        meetingIds,
        taskFilter,
        projectFilter,
        meetingFilter,
        actionItemFilter,
    };
};

// Get date range based on `range` query param
const getDateRange = (range = "30d") => {
    const now = new Date();
    const start = new Date();
    switch (range) {
        case "7d":
            start.setDate(now.getDate() - 7);
            break;
        case "30d":
            start.setDate(now.getDate() - 30);
            break;
        case "90d":
            start.setDate(now.getDate() - 90);
            break;
        case "all":
            return { start: new Date(0), end: now };
        default:
            start.setDate(now.getDate() - 30);
    }
    return { start, end: now };
};

/* ============================================================
   1. OVERVIEW — Stat Cards + Basic Counts (user-scoped)
   ============================================================ */
const getOverview = asyncHandler(async (req, res) => {
    const scope = await getUserScope(req.user);

    const [
        teams,
        projects,
        meetings,
        tasks,
        actionItems,
        meetingStatuses,
        taskStatuses,
        actionItemStatuses,
        completedMeetingDurations,
    ] = await Promise.all([
        // Teams user is part of
        Team.countDocuments({
            $or: [{ owner: req.user._id }, { members: req.user._id }],
        }),
        // Projects user is directly involved in
        Project.countDocuments(scope.projectFilter),
        // Meetings user hosted or attended
        Meeting.countDocuments(scope.meetingFilter),
        // Tasks user created / assigned / team-scoped
        Task.countDocuments(scope.taskFilter),
        ActionItem.countDocuments(scope.actionItemFilter),
        Meeting.aggregate([
            { $match: scope.meetingFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Task.aggregate([
            { $match: scope.taskFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        ActionItem.aggregate([
            { $match: scope.actionItemFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Meeting.aggregate([
            {
                $match: {
                    ...scope.meetingFilter,
                    status: "completed",
                    startedAt: { $type: "date" },
                    endedAt: { $type: "date" },
                },
            },
            {
                $group: {
                    _id: null,
                    averageDurationMs: {
                        $avg: { $subtract: ["$endedAt", "$startedAt"] },
                    },
                },
            },
        ]),
    ]);

    const meetingCounts = groupedCounts(meetingStatuses);
    const taskCounts = groupedCounts(taskStatuses);
    const actionItemCounts = groupedCounts(actionItemStatuses);
    const averageMeetingDurationMs = Math.round(
        completedMeetingDurations[0]?.averageDurationMs || 0
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                teams: { total: teams },
                projects: { total: projects },
                meetings: {
                    total: meetings,
                    byStatus: meetingCounts,
                    averageCompletedDurationMs: averageMeetingDurationMs,
                },
                tasks: {
                    total: tasks,
                    byStatus: taskCounts,
                },
                actionItems: {
                    total: actionItems,
                    byStatus: actionItemCounts,
                },
            },
            "Analytics overview fetched successfully"
        )
    );
});

/* ============================================================
   2. TRENDS — Time-series (user-scoped)
   ============================================================ */
const getTrends = asyncHandler(async (req, res) => {
    const range = req.query.range || "30d";
    const { start, end } = getDateRange(range);
    const scope = await getUserScope(req.user);

    const [meetingTrend, projectTrend, taskTrend] = await Promise.all([
        Meeting.aggregate([
            {
                $match: {
                    ...scope.meetingFilter,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Project.aggregate([
            {
                $match: {
                    ...scope.projectFilter,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Task.aggregate([
            {
                $match: {
                    ...scope.taskFilter,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    // Full day-by-day series with 0s
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        days.push(cursor.toISOString().split("T")[0]);
        cursor.setDate(cursor.getDate() + 1);
    }

    const meetingMap = Object.fromEntries(
        meetingTrend.map((m) => [m._id, m.count])
    );
    const projectMap = Object.fromEntries(
        projectTrend.map((p) => [p._id, p.count])
    );
    const taskMap = Object.fromEntries(
        taskTrend.map((t) => [t._id, t.count])
    );

    const data = days.map((date) => ({
        date,
        meetings: meetingMap[date] || 0,
        projects: projectMap[date] || 0,
        tasks: taskMap[date] || 0,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, { range, data }, "Trends fetched successfully"));
});

/* ============================================================
   3. TEAMS PERFORMANCE — Basic counts for user's teams only
   ------------------------------------------------------------
   Only returns teams the user is a member/owner of.
   Counts are team-scoped (via `teams` field on Project / Task),
   NOT loose "member of any project" counts.
   ============================================================ */
const getTeamsPerformance = asyncHandler(async (req, res) => {
    const scope = await getUserScope(req.user);

    if (scope.teamIds.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "Teams performance fetched"));
    }

    const teams = scope.teamDocs;

    const performance = await Promise.all(
        teams.map(async (team) => {
            const teamId = team._id;

            // Team-scoped counts (accurate; not member-based)
            const [
                projectCount,
                taskCount,
                completedTaskCount,
                meetingCount,
                memberCount,
            ] = await Promise.all([
                // Projects assigned to THIS team
                Project.countDocuments({ teams: teamId }),
                // Tasks belonging to THIS team
                Task.countDocuments({ team: teamId }),
                // Completed tasks of THIS team
                Task.countDocuments({ team: teamId, status: "completed" }),
                // Meetings involving any current member of this team
                // — meeting.team field does not exist, so we keep
                // member-based, but constrained to the team's members
                // only for a basic count.
                Meeting.countDocuments({
                    participants: {
                        $in: (team.members || []).map((m) => m._id || m),
                    },
                }),
                // member count
                Promise.resolve((team.members || []).length),
            ]);

            const progress =
                taskCount > 0
                    ? Math.round((completedTaskCount / taskCount) * 100)
                    : 0;

            return {
                _id: teamId,
                name: team.name,
                memberCount,
                projects: projectCount,
                meetings: meetingCount,
                tasks: taskCount,
                completedTasks: completedTaskCount,
                progress,
            };
        })
    );

    performance.sort((a, b) => b.progress - a.progress);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                performance.slice(0, 5),
                "Teams performance fetched"
            )
        );
});

/* ============================================================
   4. PROJECTS OVERVIEW — Donut (user-scoped)
   ============================================================ */
const getProjectsOverview = asyncHandler(async (req, res) => {
    const scope = await getUserScope(req.user);

    const statuses = await Project.aggregate([
        { $match: scope.projectFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = groupedCounts(statuses);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return res.status(200).json(
        new ApiResponse(
            200,
            { total, byStatus: counts },
            "Projects overview fetched"
        )
    );
});

/* ============================================================
   5. RECENT ACTIVITY — Feed (user-scoped)
   ============================================================ */
const getRecentActivity = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    const scope = await getUserScope(req.user);

    const [meetings, projects, tasks] = await Promise.all([
        Meeting.find(scope.meetingFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("host", "fullName avatar")
            .select("title status createdAt host")
            .lean(),
        Project.find(scope.projectFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("owner", "fullName avatar")
            .select("name status createdAt owner")
            .lean(),
        Task.find(scope.taskFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("assignee", "fullName avatar")
            .select("title status priority createdAt assignee")
            .lean(),
    ]);

    const activities = [
        ...meetings.map((m) => ({
            _id: m._id,
            type: "meeting",
            title: m.title,
            status: m.status,
            user: m.host,
            createdAt: m.createdAt,
        })),
        ...projects.map((p) => ({
            _id: p._id,
            type: "project",
            title: p.name,
            status: p.status,
            user: p.owner,
            createdAt: p.createdAt,
        })),
        ...tasks.map((t) => ({
            _id: t._id,
            type: "task",
            title: t.title,
            status: t.status,
            priority: t.priority,
            user: t.assignee,
            createdAt: t.createdAt,
        })),
    ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

    return res
        .status(200)
        .json(new ApiResponse(200, activities, "Recent activity fetched"));
});

/* ============================================================
   6. UPCOMING DEADLINES — User-scoped tasks + meetings
   ============================================================ */
const getUpcomingDeadlines = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    const scope = await getUserScope(req.user);
    const now = new Date();

    const [tasks, meetings] = await Promise.all([
        Task.find({
            ...scope.taskFilter,
            status: { $ne: "completed" },
            dueDate: { $gte: now },
        })
            .sort({ dueDate: 1 })
            .limit(limit)
            .populate("assignee", "fullName avatar")
            .populate("project", "name")
            .select("title priority dueDate project assignee status")
            .lean(),
        Meeting.find({
            ...scope.meetingFilter,
            status: { $in: ["scheduled", "upcoming"] },
            scheduledAt: { $gte: now },
        })
            .sort({ scheduledAt: 1 })
            .limit(limit)
            .select("title scheduledAt status")
            .lean(),
    ]);

    const deadlines = [
        ...tasks.map((t) => ({
            _id: t._id,
            type: "task",
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate,
            project: t.project,
            assignee: t.assignee,
            status: t.status,
        })),
        ...meetings.map((m) => ({
            _id: m._id,
            type: "meeting",
            title: m.title,
            dueDate: m.scheduledAt,
            status: m.status,
        })),
    ]
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, limit);

    return res
        .status(200)
        .json(new ApiResponse(200, deadlines, "Upcoming deadlines fetched"));
});

export {
    getOverview,
    getTrends,
    getTeamsPerformance,
    getProjectsOverview,
    getRecentActivity,
    getUpcomingDeadlines,
};