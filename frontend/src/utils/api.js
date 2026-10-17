import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to construct proper API URLs for links, downloads, and image src
 */
export const getApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.env.VITE_API_BASE_URL) {
    const base = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
    if (base.endsWith('/api') && cleanPath.startsWith('/api')) {
      return `${base}${cleanPath.substring(4)}`;
    }
    return `${base}${cleanPath}`;
  }

  return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and trigger event or state if needed
      if (localStorage.getItem('ssas_token')) {
        localStorage.removeItem('ssas_token');
        localStorage.removeItem('ssas_user');
        window.dispatchEvent(new Event('auth_change'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
