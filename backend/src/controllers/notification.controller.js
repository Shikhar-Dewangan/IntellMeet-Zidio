import mongoose from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Notification from "../models/notification.model.js";

const isValidNotificationId = (value) => mongoose.Types.ObjectId.isValid(value);
const idString = (value) => (value?._id || value)?.toString();

const getNotificationById = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!isValidNotificationId(notificationId)) {
        throw new ApiError(400, "Invalid notification id");
    }

    const notification = await Notification.findById(notificationId)
        .populate("recipient", "fullName email avatar")
        .populate("relatedMeeting", "title status scheduledAt")
        .populate("relatedProject", "name status")
        .populate("relatedTask", "title status priority");

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (req.user.role !== "admin" && idString(notification.recipient) !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to access this notification");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification fetched successfully"));
});

const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate("recipient", "fullName email avatar")
        .populate("relatedMeeting", "title status scheduledAt")
        .populate("relatedProject", "name status")
        .populate("relatedTask", "title status priority")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const getUnreadNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
        recipient: req.user._id,
        isRead: false,
    })
        .populate("recipient", "fullName email avatar")
        .populate("relatedMeeting", "title status scheduledAt")
        .populate("relatedProject", "name status")
        .populate("relatedTask", "title status priority")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Unread notifications fetched successfully"));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!isValidNotificationId(notificationId)) {
        throw new ApiError(400, "Invalid notification id");
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (req.user.role !== "admin" && notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this notification");
    }

    notification.isRead = true;
    await notification.save();

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, { modifiedCount: result.modifiedCount }, "All notifications marked as read"));
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!isValidNotificationId(notificationId)) {
        throw new ApiError(400, "Invalid notification id");
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (req.user.role !== "admin" && notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this notification");
    }

    await notification.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

export {
    getNotificationById,
    getMyNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
};