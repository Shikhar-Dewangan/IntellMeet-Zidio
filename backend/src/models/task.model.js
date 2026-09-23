import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
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

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
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
            enum: ["todo", "in-progress", "review", "done"],
            default: "todo",
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },

        dueDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;