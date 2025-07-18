// Centralized API URL configuration
export const getApiUrl = (endpoint: string): string => {
  // In production, use the full backend URL
  // In development, use relative URLs for Next.js rewrites
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
    : '';
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${normalizedEndpoint}`;
};

// For backward compatibility
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
  : '';

// Feature flags for enabling/disabling features
export const isFeatureEnabled = (feature: string): boolean => {
  const features = {
    'debug-mode': process.env.NODE_ENV === 'development',
    'analytics': true,
    'provider-search': true,
    'notifications': true,
    'real-time-updates': true,
  };
  
  return features[feature as keyof typeof features] || false;
};

// API Endpoints configuration
export const API_ENDPOINTS = {
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    CYCLE_INSIGHTS: '/api/analytics/cycle-insights',
    HEALTH_METRICS: '/api/analytics/health-metrics',
    PROVIDER_ANALYTICS: '/api/analytics/provider',
  },
  HEALTH_PROVIDERS: {
    SEARCH: '/api/health-providers/search',
    PROFILE: '/api/health-providers/profile',
    AVAILABILITY: '/api/health-providers/availability',
    DETAILS: '/api/health-providers/details',
    BOOK_APPOINTMENT: '/api/health-providers/book-appointment',
  },
  APPOINTMENTS: {
    LIST: '/api/appointments',
    CREATE: '/api/appointments',
    UPDATE: '/api/appointments',
    DELETE: '/api/appointments',
    NEXT_AVAILABLE: '/api/appointments/next-available-slot',
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    SSE: '/api/notifications/sse',
    MARK_READ: '/api/notifications/read',
    GET_ALL: '/api/notifications',
    DELETE: '/api/notifications',
    PREFERENCES: '/api/notifications/preferences',
  },
};

// SSE URL for real-time notifications
export const getSSEUrl = (endpoint: string): string => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
    : '';
  
  return `${baseUrl}${endpoint}`;
};
