import express from "express";

import {verifyJWT} from "../middleware/auth.middleware.js";

import {
    getMeetingAIInsight,
} from "../controllers/aiInsight.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get(
    "/:meetingId",
    getMeetingAIInsight
);

export default router;