import { Router } from "express";

import {
    createActionItem,
    getMeetingActionItems,
    getMyActionItems,
    updateActionItem,
    deleteActionItem,
    assignActionItem,
    updateActionItemStatus
} from "../controllers/actionItem.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createActionItem);

router.get("/my", getMyActionItems);
router.get("/meeting/:meetingId", getMeetingActionItems);

router.patch("/:actionItemId", updateActionItem);

router.delete("/:actionItemId", deleteActionItem);

router.patch("/:actionItemId/assign", assignActionItem);
router.patch("/:actionItemId/status", updateActionItemStatus);

export default router;