import mongoose from "mongoose";

const actionItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000,
        },

        assigneeName: {
            type: String,
            default: null,
            trim: true,
            maxlength: 100,
        },

        dueDate: {
            type: Date,
            default: null,
        },
    },
    {
        _id: true,
    }
);

const aiInsightSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
            unique: true,
            index: true,
        },

        // Optional because recording is NOT required for AI.
        recording: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recording",
            default: null,
        },

        transcript: {
            type: String,
            required: true,
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

        decisions: {
            type: [String],
            default: [],
        },

        actionItems: {
            type: [actionItemSchema],
            default: [],
        },

        status: {
            type: String,
            enum: [
                "processing",
                "completed",
                "failed",
                "unavailable",
            ],
            default: "processing",
        },

        error: {
            type: String,
            default: "",
        },

        processedAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

const AIInsight = mongoose.model(
    "AIInsight",
    aiInsightSchema
);

export default AIInsight;