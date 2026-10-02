export function unwrapApiData(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

export function unwrapApiList(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : [];
}

export function getApiError(error, fallback = "Request failed") {
  return error?.response?.data?.message || error?.message || fallback;
}
