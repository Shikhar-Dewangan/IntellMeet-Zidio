// backend/routes/search.routes.js
import { Router } from "express";
import { globalSearch } from "../controllers/search.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// GET /api/v1/search?q=...&limit=5
router.get("/", globalSearch);

export default router;