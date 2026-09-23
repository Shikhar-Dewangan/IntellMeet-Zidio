import { Router } from "express";

import {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    inviteMember,
    removeMember
} from "../controllers/team.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createTeam);

router.get("/", getMyTeams);
router.get("/:teamId", getTeamById);

router.patch("/:teamId", updateTeam);

router.delete("/:teamId", deleteTeam);

router.post("/:teamId/invite", inviteMember);
router.delete("/:teamId/members/:userId", removeMember);

export default router;