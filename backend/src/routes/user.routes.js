import { Router } from "express";

import {
    getCurrentUser,
    getUserById,
    updateProfile,
    updateAvatar,
    updatePhone,
    updateLocation
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import {upload} from "../middleware/multer.middleware.js"

const router = Router();

router.use(verifyJWT);

router.get("/me", getCurrentUser);
router.get("/:userId", getUserById);

router.patch("/profile", updateProfile);
router.patch("/avatar",upload.single("avatar"), updateAvatar);
router.patch("/phone", updatePhone);
router.patch("/location", updateLocation);

export default router;