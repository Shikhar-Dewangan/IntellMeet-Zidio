import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        meetingCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["scheduled", "live", "completed", "cancelled"],
            default: "scheduled",
        },

        scheduledAt: {
            type: Date,
        },

        startedAt: {
            type: Date,
        },

        endedAt: {
            type: Date,
        },

        recordingUrl: {
            type: String,
            default: "",
        },

        transcription: {
            type: String,
            default: "",
        },

        summary: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;