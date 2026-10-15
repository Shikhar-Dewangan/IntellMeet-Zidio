import { Router } from "express";

import { getOverview } from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.get("/overview", getOverview);

export default router;
