import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { refreshAccessToken } from './authSession';

/**
 * Base URL for all API requests (Flask backend).
 * Forced to Render backend for mobile builds.
 */
const RENDER_URL = 'https://ladys-essenced-hoil.onrender.com';
const envUrl = import.meta.env.VITE_API_URL;

// If we are on a mobile device (Capacitor), we ALWAYS want the remote backend.
// 'https://localhost' is the origin Capacitor uses for local files.
const isMobile = window.location.origin.includes('localhost') && !window.location.port;

export const API_BASE_URL = (isMobile || !envUrl || envUrl.includes('localhost'))
  ? `${RENDER_URL}/api`
  : `${envUrl}/api`;

console.log('🚀 API Target:', API_BASE_URL);

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ['/auth/register', '/auth/login', '/auth/refresh'];

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => config.url?.includes(endpoint));
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

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
          return api(originalRequest);
        } catch (refreshErr) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        }
      }
    }
    return Promise.reject(error);
  }
);
