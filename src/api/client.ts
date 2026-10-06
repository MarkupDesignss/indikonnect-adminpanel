import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach admin token from localStorage
apiClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken");

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

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
      // Clear admin authentication data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      localStorage.removeItem("adminData");
      localStorage.removeItem("adminPermissions");
      localStorage.removeItem("adminRoles");

      // Redirect to the current subdomain's login page
      // Finance: http://finance.localhost:5173/login
      // Admin:   http://localhost:5173/login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;