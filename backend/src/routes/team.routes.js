import { Router } from "express";

import {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
} from "../controllers/team.controller.js";

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
router.delete(
    "/:teamId/members/:userId",
    removeMember
);

export default router;