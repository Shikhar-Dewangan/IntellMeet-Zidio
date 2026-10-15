import { Router } from "express";

import {
    createActionItem,
    getActionItems,
    getActionItemById,
    updateActionItem,
    deleteActionItem,
    convertActionItemToTask,
} from "../controllers/actionItem.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(createActionItem)
    .get(getActionItems);

router.post("/:actionItemId/convert-to-task", convertActionItemToTask);

router.route("/:actionItemId")
    .get(getActionItemById)
    .patch(updateActionItem)
    .delete(deleteActionItem);

export default router;