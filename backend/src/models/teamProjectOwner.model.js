// backend/models/teamProjectOwner.model.js
import mongoose from "mongoose";

const teamProjectOwnerSchema = new mongoose.Schema(
    {
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        grantedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

teamProjectOwnerSchema.index({ team: 1, user: 1 }, { unique: true });

const TeamProjectOwner = mongoose.model(
    "TeamProjectOwner",
    teamProjectOwnerSchema
);

export default TeamProjectOwner;