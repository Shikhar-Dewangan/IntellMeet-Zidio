import { Router } from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "../controllers/task.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(createTask)
    .get(getTasks);

router.route("/:taskId")
    .get(getTaskById)
    .patch(updateTask)
    .delete(deleteTask);

export default router;