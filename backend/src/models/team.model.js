import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
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

        avatar: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Team = mongoose.model("Team", teamSchema);

export default Team;