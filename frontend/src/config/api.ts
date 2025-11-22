/**
 * API Configuration
 * Centralized API URLs and configuration for the application
 */
import { getApiBaseUrl as resolveApiBaseUrl } from '../utils/apiBase';

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',

  // Cycle Logs
  CYCLE_LOGS: '/api/cycle-logs',
  CYCLE_LOG_BY_ID: (id: number) => `/api/cycle-logs/${id}`,

  // Meal Logs
  MEAL_LOGS: '/api/meal-logs',
  MEAL_LOG_BY_ID: (id: number) => `/api/meal-logs/${id}`,

  // Appointments
  APPOINTMENTS: '/api/appointments',
  APPOINTMENT_BY_ID: (id: number) => `/api/appointments/${id}`,

  // Parent Endpoints
  PARENT_CHILDREN: '/api/parents/children',
  PARENT_CHILD_BY_ID: (id: number) => `/api/parents/children/${id}`,
  PARENT_CHILD_CYCLE_LOGS: (id: number) => `/api/parents/children/${id}/cycle-logs`,
  PARENT_CHILD_MEAL_LOGS: (id: number) => `/api/parents/children/${id}/meal-logs`,
  PARENT_CHILD_APPOINTMENTS: (id: number) => `/api/parents/children/${id}/appointments`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION_BY_ID: (id: number) => `/api/notifications/${id}`,

  // Health Provider
  HEALTH_PROVIDER: '/api/health-provider',
  HEALTH_PROVIDER_AVAILABILITY: '/api/health-provider/availability',

  // Content
  CONTENT: '/api/content',
  CONTENT_BY_CATEGORY: (category: string) => `/api/content/category/${category}`,

  // Content Writer AI Assistant
  CONTENT_WRITER_SUGGESTIONS: '/api/content-writer/suggestions',
  CONTENT_WRITER_ANALYTICS: '/api/content-writer/analytics',
  CONTENT_WRITER_STATS: '/api/content-writer/dashboard/stats',
};

/**
 * API Helper Functions
 */

/**
 * Make a fetch request with error handling and automatic token refresh
 */
export async function apiCall(
  endpoint: string,
  options: RequestInit & { body?: any; _retry?: boolean } = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add Authorization token if available and valid
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token')
    : null;
  
  if (token) {
    // Validate token format before using
    if (token.split('.').length === 3) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('❌ Malformed token detected, clearing storage');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 401 authentication errors with token refresh
      if (response.status === 401 && !options._retry && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && refreshToken.split('.').length === 3) {
          console.warn('⚠️ Token expired, attempting refresh...');
          
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`
              },
              signal: AbortSignal.timeout(10000)
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.access_token && refreshData.access_token.split('.').length === 3) {
                localStorage.setItem('access_token', refreshData.access_token);
                console.log('✅ Token refreshed, retrying request...');
                
                // Retry the original request with new token
                return apiCall(endpoint, { ...options, _retry: true });
              }
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
          }
          
          // If refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_type');
          window.location.href = '/login';
          return;
        }
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${url}]:`, error);
    throw error;
  }
}

/**
 * POST request helper
 */
export async function apiPost(endpoint: string, body: any, options: RequestInit = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'POST',
    body,
  });
}

/**
 * GET request helper
 */
export async function apiGet(endpoint: string, options: RequestInit = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * PUT request helper
 */
export async function apiPut(endpoint: string, body: any, options: RequestInit = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'PUT',
    body,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete(endpoint: string, options: RequestInit = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiCall,
  apiPost,
  apiGet,
  apiPut,
  apiDelete,
};
