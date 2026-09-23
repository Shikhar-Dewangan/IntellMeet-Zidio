import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import cookieParser from "cookie-parser";

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
    // logic
});

// Get User By ID
const getUserById = asyncHandler(async (req, res) => {
    // logic
});

// Update Profile
const updateProfile = asyncHandler(async (req, res) => {
    // logic
});

// Update Avatar
const updateAvatar = asyncHandler(async (req, res) => {
    // logic
});

// Update Phone
const updatePhone = asyncHandler(async (req, res) => {
    // logic
});

// Update Location
const updateLocation = asyncHandler(async (req, res) => {
    // logic
});

export {
    getCurrentUser,
    getUserById,
    updateProfile,
    updateAvatar,
    updatePhone,
    updateLocation
};