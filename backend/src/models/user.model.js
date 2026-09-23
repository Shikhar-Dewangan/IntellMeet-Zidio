import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            select: false,
        },

        avatar: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        location: {
            type: String,
            default: "",
        },

        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member",
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        refreshToken: {
            type: String,
            select: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;