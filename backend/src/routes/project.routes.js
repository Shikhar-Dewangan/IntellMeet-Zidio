import { Router } from "express";

import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} from "../controllers/project.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(createProject)
    .get(getProjects);

router.route("/:projectId")
    .get(getProjectById)
    .patch(updateProject)
    .delete(deleteProject);

export default router;