import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
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
            maxlength: 2000,
            default: "",
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "completed"],
            default: "todo",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            default: null,
        },
        actionItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ActionItem",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

taskSchema.pre("save", function (next) {
    if (this.status === "completed") {
        this.completedAt = this.completedAt || new Date();
    } else {
        this.completedAt = null;
    }

    next();
});

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index(
    { actionItem: 1 },
    { unique: true, partialFilterExpression: { actionItem: { $type: "objectId" } } }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;