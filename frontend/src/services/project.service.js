// frontend/src/services/project.service.js
import api from "./api.js";

export const createProject = async (projectData) => {
  // When projectData contains a `files` FileList / array, use multipart.
  const hasFiles =
    projectData?.files &&
    (projectData.files.length > 0 ||
      (typeof FileList !== "undefined" &&
        projectData.files instanceof FileList &&
        projectData.files.length > 0));

  if (hasFiles) {
    const formData = new FormData();
    const { files, teamIds, ...rest } = projectData;

    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        formData.append(k, v);
      }
    });
    if (Array.isArray(teamIds)) {
      formData.append("teamIds", JSON.stringify(teamIds));
    }
    Array.from(files).forEach((f) => formData.append("files", f));

    const response = await api.post("/projects", formData);
    return response.data;
  }

  const response = await api.post("/projects", projectData);
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get("/projects");
  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.patch(`/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

/* ---------- Files ---------- */

export const addProjectFiles = async (projectId, files) => {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append("files", f));
  const response = await api.post(`/projects/${projectId}/files`, formData);
  return response.data;
};

export const deleteProjectFile = async (projectId, fileId) => {
  const response = await api.delete(
    `/projects/${projectId}/files/${fileId}`
  );
  return response.data;
};

export const replaceProjectFile = async (projectId, fileId, file) => {
  const formData = new FormData();
  formData.append("files", file);
  const response = await api.put(
    `/projects/${projectId}/files/${fileId}`,
    formData
  );
  return response.data;
};