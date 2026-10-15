import api from "./api.js";

export const getAnalyticsOverview = async () => {
  const response = await api.get("/analytics/overview");
  return response.data;
};

export const getAnalyticsTrends = async (range = "30d") => {
  const response = await api.get("/analytics/trends", {
    params: { range },
  });
  return response.data;
};

export const getTeamsPerformance = async () => {
  const response = await api.get("/analytics/teams-performance");
  return response.data;
};

export const getProjectsOverview = async () => {
  const response = await api.get("/analytics/projects-overview");
  return response.data;
};

export const getRecentActivity = async (limit = 10) => {
  const response = await api.get("/analytics/recent-activity", {
    params: { limit },
  });
  return response.data;
};

export const getUpcomingDeadlines = async (limit = 10) => {
  const response = await api.get("/analytics/upcoming-deadlines", {
    params: { limit },
  });
  return response.data;
};