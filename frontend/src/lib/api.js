import axios from "axios";

// Railway Environment Variable
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://teampill-production.up.railway.app";

// API Base URL
export const API = `${BACKEND_URL}/api`;

// Debug (Remove after testing)
console.log("Backend URL:", BACKEND_URL);
console.log("API URL:", API);

// Axios Instance
export const api = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// API Error Formatter
export function formatApiError(detail) {
  if (!detail) return "Something went wrong.";

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item?.msg ? item.msg : JSON.stringify(item)))
      .join(", ");
  }

  if (typeof detail === "object" && detail.msg) {
    return detail.msg;
  }

  return String(detail);
}

export default api;
