import mongoose from "mongoose";

const invitedUserSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    {
        _id: false,
    }
);

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 5000,
        },

        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        /*
         * Users who have actually joined/accepted the meeting.
         *
         * Host is added here automatically when the meeting
         * is created.
         */
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        /*
         * Invitation state lives inside Meeting.
         *
         * No separate MeetingInvitation model.
         */
        invitedUsers: {
            type: [invitedUserSchema],
            default: [],
        },

        /*
         * Optional project association.
         */
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },

        meetingCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },

        status: {
            type: String,
            enum: [
                "scheduled",
                "live",
                "completed",
                "cancelled",
            ],
            default: "scheduled",
            index: true,
        },

        scheduledAt: {
            type: Date,
            required: true,
            index: true,
        },

        startedAt: {
            type: Date,
            default: null,
        },

        endedAt: {
            type: Date,
            default: null,
        },

        /*
         * ------------------------------------------------------
         * Legacy fields
         * ------------------------------------------------------
         *
         * These are intentionally retained temporarily so older
         * frontend/backend code does not immediately break.
         *
         * They are NOT the source of truth for AI insights.
         *
         * New source of truth:
         * MeetingTranscript + AIInsight
         */

        transcription: {
            type: String,
            default: "",
        },

        summary: {
            type: String,
            default: "",
        },

        keyPoints: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

/*
 * Indexes
 */

meetingSchema.index({
    host: 1,
    scheduledAt: 1,
});

meetingSchema.index({
    participants: 1,
    scheduledAt: 1,
});

meetingSchema.index({
    "invitedUsers.user": 1,
});

meetingSchema.index({
    project: 1,
    scheduledAt: 1,
});

const Meeting = mongoose.model(
    "Meeting",
    meetingSchema
);

export default Meeting;