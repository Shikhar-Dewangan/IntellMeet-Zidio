import api from "./api.js";

export const getAnalyticsOverview = async () => {
  const response = await api.get("/analytics/overview");
  return response.data;
};
