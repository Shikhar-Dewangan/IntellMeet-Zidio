import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { getSocketServer } from "../sockets/socket.js";

/**
 * Creates a persistent notification and emits it to the recipient's socket room.
 * Call this only after the related business action succeeds.
 */
const createNotification = async ({
  recipient,
  actor = null,
  type = "other",
  title,
  message,
  relatedMeeting = null,
  relatedProject = null,
  relatedTask = null,
  relatedTeam = null,
  entityType = null,
  entityId = null,
  actionUrl = null,
}) => {
  if (
    !recipient ||
    !mongoose.Types.ObjectId.isValid(recipient) ||
    !type ||
    !title ||
    !message
  ) {
    console.error("createNotification: invalid or missing required fields");
    return null;
  }

  try {
    const notification = await Notification.create({
      recipient,
      actor,
      type,
      title,
      message,
      relatedMeeting,
      relatedProject,
      relatedTask,
      relatedTeam,
      entityType,
      entityId,
      actionUrl,
    });

    const populated = await Notification.findById(notification._id)
      .populate("recipient", "fullName email avatar")
      .populate("actor", "fullName email avatar")
      .populate("relatedMeeting", "title status scheduledAt")
      .populate("relatedProject", "name status")
      .populate("relatedTask", "title status priority")
      .populate("relatedTeam", "name");

    const io = getSocketServer();
    const recipientId = populated?.recipient?._id?.toString() || recipient.toString();

    if (io) {
      io.to(`user:${recipientId}`).emit("notification:new", populated);
    }

    return populated;
  } catch (error) {
    // A notification failure must not undo a successfully completed business action.
    console.error("createNotification failed:", error.message);
    return null;
  }
};

const createBulkNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];

  const results = await Promise.all(
    notifications.map((notification) => createNotification(notification))
  );

  return results.filter(Boolean);
};

export { createNotification, createBulkNotifications };
