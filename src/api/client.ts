import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach admin token from sessionStorage
apiClient.interceptors.request.use((config) => {
  const adminToken = sessionStorage.getItem('adminToken');

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear all admin session data
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('adminPermissions');
      sessionStorage.removeItem('adminRoles');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;