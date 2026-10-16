import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Notification from "../models/notification.model.js";

const isValidNotificationId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const idString = (value) => (value?._id || value)?.toString();

const populateNotification = (query) =>
  query
    .populate("recipient", "fullName email avatar")
    .populate("actor", "fullName email avatar")
    .populate("relatedMeeting", "title status scheduledAt")
    .populate("relatedProject", "name status")
    .populate("relatedTask", "title status priority")
    .populate("relatedTeam", "name");

const getNotificationById = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!isValidNotificationId(notificationId)) {
    throw new ApiError(400, "Invalid notification id");
  }

  const notification = await populateNotification(
    Notification.findById(notificationId)
  );

  if (!notification) throw new ApiError(404, "Notification not found");

  // Notifications are private to their recipient, including for admins.
  if (idString(notification.recipient) !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to access this notification");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification fetched successfully"));
});

const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.unread === "true") filter.isRead = false;

  // Keep the original response shape (data is an array) so the existing
  // unwrapApiList frontend helper remains compatible.
  const notifications = await populateNotification(
    Notification.find(filter).sort({ createdAt: -1 }).limit(100)
  );

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const getUnreadNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 100);

  const notifications = await populateNotification(
    Notification.find({ recipient: req.user._id, isRead: false })
      .sort({ createdAt: -1 })
      .limit(limit)
  );

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Unread notifications fetched successfully"));
});

const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { count }, "Unread notification count fetched successfully"));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!isValidNotificationId(notificationId)) {
    throw new ApiError(400, "Invalid notification id");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: req.user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true, runValidators: true }
  );

  if (!notification) {
    // Do not reveal whether another user's notification exists.
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { modifiedCount: result.modifiedCount },
      "All notifications marked as read"
    )
  );
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!isValidNotificationId(notificationId)) {
    throw new ApiError(400, "Invalid notification id");
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user._id,
  });

  if (!notification) throw new ApiError(404, "Notification not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

export {
  getNotificationById,
  getMyNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
