import { Router } from "express";

import {
    getCurrentUser,
    getUserById,
    updateProfile,
    updateAppearance,
    updateAvatar,
    updatePhone,
    updateLocation,
    searchUsers,
} from "../controllers/user.controller.js";

import {  verifyJWT } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/multer.middleware.js";

const router = Router();

router.get("/me", verifyJWT, getCurrentUser);

router.use(verifyJWT);

// ✅ SPECIFIC routes PEHLE
router.get("/search", searchUsers);        // ← ye upar le aao
router.patch("/profile", updateProfile);
router.patch("/appearance", updateAppearance);
router.patch("/avatar", uploadSingle("avatar"), updateAvatar);
router.patch("/phone", updatePhone);
router.patch("/location", updateLocation);

// ✅ DYNAMIC routes LAST mein
router.get("/:userId", getUserById);       // ← ye neeche rakh do

export default router;