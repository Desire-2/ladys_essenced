import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { refreshAccessTokenWithTimeout } from './authSession';

/**
 * Base URL for all API requests (Flask backend).
 * For mobile apps:
 * - Android Emulator: 10.0.2.2:5001 (host machine)
 * - Android Device: Your-Machine-IP:5001 (on same network)
 * - Production: Use VITE_API_URL or Render backend
 */
const RENDER_URL = 'https://ladys-essenced-hoil.onrender.com';
const envUrl = import.meta.env.VITE_API_URL;

// Detect if running in Capacitor (mobile)
const isCapacitor = (window as any).Capacitor?.isPluginAvailable?.('App');

// For development on Android emulator, allow override
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:5001';

// Determine API URL based on environment
let apiUrl = '';

if (envUrl) {
  // Use env variable if provided (highest priority)
  apiUrl = envUrl;
  console.log('📱 Using env VITE_API_URL:', apiUrl);
} else if (isCapacitor && import.meta.env.MODE === 'development') {
  // For mobile development, default to Android emulator
  apiUrl = ANDROID_EMULATOR_URL;
  console.log('📱 Using Android Emulator URL:', apiUrl);
} else if (!envUrl || envUrl.includes('localhost')) {
  // For web development or fallback to Render
  apiUrl = RENDER_URL;
  console.log('📱 Using Render backend:', apiUrl);
} else {
  apiUrl = envUrl;
}

export const API_BASE_URL = `${apiUrl}/api`;

console.log('🚀 API Target:', API_BASE_URL);
console.log('🎯 Environment:', import.meta.env.MODE);
console.log('📲 Is Capacitor:', isCapacitor);

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
          const newAccessToken = await refreshAccessTokenWithTimeout(refreshToken);
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
