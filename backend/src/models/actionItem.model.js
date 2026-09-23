import mongoose from "mongoose";

const actionItemSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        status: {
            type: String,
            enum: ["pending", "in-progress", "completed"],
            default: "pending",
        },

        dueDate: {
            type: Date,
            default: null,
        },

        source: {
            type: String,
            enum: ["manual", "ai"],
            default: "manual",
        },
    },
    {
        timestamps: true,
    }
);

const ActionItem = mongoose.model(
    "ActionItem",
    actionItemSchema
);

export default ActionItem;