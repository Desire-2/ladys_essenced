import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post('/api/auth/refresh', {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Cycle Tracking API
export const cycleAPI = {
  getLogs: (page = 1, perPage = 10) => api.get(`/cycle-logs?page=${page}&per_page=${perPage}`),
  getLog: (id) => api.get(`/cycle-logs/${id}`),
  createLog: (logData) => api.post('/cycle-logs', logData),
  updateLog: (id, logData) => api.put(`/cycle-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/cycle-logs/${id}`),
  getStats: () => api.get('/cycle-logs/stats'),
};

// Meal Logging API
export const mealAPI = {
  getLogs: (page = 1, perPage = 10, filters = {}) => {
    let url = `/meal-logs?page=${page}&per_page=${perPage}`;
    if (filters.mealType) url += `&meal_type=${filters.mealType}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    return api.get(url);
  },
  getLog: (id) => api.get(`/meal-logs/${id}`),
  createLog: (logData) => api.post('/meal-logs', logData),
  updateLog: (id, logData) => api.put(`/meal-logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/meal-logs/${id}`),
  getStats: (filters = {}) => {
    let url = '/meal-logs/stats';
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
};

// Appointments API
export const appointmentAPI = {
  getAppointments: (page = 1, perPage = 10, filters = {}) => {
    let url = `/appointments?page=${page}&per_page=${perPage}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    return api.get(url);
  },
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (appointmentData) => api.post('/appointments', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  getUpcoming: () => api.get('/appointments/upcoming'),
};

// Notifications API
export const notificationAPI = {
  getNotifications: (page = 1, perPage = 10, filters = {}) => {
    let url = `/notifications?page=${page}&per_page=${perPage}`;
    if (filters.type) url += `&type=${filters.type}`;
    if (filters.read !== undefined) url += `&read=${filters.read}`;
    return api.get(url);
  },
  getNotification: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settingsData) => api.put('/notifications/settings', settingsData),
};

// Content API
export const contentAPI = {
  getCategories: () => api.get('/content/categories'),
  getCategory: (id) => api.get(`/content/categories/${id}`),
  getContentItems: (page = 1, perPage = 10, categoryId) => {
    let url = `/content/items?page=${page}&per_page=${perPage}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    return api.get(url);
  },
  getContentItem: (id) => api.get(`/content/items/${id}`),
  getFeatured: () => api.get('/content/featured'),
  searchContent: (query) => api.get(`/content/search?q=${encodeURIComponent(query)}`),
};

// Parent API
export const parentAPI = {
  getChildren: () => api.get('/parents/children'),
  getChild: (id) => api.get(`/parents/children/${id}`),
  addChild: (childData) => api.post('/parents/children', childData),
  updateChild: (id, childData) => api.put(`/parents/children/${id}`, childData),
  getChildCycleLogs: (id, page = 1, perPage = 10) => 
    api.get(`/parents/children/${id}/cycle-logs?page=${page}&per_page=${perPage}`),
  getChildMealLogs: (id, page = 1, perPage = 10) => 
    api.get(`/parents/children/${id}/meal-logs?page=${page}&per_page=${perPage}`),
  getChildAppointments: (id, page = 1, perPage = 10) => 
    api.get(`/parents/children/${id}/appointments?page=${page}&per_page=${perPage}`),
};

export default api;
