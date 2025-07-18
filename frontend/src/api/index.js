import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
    : '',  // Use relative URLs in development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('access_token'); // Changed from 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
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
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
      error: error.message
    });
    
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token'); // Changed from 'refreshToken'
        if (!refreshToken) {
          console.log('No refresh token available, redirecting to login');
          throw new Error('No refresh token available');
        }
        
        console.log('Attempting token refresh...');
        const refreshBaseURL = process.env.NODE_ENV === 'production' 
          ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
          : '';
        const response = await axios.post(`${refreshBaseURL}/api/auth/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        
        const { token } = response.data;
        localStorage.setItem('access_token', token); // Changed from 'token' to 'access_token'
        console.log('Token refreshed successfully');
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('access_token'); // Changed from 'token'
        localStorage.removeItem('refresh_token'); // Changed from 'refreshToken'
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
  getLogs: (page = 1, perPage = 10) => api.get(`/api/cycle-logs/?page=${page}&per_page=${perPage}`),
  getLog: (id) => api.get(`/api/cycle-logs/${id}`),
  createLog: (logData) => api.post('/api/cycle-logs/', logData),
  updateLog: (id, logData) => api.put(`/api/cycle-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/api/cycle-logs/${id}`),
  getStats: () => api.get('/api/cycle-logs/stats'),
  getCalendarData: (year, month) => api.get(`/api/cycle-logs/calendar?year=${year}&month=${month}`),
};

// Meal Logging API
export const mealAPI = {
  getLogs: (page = 1, perPage = 10, filters = {}) => {
    let url = `/api/meal-logs/?page=${page}&per_page=${perPage}`;
    if (filters.mealType) url += `&meal_type=${filters.mealType}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    return api.get(url);
  },
  getLog: (id) => api.get(`/api/meal-logs/${id}`),
  createLog: (logData) => api.post('/api/meal-logs/', logData),
  updateLog: (id, logData) => api.put(`/api/meal-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/api/meal-logs/${id}`),
  getStats: (filters = {}) => {
    let url = '/api/meal-logs/stats';
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
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
  create: (appointmentData) => api.post('/api/appointments/test/create', appointmentData),
  createAppointment: (appointmentData) => api.post('/api/appointments/test/create', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/api/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/api/appointments/${id}`),
  getUpcoming: () => api.get('/api/appointments/test/upcoming'),
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
  
  // Test endpoints for demo (no authentication required)
  getTestProviders: () => api.get('/api/health-provider/test/providers'),
  getTestProviderAvailability: (providerId) => api.get(`/api/health-provider/test/availability?provider_id=${providerId}`),
};

export default api;
