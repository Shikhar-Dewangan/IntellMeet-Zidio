import api from "./api.js";

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.patch("/users/profile", profileData);
  return response.data;
};

export const updateAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  const response = await api.patch("/users/avatar", formData);
  return response.data;
};

export const updatePhone = async (phone) => {
  const response = await api.patch("/users/phone", { phone });
  return response.data;
};

export const updateLocation = async (location) => {
  const response = await api.patch("/users/location", { location });
  return response.data;
};
