// backend/models/project.model.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
       
        teams: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Team",
            },
        ],
        meetings: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Meeting",
            },
        ],
        status: {
            type: String,
            enum: ["planning", "active", "completed", "archived"],
            default: "active",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        startDate: {
            type: Date,
        },
        dueDate: {
            type: Date,
        },
        repositoryUrl: {
            type: String,
            trim: true,
            default: "",
        },

        files: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 255,
                },
                url: {
                    type: String,
                    required: true,
                    trim: true,
                },
                publicId: {
                    type: String,
                    required: true,
                    trim: true,
                },
                /**
                 * Cloudinary resource_type:
                 *   "image" | "video" | "raw"
                 * PDFs/docs/archives fall under "raw"
                 */
                resourceType: {
                    type: String,
                    trim: true,
                    default: "raw",
                },
                mimeType: {
                    type: String,
                    trim: true,
                    default: "",
                },
                size: {
                    type: Number,
                    default: 0,
                },
                uploadedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ teams: 1 });
projectSchema.index({ meetings: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;