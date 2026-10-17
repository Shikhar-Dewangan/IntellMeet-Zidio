// backend/models/teamTaskOwner.model.js
import mongoose from "mongoose";

/**
 * Team-scoped Task Owner authorization.
 *
 * Grants TASK MANAGEMENT permission to a user, scoped ONLY to one
 * specific team. Does NOT grant global task rights. Does NOT grant
 * access to other teams' tasks.
 *
 * Lifecycle:
 *   - Granted by: team.owner OR admin
 *   - Revoked by: same
 *   - Effective only while the user remains a member of the team
 *     (live membership re-check on every authorization query)
 *   - Auto-cleaned when team deleted (handled in team controller)
 */
const teamTaskOwnerSchema = new mongoose.Schema(
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

teamTaskOwnerSchema.index({ team: 1, user: 1 }, { unique: true });

const TeamTaskOwner = mongoose.model(
    "TeamTaskOwner",
    teamTaskOwnerSchema
);

export default TeamTaskOwner;