import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach admin token from sessionStorage
apiClient.interceptors.request.use((config) => {
  const adminToken = sessionStorage.getItem("adminToken");

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  // IMPORTANT:
  // Do NOT manually set Content-Type for FormData.
  // Axios/browser will automatically set:
  // multipart/form-data; boundary=...
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("adminData");
      sessionStorage.removeItem("adminPermissions");
      sessionStorage.removeItem("adminRoles");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/indiekonnect-admin/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;