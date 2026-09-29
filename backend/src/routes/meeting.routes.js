import express from "express";

import {
    createMeeting,
    getMeetingById,
    getMyMeetings,
    updateMeeting,
    deleteMeeting,
    startMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
} from "../controllers/meeting.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

// All meeting routes require authentication
router.use(verifyJWT);

// Meeting CRUD
router.post("/", createMeeting);
router.get("/", getMyMeetings);
router.get("/:meetingId", getMeetingById);
router.patch("/:meetingId", updateMeeting);
router.delete("/:meetingId", deleteMeeting);

// Meeting lifecycle
router.post("/:meetingId/start", startMeeting);
router.post("/:meetingId/join", joinMeeting);
router.post("/:meetingId/leave", leaveMeeting);
router.post("/:meetingId/end", endMeeting);

export default router;