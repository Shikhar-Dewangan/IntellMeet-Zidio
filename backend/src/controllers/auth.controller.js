import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User
const registerUser = asyncHandler(async (req, res) => {
    // logic
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
    // logic
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // logic
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
    // logic
});

// Google OAuth Login
const googleAuth = asyncHandler(async (req, res) => {
    // logic
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
    // logic
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    // logic
});

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    googleAuth,
    forgotPassword,
    resetPassword
};