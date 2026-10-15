// backend/routes/taskOwner.routes.js
import { Router } from "express";

import {
    listTaskOwners,
    grantTaskOwner,
    revokeTaskOwner,
} from "../controllers/taskOwner.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

/**
 * Mount as: app.use("/api/v1/teams", taskOwnerRoutes)
 * OR mount separately: app.use("/api/v1/task-owners", taskOwnerRoutes)
 * Routes below use :teamId so they slot into teams router.
 */

router.get("/:teamId/task-owners", listTaskOwners);
router.post("/:teamId/task-owners", grantTaskOwner);
router.delete("/:teamId/task-owners/:userId", revokeTaskOwner);

export default router;