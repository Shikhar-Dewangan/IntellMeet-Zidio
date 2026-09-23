import { Router } from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskStatus
} from "../controllers/task.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createTask);

router.get("/", getTasks);
router.get("/:taskId", getTaskById);

router.patch("/:taskId", updateTask);

router.delete("/:taskId", deleteTask);

router.patch("/:taskId/assign", assignTask);
router.patch("/:taskId/status", updateTaskStatus);

export default router;