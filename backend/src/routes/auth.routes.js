import { Router } from "express";

import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    googleAuth,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = Router();

// Public Routes
router.post("/register",authLimiter, registerUser);
router.post("/login",authLimiter, loginUser);
router.post("/refresh-token", authLimiter,refreshAccessToken);
router.post("/google",authLimiter, googleAuth);
router.post("/forgot-password", authLimiter,forgotPassword);
router.post("/reset-password",authLimiter, resetPassword);

// Protected Route
router.post("/logout", verifyJWT, logoutUser);

export default router;