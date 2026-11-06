import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout — prevents infinite spinner
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lfp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('lfp_token');
      localStorage.removeItem('lfp_user');
      window.location.href = '/login';
    }
    // Provide clear error messages for network issues
    if (err.code === 'ECONNABORTED') {
      err.message = 'Request timed out. Please check your connection and try again.';
    } else if (!err.response) {
      err.message = 'Cannot connect to server. Please try again.';
    }
    return Promise.reject(err);
  }
);

export default api;
