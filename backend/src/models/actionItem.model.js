import mongoose from "mongoose";

const actionItemSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            default: null,
        },
        recording: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recording",
            default: null,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
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
            maxlength: 2000,
            default: "",
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["open", "completed"],
            default: "open",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        source: {
            type: String,
            enum: ["manual", "ai"],
            default: "manual",
        },
        sourceKey: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

actionItemSchema.index({ meeting: 1, status: 1 });
actionItemSchema.index({ project: 1, status: 1 });
actionItemSchema.index({ assignee: 1 });
actionItemSchema.index({ createdBy: 1 });
actionItemSchema.index(
    { recording: 1, sourceKey: 1 },
    { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } }
);

const ActionItem = mongoose.model("ActionItem", actionItemSchema);

export default ActionItem;