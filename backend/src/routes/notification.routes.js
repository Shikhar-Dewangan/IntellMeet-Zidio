import { Router } from "express";

import {
    getMyNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getMyNotifications);
router.get("/unread", getUnreadNotifications);

router.patch("/:notificationId/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);

router.delete("/:notificationId", deleteNotification);

export default router;