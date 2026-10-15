import { Router } from "express";
import {
  getOverview,
  getTrends,
  getTeamsPerformance,
  getProjectsOverview,
  getRecentActivity,
  getUpcomingDeadlines,
} from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();


router.use(verifyJWT);

// GET /api/v1/analytics/overview
router.get("/overview", getOverview);

// GET /api/v1/analytics/trends?range=30d
router.get("/trends", getTrends);

// GET /api/v1/analytics/teams-performance
router.get("/teams-performance", getTeamsPerformance);

// GET /api/v1/analytics/projects-overview
router.get("/projects-overview", getProjectsOverview);

// GET /api/v1/analytics/recent-activity?limit=10
router.get("/recent-activity", getRecentActivity);

// GET /api/v1/analytics/upcoming-deadlines?limit=10
router.get("/upcoming-deadlines", getUpcomingDeadlines);

export default router;