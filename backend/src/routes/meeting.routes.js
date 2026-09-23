import { Router } from "express";

import {
    createMeeting,
    getMeetingById,
    getMyMeetings,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    leaveMeeting
} from "../controllers/meeting.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createMeeting);

router.get("/", getMyMeetings);
router.get("/:meetingId", getMeetingById);

router.patch("/:meetingId", updateMeeting);

router.delete("/:meetingId", deleteMeeting);

router.post("/:meetingId/join", joinMeeting);
router.post("/:meetingId/leave", leaveMeeting);

export default router;