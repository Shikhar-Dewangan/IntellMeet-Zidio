import express from "express";

import {verifyJWT} from "../middleware/auth.middleware.js";

import {
    transcribeLiveAudio,
} from "../controllers/liveTranscription.controller.js";

import {upload} from "../middleware/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
    "/:meetingId/chunk",
    upload.single("audio"),
    transcribeLiveAudio
);

export default router;