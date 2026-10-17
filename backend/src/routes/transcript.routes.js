import express from "express";

import {verifyJWT} from "../middleware/auth.middleware.js";

import {
    createTranscriptSegment,
    fetchMeetingTranscript,
} from "../controllers/transcript.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
    "/:meetingId/segments",
    createTranscriptSegment
);

router.get(
    "/:meetingId",
    fetchMeetingTranscript
);

export default router;