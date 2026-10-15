import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "meeting_invitation",
                "meeting_reminder",
                "task_assigned",
                "task_updated",
                "project_invitation",
                "other",
            ],
            required: true,
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
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;