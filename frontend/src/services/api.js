import axios from 'axios';

// Backend API Axios client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.detail;
    if (!message) {
      if (error.response?.status === 500) {
        message = 'Server encountered an error. Please verify the backend is active.';
      } else if (error.code === 'ECONNREFUSED' || !error.response) {
        message = 'Cannot connect to backend server. Please verify backend is running on port 8000.';
      } else {
        message = error.message || 'Server request error';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
