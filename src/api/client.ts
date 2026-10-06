import axios from "axios";
import { getPortalLoginUrl } from "@/config/portalConfig";

// =====================================================
// API CLIENT
// =====================================================

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// =====================================================
// CLEAR AUTH / STORAGE
// =====================================================

const clearAllAuthStorage = () => {
  // ===================================================
  // LOCAL STORAGE
  // ===================================================

  try {
    localStorage.clear();
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }

  // ===================================================
  // SESSION STORAGE
  // ===================================================

  try {
    sessionStorage.clear();
  } catch (error) {
    console.error("Failed to clear sessionStorage:", error);
  }

  // ===================================================
  // CLEAR ACCESSIBLE COOKIES
  // ===================================================

  try {
    document.cookie.split(";").forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();

      if (!cookieName) return;

      // Root path
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;

      // Current pathname
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${window.location.pathname}`;
    });
  } catch (error) {
    console.error("Failed to clear cookies:", error);
  }
};

// =====================================================
// REDIRECT TO CURRENT PORTAL LOGIN
// =====================================================

const redirectToPortalLogin = () => {
  try {
    // IMPORTANT:
    // Get URL before any navigation.
    const loginUrl = getPortalLoginUrl();

    console.log("401 Unauthorized");
    console.log("Redirecting to:", loginUrl);

    window.location.href = loginUrl;
  } catch (error) {
    console.error(
      "Failed to generate portal login URL:",
      error,
    );

    // Safe fallback
    window.location.href =
      `${window.location.origin}/indiekonnect-admin/login`;
  }
};

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

apiClient.interceptors.request.use(
  (config) => {
    // =================================================
    // GET ADMIN TOKEN
    // =================================================

    const adminToken =
      localStorage.getItem("adminToken");

    // =================================================
    // ATTACH AUTHORIZATION
    // =================================================

    if (adminToken) {
      config.headers.Authorization =
        `Bearer ${adminToken}`;
    }

    // =================================================
    // FORM DATA
    // =================================================

    // Do NOT manually set Content-Type for FormData.
    // Browser/Axios automatically sets:
    //
    // multipart/form-data; boundary=...
    //

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

apiClient.interceptors.response.use(
  // ===================================================
  // SUCCESS
  // ===================================================

  (response) => {
    return response;
  },

  // ===================================================
  // ERROR
  // ===================================================

  (error) => {
    const status = error.response?.status;

    // =================================================
    // UNAUTHORIZED
    // =================================================

    if (status === 401) {
      const currentPath =
        window.location.pathname;

      // =================================================
      // DO NOT REDIRECT IF ALREADY ON LOGIN PAGE
      // =================================================

      const isAlreadyOnLoginPage =
        currentPath.endsWith("/login") ||
        currentPath.includes("/login/");

      if (!isAlreadyOnLoginPage) {
        // ===============================================
        // CLEAR ALL AUTH DATA
        // ===============================================

        clearAllAuthStorage();

        // ===============================================
        // DYNAMIC PORTAL LOGIN REDIRECT
        // ===============================================

        redirectToPortalLogin();
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;