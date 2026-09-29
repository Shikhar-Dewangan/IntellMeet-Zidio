import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Project from "../models/project.model.js";
import Meeting from "../models/meeting.model.js";
import Task from "../models/task.model.js";
import ActionItem from "../models/actionItem.model.js";

const groupedCounts = (rows) => Object.fromEntries(rows.map(({ _id, count }) => [_id, count]));

const getOverview = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === "admin";
    const [projectIds, meetingIds] = isAdmin
        ? [null, null]
        : await Promise.all([
            Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] }, { _id: 1 }),
            Meeting.find({ $or: [{ host: req.user._id }, { participants: req.user._id }] }, { _id: 1 }),
        ]);

    const accessibleProjectIds = projectIds?.map(({ _id }) => _id);
    const accessibleMeetingIds = meetingIds?.map(({ _id }) => _id);
    const projectFilter = isAdmin
        ? {}
        : { _id: { $in: accessibleProjectIds } };
    const meetingFilter = isAdmin
        ? {}
        : { _id: { $in: accessibleMeetingIds } };
    const taskFilter = isAdmin
        ? {}
        : { project: { $in: accessibleProjectIds } };
    const actionItemFilter = isAdmin
        ? {}
        : {
            $or: [
                { createdBy: req.user._id },
                { assignee: req.user._id },
                { project: { $in: accessibleProjectIds } },
                { meeting: { $in: accessibleMeetingIds } },
            ],
        };

    const [projects, meetingStatuses, taskStatuses, actionItemStatuses, completedMeetingDurations] = await Promise.all([
        Project.countDocuments(projectFilter),
        Meeting.aggregate([
            { $match: meetingFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Task.aggregate([
            { $match: taskFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        ActionItem.aggregate([
            { $match: actionItemFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Meeting.aggregate([
            { $match: { ...meetingFilter, status: "completed", startedAt: { $type: "date" }, endedAt: { $type: "date" } } },
            { $group: { _id: null, averageDurationMs: { $avg: { $subtract: ["$endedAt", "$startedAt"] } } } },
        ]),
    ]);

    const meetingCounts = groupedCounts(meetingStatuses);
    const taskCounts = groupedCounts(taskStatuses);
    const actionItemCounts = groupedCounts(actionItemStatuses);
    const averageMeetingDurationMs = Math.round(completedMeetingDurations[0]?.averageDurationMs || 0);

    return res.status(200).json(
        new ApiResponse(200, {
            projects: { total: projects },
            meetings: {
                total: Object.values(meetingCounts).reduce((total, count) => total + count, 0),
                byStatus: meetingCounts,
                averageCompletedDurationMs: averageMeetingDurationMs,
            },
            tasks: {
                total: Object.values(taskCounts).reduce((total, count) => total + count, 0),
                byStatus: taskCounts,
            },
            actionItems: {
                total: Object.values(actionItemCounts).reduce((total, count) => total + count, 0),
                byStatus: actionItemCounts,
            },
        }, "Analytics overview fetched successfully")
    );
});

export { getOverview };
