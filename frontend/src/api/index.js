import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBase';

const preferProxy = typeof window !== 'undefined';
const API_BASE_URL = getApiBaseUrl({ preferProxy });

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    
    // Only access localStorage if we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Validate token format before using
        if (token.split('.').length === 3) {
          // Always use the latest token from localStorage
          config.headers.Authorization = `Bearer ${token}`;
          if (config._isRetry) {
            console.log('🔄 Retry request with refreshed token:', token.substring(0, 20) + '...');
          } else {
            console.log('✅ Valid token added to request:', token.substring(0, 20) + '...');
          }
        } else {
          console.error('❌ Malformed token detected, clearing storage');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          console.warn('⚠️ Tokens cleared due to malformed format');
        }
      } else {
        console.warn('⚠️ No access_token found in localStorage');
        const allKeys = Object.keys(localStorage);
        console.log('Available localStorage keys:', allKeys);
        console.log('User ID:', localStorage.getItem('user_id'));
        console.log('User Type:', localStorage.getItem('user_type'));
      }
    } else {
      console.warn('⚠️ localStorage not available (SSR)');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config?.url);
    return response;
  },
  async (error) => {
    // Handle cases where error object is incomplete
    if (!error || (!error.response && !error.message && !error.request)) {
      console.warn('⚠️ Received incomplete error object, likely network issue');
      return Promise.reject(new Error('Network error or request cancelled'));
    }
    
    // Only log detailed error if there's actual error information
    if (error.response || error.message) {
      console.error('API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
    } else {
      console.warn('⚠️ Network or unknown error occurred');
    }
    
    const originalRequest = error.config;
    
    // If no config, we can't retry
    if (!originalRequest) {
      console.error('❌ No request config available for retry');
      return Promise.reject(error);
    }
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.log('No refresh token available, redirecting to login');
          throw new Error('No refresh token available');
        }
        
        // Validate refresh token format
        if (refreshToken.split('.').length !== 3) {
          console.error('❌ Malformed refresh token, clearing tokens');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw new Error('Malformed refresh token');
        }
        
        console.log('Attempting token refresh...');
        const refreshBaseURL = getApiBaseUrl({ preferProxy });
        const response = await axios.post(`${refreshBaseURL}/api/auth/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          },
          timeout: 10000 // 10 second timeout
        });
        
        const { access_token } = response.data;
        if (!access_token) {
          throw new Error('No access_token in refresh response');
        }
        
        // Validate new token before storing
        if (access_token.split('.').length !== 3) {
          console.error('❌ Received malformed access token from refresh');
          throw new Error('Malformed access token received');
        }
        
        localStorage.setItem('access_token', access_token);
        console.log('✅ Token refreshed successfully');
        
        // Update the Authorization header explicitly for the retry
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        originalRequest._isRetry = true;
        
        console.log('🔄 Retrying original request with new token...');
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('❌ Token refresh failed:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (userData) => api.put('/api/auth/profile', userData),
};

// Cycle Tracking API
export const cycleAPI = {
  getLogs: (page = 1, perPage = 10, userId = null) => {
    let url = `/api/cycle-logs/?page=${page}&per_page=${perPage}`;
    if (userId) url += `&user_id=${userId}`;
    return api.get(url);
  },
  getLog: (id) => api.get(`/api/cycle-logs/${id}`),
  createLog: (logData) => api.post('/api/cycle-logs/', logData),
  updateLog: (id, logData) => api.put(`/api/cycle-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/api/cycle-logs/${id}`),
  getStats: (userId = null) => {
    let url = '/api/cycle-logs/stats';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
  getCalendarData: (year, month, userId = null) => {
    let url = `/api/cycle-logs/calendar?year=${year}&month=${month}`;
    if (userId) url += `&user_id=${userId}`;
    return api.get(url);
  },
  // ML-Enhanced Prediction Endpoints
  getPredictions: (months = 3, userId = null) => {
    let url = `/api/cycle-logs/predictions?months=${months}`;
    if (userId) url += `&user_id=${userId}`;
    return api.get(url);
  },
  getMLInsights: (userId = null) => {
    let url = '/api/cycle-logs/ml-insights';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
  getPatternAnalysis: (userId = null) => {
    let url = '/api/cycle-logs/pattern-analysis';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
  getAdaptiveLearningStatus: (userId = null) => {
    let url = '/api/cycle-logs/adaptive-status';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
  getSeasonalPatterns: (userId = null) => {
    let url = '/api/cycle-logs/seasonal-patterns';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
  getAnomalyDetection: (userId = null) => {
    let url = '/api/cycle-logs/anomaly-detection';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
  getConfidenceMetrics: (userId = null) => {
    let url = '/api/cycle-logs/confidence-metrics';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
};

// Period Logs API - Enhanced period-specific tracking
export const periodAPI = {
  getLogs: (page = 1, perPage = 10) => api.get(`/api/period-logs/?page=${page}&per_page=${perPage}`),
  getLog: (id) => api.get(`/api/period-logs/${id}`),
  createLog: (logData) => api.post('/api/period-logs/', logData),
  updateLog: (id, logData) => api.put(`/api/period-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/api/period-logs/${id}`),
  getAnalytics: () => api.get('/api/period-logs/analytics'),
  getInsights: () => api.get('/api/period-logs/insights'),
  getCurrentPeriod: () => api.get('/api/period-logs/current'),
  endCurrentPeriod: (data) => api.post('/api/period-logs/end-current', data),
  
  // Parent access methods
  getChildLogs: (childId, page = 1, perPage = 10) => 
    api.get(`/api/period-logs/parent/${childId}?page=${page}&per_page=${perPage}`),
  getChildAnalytics: (childId) => api.get(`/api/period-logs/parent/${childId}/analytics`),
};

// Meal Logging API
export const mealAPI = {
  getLogs: (page = 1, perPage = 10, filters = {}, userId = null) => {
    let url = `/api/meal-logs/?page=${page}&per_page=${perPage}`;
    if (filters.mealType) url += `&meal_type=${filters.mealType}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    if (userId) url += `&user_id=${userId}`;
    return api.get(url);
  },
  getLog: (id) => api.get(`/api/meal-logs/${id}`),
  createLog: (logData) => api.post('/api/meal-logs/', logData),
  updateLog: (id, logData) => api.put(`/api/meal-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/api/meal-logs/${id}`),
  getStats: (filters = {}, userId = null) => {
    let url = '/api/meal-logs/stats';
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (userId) params.append('user_id', userId);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
};

// Appointments API
export const appointmentAPI = {
  getNextAvailableSlot: (providerId, daysAhead, duration) => {
    let url = `/api/appointments/next-available-slot?provider_id=${providerId}`;
    if (daysAhead) url += `&days_ahead=${daysAhead}`;
    if (duration) url += `&duration=${duration}`;
    return api.get(url);
  },
  getProviderAvailabilitySummary: (providerId, daysAhead) => {
    let url = `/api/appointments/provider-availability-summary?provider_id=${providerId}`;
    if (daysAhead) url += `&days_ahead=${daysAhead}`;
    return api.get(url);
  },
  getProviderTimeSlots: (providerId, date) => {
    return api.get(`/api/appointments/provider-time-slots?provider_id=${providerId}&date=${date}`);
  },
  getAppointments: (page = 1, perPage = 10, filters = {}) => {
    let url = `/api/appointments/?page=${page}&per_page=${perPage}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    return api.get(url);
  },
  getAppointment: (id) => api.get(`/api/appointments/${id}`),
  create: (appointmentData) => api.post('/api/appointments/', appointmentData),
  createAppointment: (appointmentData) => api.post('/api/appointments/', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/api/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/api/appointments/${id}`),
  getUpcoming: (userId = null) => {
    let url = '/api/appointments/upcoming';
    if (userId) url += `?user_id=${userId}`;
    return api.get(url);
  },
};

// Notifications API
export const notificationAPI = {
  getNotifications: (page = 1, perPage = 10, filters = {}) => {
    let url = `/api/notifications/?page=${page}&per_page=${perPage}`;
    if (filters.type) url += `&type=${filters.type}`;
    if (filters.read !== undefined) url += `&read=${filters.read}`;
    return api.get(url);
  },
  getNotification: (id) => api.get(`/api/notifications/${id}`),
  getRecent: () => api.get('/api/notifications/recent'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  getSettings: () => api.get('/api/notifications/settings'),
  updateSettings: (settingsData) => api.put('/api/notifications/settings', settingsData),
};

// Content API
export const contentAPI = {
  getCategories: () => api.get('/api/content/categories'),
  getCategory: (id) => api.get(`/api/content/categories/${id}`),
  getContentItems: (page = 1, perPage = 10, categoryId) => {
    let url = `/api/content/items?page=${page}&per_page=${perPage}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    return api.get(url);
  },
  getContentItem: (id) => api.get(`/api/content/items/${id}`),
  getFeatured: () => api.get('/api/content/featured'),
  searchContent: (query) => api.get(`/api/content/search?q=${encodeURIComponent(query)}`),
};

// Parent API
export const parentAPI = {
  getChildren: () => api.get('/api/parents/children'),
  getChild: (id) => api.get(`/api/parents/children/${id}`),
  addChild: (childData) => api.post('/api/parents/children', childData),
  updateChild: (id, childData) => api.put(`/api/parents/children/${id}`, childData),
  deleteChild: (id) => api.delete(`/api/parents/children/${id}`),
  getChildCycleLogs: (id, page = 1, perPage = 10) => 
    api.get(`/api/parents/children/${id}/cycle-logs?page=${page}&per_page=${perPage}`),
  getChildMealLogs: (id, page = 1, perPage = 10) => 
    api.get(`/api/parents/children/${id}/meal-logs?page=${page}&per_page=${perPage}`),
  getChildAppointments: (id, page = 1, perPage = 10) => 
    api.get(`/api/parents/children/${id}/appointments?page=${page}&per_page=${perPage}`),
};

// Health Provider API
export const healthProviderAPI = {
  // Dashboard
  getDashboard: (providerId) => api.get(`/api/health-provider/dashboard?provider_id=${providerId}`),
  
  // Appointments
  getAppointments: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/health-provider/appointments?${queryString}`);
  },
  getAppointment: (id) => api.get(`/api/health-provider/appointments/${id}`),
  updateAppointment: (id, data) => api.put(`/api/health-provider/appointments/${id}`, data),
  
  // Analytics
  getAnalytics: (providerId, params = {}) => {
    const queryString = new URLSearchParams({ provider_id: providerId, ...params }).toString();
    return api.get(`/api/health-provider/analytics?${queryString}`);
  },
  
  // Notifications
  getNotifications: (providerId, params = {}) => {
    const queryString = new URLSearchParams({ provider_id: providerId, ...params }).toString();
    return api.get(`/api/health-provider/notifications?${queryString}`);
  },
  markNotificationRead: (notificationId) => api.put(`/api/health-provider/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => api.delete(`/api/health-provider/notifications/${notificationId}`),
  
  // Availability Management
  getAvailability: (providerId) => api.get(`/api/health-provider/availability?provider_id=${providerId}`),
  updateAvailability: (data) => api.put('/api/health-provider/availability', data),
  createCustomSlot: (data) => api.post('/api/health-provider/availability/slots', data),
  deleteCustomSlots: (date) => api.delete(`/api/health-provider/availability/slots/${date}`),
  blockTimeSlot: (data) => api.post('/api/health-provider/availability/block', data),
  
  // Profile
  getProfile: (providerId) => api.get(`/api/health-provider/profile?provider_id=${providerId}`),
  updateProfile: (data) => api.put('/api/health-provider/profile', data),
  
  // Patients
  getPatients: (providerId, params = {}) => {
    const queryString = new URLSearchParams({ provider_id: providerId, ...params }).toString();
    return api.get(`/api/health-provider/patients?${queryString}`);
  },
  
  // Public endpoints for appointment booking (authenticated)
  getPublicProviders: () => api.get('/api/health-provider/providers'),
  getPublicProviderAvailability: (providerId) => api.get(`/api/health-provider/provider-availability?provider_id=${providerId}`),
  
  // Time slot management
  getProviderTimeSlots: (providerId, date) => api.get(`/api/health-provider/appointments/provider-time-slots?provider_id=${providerId}&date=${date}`),
  getNextAvailableSlot: (providerId, daysAhead, duration) => {
    let url = `/api/health-provider/appointments/next-available-slot?provider_id=${providerId}`;
    if (daysAhead) url += `&days_ahead=${daysAhead}`;
    if (duration) url += `&duration=${duration}`;
    return api.get(url);
  },
  getProviderAvailabilitySummary: (providerId, daysAhead) => {
    let url = `/api/health-provider/appointments/provider-availability-summary?provider_id=${providerId}`;
    if (daysAhead) url += `&days_ahead=${daysAhead}`;
    return api.get(url);
  },
};

export default api;
