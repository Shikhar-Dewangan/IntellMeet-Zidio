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

const router = Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected Route
router.post("/logout", verifyJWT, logoutUser);

export default router;