import Notification from "../models/notification.model.js";
import { getSocketServer } from "../sockets/socket.js";

/**
 * Create a notification and emit via socket.
 *
 * @param {Object} payload
 * @param {String} payload.recipient - User ID
 * @param {String} payload.type - Notification type
 * @param {String} payload.title
 * @param {String} payload.message
 * @param {String} [payload.relatedMeeting]
 * @param {String} [payload.relatedProject]
 * @param {String} [payload.relatedTask]
 * @returns {Promise<Object|null>}
 */
const createNotification = async ({
    recipient,
    type,
    title,
    message,
    relatedMeeting = null,
    relatedProject = null,
    relatedTask = null,
}) => {
    if (!recipient || !type || !title || !message) {
        console.error("createNotification: missing required fields", {
            recipient,
            type,
            title,
            message,
        });
        return null;
    }

    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            relatedMeeting,
            relatedProject,
            relatedTask,
        });

        // Populate for socket emit
        const populated = await Notification.findById(notification._id)
            .populate("recipient", "fullName email avatar")
            .populate("relatedMeeting", "title status scheduledAt")
            .populate("relatedProject", "name status")
            .populate("relatedTask", "title status priority");

        // Emit real-time notification
        const io = getSocketServer();
        if (io) {
            io.to(`user:${recipient.toString()}`).emit(
                "notification:new",
                populated,
            );
        }

        return populated;
    } catch (error) {
        console.error("createNotification failed:", error.message);
        return null;
    }
};

/**
 * Create multiple notifications in bulk.
 */
const createBulkNotifications = async (notifications = []) => {
    const results = await Promise.all(
        notifications.map((data) => createNotification(data)),
    );
    return results.filter(Boolean);
};

export { createNotification, createBulkNotifications };