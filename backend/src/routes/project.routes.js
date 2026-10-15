// backend/routes/project.routes.js
import { Router } from "express";

import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    addProjectFiles,
    deleteProjectFile,
    replaceProjectFile,
    deleteProject,
} from "../controllers/project.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadProjectFilesMiddleware } from "../middleware/projectFileUpload.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create project (multipart when files present; JSON otherwise)
router
    .route("/")
    .post(uploadProjectFilesMiddleware, createProject)
    .get(getProjects);

// Single project CRUD
router
    .route("/:projectId")
    .get(getProjectById)
    .patch(updateProject)
    .delete(deleteProject);

// File operations
router.post(
    "/:projectId/files",
    uploadProjectFilesMiddleware,
    addProjectFiles
);

router.delete("/:projectId/files/:fileId", deleteProjectFile);

router.put(
    "/:projectId/files/:fileId",
    uploadProjectFilesMiddleware,
    replaceProjectFile
);

export default router;