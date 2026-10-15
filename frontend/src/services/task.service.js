// frontend/src/services/task.service.js
import api from "./api.js";

/* ============================================================
   CRUD
   ============================================================ */

export const createTask = async (taskData) => {
  const hasFiles =
    taskData?.files &&
    (taskData.files.length > 0 ||
      (typeof FileList !== "undefined" &&
        taskData.files instanceof FileList &&
        taskData.files.length > 0));

  if (hasFiles) {
    const formData = new FormData();
    const { files, ...rest } = taskData;

    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        formData.append(k, v);
      }
    });

    Array.from(files).forEach((f) => formData.append("files", f));

    const response = await api.post("/tasks", formData);
    return response.data;
  }

  const response = await api.post("/tasks", taskData);
  return response.data;
};

export const getTasks = async (filters = {}) => {
  const response = await api.get("/tasks", { params: filters });
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.patch(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

/* ============================================================
   ATTACHMENTS
   ============================================================ */

export const addTaskAttachments = async (taskId, files) => {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append("files", f));
  const response = await api.post(`/tasks/${taskId}/attachments`, formData);
  return response.data;
};

export const deleteTaskAttachment = async (taskId, attachmentId) => {
  const response = await api.delete(
    `/tasks/${taskId}/attachments/${attachmentId}`
  );
  return response.data;
};

/* ============================================================
   STATS & ELIGIBLES
   ============================================================ */

export const getTaskStats = async (filters = {}) => {
  const response = await api.get("/tasks/stats", { params: filters });
  return response.data;
};

export const getEligibleTeams = async () => {
  const response = await api.get("/tasks/eligible-teams");
  return response.data;
};

export const getEligibleProjects = async (teamId) => {
  const response = await api.get("/tasks/eligible-projects", {
    params: { team: teamId },
  });
  return response.data;
};

export const getEligibleMembers = async (teamId) => {
  const response = await api.get("/tasks/eligible-members", {
    params: { team: teamId },
  });
  return response.data;
};

/* ============================================================
   TASK OWNERS
   ============================================================ */

export const listTaskOwners = async (teamId) => {
  const response = await api.get(`/teams/${teamId}/task-owners`);
  return response.data;
};

export const grantTaskOwner = async (teamId, userId) => {
  const response = await api.post(`/teams/${teamId}/task-owners`, {
    userId,
  });
  return response.data;
};

export const revokeTaskOwner = async (teamId, userId) => {
  const response = await api.delete(
    `/teams/${teamId}/task-owners/${userId}`
  );
  return response.data;
};