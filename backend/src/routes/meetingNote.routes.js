import { Router } from "express";

import {
    createMeetingNote,
    getMeetingNotes,
    updateMeetingNote,
    deleteMeetingNote
} from "../controllers/meetingNote.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createMeetingNote);

router.get("/meeting/:meetingId", getMeetingNotes);

router.patch("/:noteId", updateMeetingNote);

router.delete("/:noteId", deleteMeetingNote);

export default router;