// backend/routes/team.routes.js
import { Router } from "express";

import {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    grantProjectOwner,
    revokeProjectOwner,
} from "../controllers/team.controller.js";

import taskOwnerRoutes from "./taskOwner.routes.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create team
router.post("/", createTeam);

// Get user's teams
router.get("/", getMyTeams);

// Get single team
router.get("/:teamId", getTeamById);

// Update team
router.patch("/:teamId", updateTeam);

// Delete team
router.delete("/:teamId", deleteTeam);

// Add member
router.post("/:teamId/members", addMember);

// Remove member
router.delete("/:teamId/members/:userId", removeMember);

// Grant Team Project Owner authorization (team owner or admin only)
router.post("/:teamId/project-owners", grantProjectOwner);

// Revoke Team Project Owner authorization (team owner or admin only)
router.delete("/:teamId/project-owners/:userId", revokeProjectOwner);

router.use("/", taskOwnerRoutes);

export default router;