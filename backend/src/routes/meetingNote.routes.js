import { Router } from "express";

import {
    createMeetingNote,
    getMeetingNotes,
    getMeetingNoteById,
    updateMeetingNote,
    deleteMeetingNote,
} from "../controllers/meetingNote.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(createMeetingNote);

router.get("/meeting/:meetingId", getMeetingNotes);
router.get("/:noteId", getMeetingNoteById);

router.route("/:noteId")
    .patch(updateMeetingNote)
    .delete(deleteMeetingNote);

export default router;