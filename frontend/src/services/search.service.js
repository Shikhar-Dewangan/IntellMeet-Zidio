// frontend/src/services/search.service.js
import api from "./api.js";

/**
 * Global search across the user's accessible resources.
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<{ data: { teams, projects, tasks, meetings } }>}
 */
export const globalSearch = async (query, limit = 5) => {
  const response = await api.get("/search", {
    params: { q: query, limit },
  });
  return response.data;
};