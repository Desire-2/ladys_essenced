/**
 * API Configuration
 * Centralized API URLs and configuration for the application
 */

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if there's an environment variable
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Default to localhost:5001 for development
  return 'http://localhost:5001';
};

export const API_BASE_URL = getApiBaseUrl();

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
};

/**
 * API Helper Functions
 */

/**
 * Make a fetch request with error handling
 */
export async function apiCall(
  endpoint: string,
  options: RequestInit & { body?: any } = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add Authorization token if available
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token')
    : null;
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
