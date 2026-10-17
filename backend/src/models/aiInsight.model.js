// backend/models/aiInsight.model.js
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
            trim: true,
            default: "",
            maxlength: 2000,
        },
        owner: {
            type: String,
            trim: true,
            default: "Not assigned",
        },
        deadline: {
            type: String,
            trim: true,
            default: "Not specified",
        },
    },
    { _id: false }
);

const aiInsightSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
            unique: true,
        },
        transcript: {
            type: String,
            default: "",
        },
        summary: {
            type: String,
            default: "",
        },
        actionItems: {
            type: [actionItemSchema],
            default: [],
        },
        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "completed",
                "failed",
                "unavailable",
            ],
            default: "pending",
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
    { timestamps: true }
);

const AIInsight = mongoose.model("AIInsight", aiInsightSchema);

export default AIInsight;