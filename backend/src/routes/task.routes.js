// backend/routes/task.routes.js
import { Router } from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    addTaskAttachments,
    deleteTaskAttachment,
    getTaskStats,
    getEligibleTeams,
    getEligibleProjects,
    getEligibleMembers,
} from "../controllers/task.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadTaskFilesMiddleware } from "../middleware/taskFileUpload.middleware.js";

const router = Router();

router.use(verifyJWT);

/* ---------- Specific routes FIRST ---------- */

router.get("/stats", getTaskStats);
router.get("/eligible-teams", getEligibleTeams);
router.get("/eligible-projects", getEligibleProjects);
router.get("/eligible-members", getEligibleMembers);

/* ---------- Collection ---------- */

router
    .route("/")
    .post(uploadTaskFilesMiddleware, createTask)
    .get(getTasks);

/* ---------- Single task ---------- */

router
    .route("/:taskId")
    .get(getTaskById)
    .patch(updateTask)
    .delete(deleteTask);

/* ---------- Task attachments ---------- */

router.post(
    "/:taskId/attachments",
    uploadTaskFilesMiddleware,
    addTaskAttachments
);

router.delete(
    "/:taskId/attachments/:attachmentId",
    deleteTaskAttachment
);

export default router;