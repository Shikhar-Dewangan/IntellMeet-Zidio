import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Notification from "../models/notification.model.js";

// Get My Notifications
const getMyNotifications = asyncHandler(async (req, res) => {
    // logic
});

// Get Unread Notifications
const getUnreadNotifications = asyncHandler(async (req, res) => {
    // logic
});

// Mark Notification As Read
const markNotificationAsRead = asyncHandler(async (req, res) => {
    // logic
});

// Mark All Notifications As Read
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    // logic
});

// Delete Notification
const deleteNotification = asyncHandler(async (req, res) => {
    // logic
});

export {
    getMyNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};