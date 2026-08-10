import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g. https://api.example.com/
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling (optional)
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // Handle 401, refresh token logic later
    return Promise.reject(error);
  }
);

export default apiClient;