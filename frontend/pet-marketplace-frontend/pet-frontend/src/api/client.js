import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5102/api";
export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || "http://localhost:5102";
export const HUB_URL = import.meta.env.VITE_HUB_URL || "http://localhost:5102/chatHub";

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Resolve a relative image URL (e.g. "/uploads/x.jpg") returned by the API
// into a full URL pointing at the backend host.
export function resolveImage(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${FILE_BASE_URL}${url}`;
}

export default client;
