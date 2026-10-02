import api from "./api.js";

export const getMyNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

export const getUnreadNotifications = async () => {
  const response = await api.get("/notifications/unread");
  return response.data;
};

export const getNotificationById = async (notificationId) => {
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};
