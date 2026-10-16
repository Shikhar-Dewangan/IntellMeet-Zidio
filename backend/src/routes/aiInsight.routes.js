// backend/routes/aiInsight.routes.js
import { Router } from "express";
import {
    getMeetingAIInsight,
    generateMeetingAIInsight,
} from "../controllers/aiInsight.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/meetings/:meetingId", getMeetingAIInsight);
router.post("/meetings/:meetingId/generate", generateMeetingAIInsight);

export default router;