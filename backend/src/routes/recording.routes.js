import { Router } from "express";

import {
    createRecording, 
    processRecording,
    getRecordings,
    getRecordingById,
    updateRecording,
    deleteRecording,
} from "../controllers/recording.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(uploadSingle("recording"), createRecording)
    .get(getRecordings);

router.post("/:recordingId/process", processRecording);

router.route("/:recordingId")
    .get(getRecordingById)
    .patch(updateRecording)
    .delete(deleteRecording);

export default router;
