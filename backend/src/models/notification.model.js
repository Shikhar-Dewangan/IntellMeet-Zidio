import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        // Meetings
        "meeting_invitation",
        "meeting_invitation_accepted",
        "meeting_invitation_rejected",
        "meeting_reminder",
        "meeting_started",
        "meeting_cancelled",
        "meeting_ended",
        "meeting_updated",
        // Teams and permissions
        "team_member_added",
        "team_member_removed",
        "project_owner_granted",
        "project_owner_revoked",
        // Projects
        "project_invitation",
        "project_updated",
        "project_member_added",
        "project_member_removed",
        // Tasks
        "task_assigned",
        "task_reassigned",
        "task_updated",
        "task_completed",
        // AI
        "ai_summary_ready",
        "ai_summary_failed",
        "ai_action_items_ready",
        "ai_task_created",
        // Fallback
        "other",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    relatedMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    relatedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    // Optional generic target for future entity types.
    entityType: {
      type: String,
      enum: ["meeting", "project", "task", "team", "ai_summary", "other", null],
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
