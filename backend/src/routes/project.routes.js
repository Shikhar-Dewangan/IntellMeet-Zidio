import { Router } from "express";

import {
    createProject,
    getTeamProjects,
    getProjectById,
    updateProject,
    deleteProject
} from "../controllers/project.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createProject);

router.get("/team/:teamId", getTeamProjects);
router.get("/:projectId", getProjectById);

router.patch("/:projectId", updateProject);

router.delete("/:projectId", deleteProject);

export default router;