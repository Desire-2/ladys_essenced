import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { refreshAccessToken } from './authSession';

/** Base URL for all API requests (Flask backend). */
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

console.log('🔗 Connecting to Flask Backend:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // 30s timeout to prevent infinite loading
});

// Request interceptor: inject access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // DEBUG: Uncomment to log authorization headers
    // console.log(`📤 Adding Authorization header to ${config.url}`);
  } else {
    console.warn(`⚠️  No token available for ${config.url} - Authorization header NOT added`);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: handle 401 → refresh → retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const newAccessToken = await refreshAccessToken(refreshToken);
          
          useAuthStore.getState().setAccessToken(newAccessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest); // Retry original
        } catch (refreshErr) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
