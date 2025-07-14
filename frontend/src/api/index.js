import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
    : '',  // Use relative URLs in development
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  maxRedirects: 5, // Follow up to 5 redirects
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Accept redirects as valid
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
    
    // Check if we got HTML when expecting JSON
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/json') && 
        typeof response.data === 'string' && 
        (response.data.includes('<!doctype') || response.data.includes('<html'))) {
      console.warn('Received HTML response when expecting JSON:', response.config?.url);
      throw new Error('Server returned HTML instead of JSON - possible proxy/redirect issue');
    }
    
    return response;
  },
  async (error) => {
    // Check if we got HTML instead of JSON (common with redirects/proxy issues)
    const isHtmlResponse = error.response?.data && 
      typeof error.response.data === 'string' && 
      error.response.data.includes('<!doctype') || error.response.data.includes('<html');
    
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      error: error.message,
      isHtmlResponse,
      responseData: isHtmlResponse ? 'HTML page returned (redirect/proxy issue)' : error.response?.data,
      fullError: error
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

// Error interceptor to handle JSON error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Interceptor:', error);

    if (error.response) {
      // Check if the response is HTML, which can happen with proxy errors or server crashes
      if (typeof error.response.data === 'string' && (error.response.data.includes('<!doctype html>') || error.response.data.includes('<html'))) {
        error.message = 'The server returned an unexpected response. Please try again.';
      } else if (error.response.data && typeof error.response.data === 'object') {
        // Handle structured JSON errors from the Flask backend
        // Prefer the 'message' or 'error' key from the JSON response
        const message = error.response.data.message || error.response.data.error || 'An unknown error occurred.';
        error.message = message; // Augment the error object
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
      error.message = 'The server is not responding. Please check your connection or try again later.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', error.message);
      error.message = error.message || 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

// Generic API error handling function
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Response Error:', error.response.data, error.response.status, error.response.headers);
    
    // Check for structured error message from our backend
    if (error.response.data && typeof error.response.data === 'object') {
        return error.response.data.message || error.response.data.error || `Error: ${error.response.status}`;
    }
    
    // Fallback for plain text or other non-json responses
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }

    // Generic fallback
    return `Request failed with status code ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Request Error:', error.request);
    return 'Network error: No response received from server.';
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Setup Error:', error.message);
    return error.message;
  }
};

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
  getAppointments: (page = 1, perPage = 10, filters = {}) => {
    let url = `/api/appointments/?page=${page}&per_page=${perPage}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    return api.get(url);
  },
  getAppointment: (id) => api.get(`/api/appointments/${id}`),
  create: (appointmentData) => {
    // Handle both emergency and regular appointments
    if (appointmentData.is_emergency) {
      return api.post('/api/appointments/emergency', appointmentData);
    } else if (appointmentData.provider_id && appointmentData.appointment_date) {
      return api.post('/api/appointments/schedule', appointmentData);
    } else {
      // Fallback to regular appointment creation
      return api.post('/api/appointments/', appointmentData);
    }
  },
  createAppointment: (appointmentData) => {
    // Handle both emergency and regular appointments
    if (appointmentData.is_emergency) {
      return api.post('/api/appointments/emergency', appointmentData);
    } else if (appointmentData.provider_id && appointmentData.appointment_date) {
      return api.post('/api/appointments/schedule', appointmentData);
    } else {
      // Fallback to regular appointment creation
      return api.post('/api/appointments/', appointmentData);
    }
  },
  updateAppointment: (id, appointmentData) => api.put(`/api/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/api/appointments/${id}`),
  getUpcoming: () => api.get('/api/appointments/upcoming'),
  // New provider-based scheduling endpoints
  getAvailableProviders: () => api.get('/api/appointments/providers'),
  getProviderTimeSlots: (providerId, date) => api.get(`/api/appointments/providers/${providerId}/slots?date=${date}`),
  createEmergencyAppointment: (appointmentData) => api.post('/api/appointments/emergency', appointmentData),
  scheduleWithProvider: (appointmentData) => api.post('/api/appointments/schedule', appointmentData),
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

export default api;
