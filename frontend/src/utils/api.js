import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Request interceptor – attach token and ensure /api prefix
api.interceptors.request.use(
  (config) => {
    // Prepend /api if it's missing from the URL and it's a relative path
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear and redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.error('403 Forbidden:', error.config?.url,
        '| Check: 1) token sent? 2) role allowed in SecurityConfig?');
    }
    return Promise.reject(error);
  }
);

export default api;

