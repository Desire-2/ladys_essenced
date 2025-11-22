import { getApiBaseUrl } from '../../utils/apiBase';

// API utility functions for dashboard interactions

// Extend RequestInit to include custom retry flag
interface ExtendedRequestInit extends RequestInit {
  _retry?: boolean;
}

class APIClient {
  private getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (!token && typeof window !== 'undefined') {
      console.warn('⚠️ ApiClient: No access_token found in localStorage');
      console.log('Available localStorage keys:', Object.keys(localStorage));
    } else if (token) {
      // Validate token format before using it
      if (token.split('.').length !== 3) {
        console.error('❌ Malformed token detected, clearing tokens');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return {
          'Content-Type': 'application/json'
        };
      }
      console.log('✅ ApiClient: Valid token available:', token.substring(0, 20) + '...');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && token.split('.').length === 3 && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request(endpoint: string, options: ExtendedRequestInit = {}): Promise<any> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle various 401 authentication errors
        if (response.status === 401) {
          const errorMessage = errorData.message || '';
          const shouldRefresh = errorMessage.includes('expired') || 
                               errorMessage.includes('Invalid token') ||
                               errorMessage === 'Missing Authorization Header' ||
                               errorMessage.includes('Not enough segments');
                               
          if (shouldRefresh) {
            console.warn('⚠️ Authentication error detected, attempting refresh...', errorMessage);
            
            // Try to refresh the token
            const refreshed = await this.attemptTokenRefresh();
            if (refreshed) {
              console.log('✅ Token refreshed successfully, retrying request...');
              // Retry the request with new token (but only once to prevent infinite loops)
              if (!options._retry) {
                return this.request(endpoint, { ...options, _retry: true });
              }
            } else {
              console.error('❌ Token refresh failed, redirecting to login...');
              // Clear tokens and redirect to login
              if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_type');
                window.location.href = '/login';
              }
            }
          }
        }
        
        console.error('❌ API Error:', {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Request Failed:', { url, error });
      throw error;
    }
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.warn('⚠️ No refresh token available');
      return false;
    }

    // Check if refresh token is valid (not malformed)
    if (refreshToken.split('.').length !== 3) {
      console.error('❌ Malformed refresh token, clearing tokens');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return false;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          // Validate the new token before storing
          if (data.access_token.split('.').length === 3) {
            localStorage.setItem('access_token', data.access_token);
            console.log('✅ New access token stored and validated');
            return true;
          } else {
            console.error('❌ Received malformed access token from refresh');
            return false;
          }
        }
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ Token refresh response not ok:', response.status, errorText);
      return false;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.error('❌ Token refresh timeout');
      } else {
        console.error('❌ Token refresh failed:', error);
      }
      return false;
    }
  }

  // Admin API
  admin = {
    getDashboardStats: () => this.request('/api/admin/dashboard/stats'),
    getUsers: (params?: { page?: number; per_page?: number; user_type?: string; search?: string }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/admin/users${query}`);
    },
    toggleUserStatus: (userId: number) => this.request(`/api/admin/users/${userId}/toggle-status`, { method: 'PATCH' }),
    getPendingContent: () => this.request('/api/admin/content/pending'),
    approveContent: (contentId: number) => this.request(`/api/admin/content/${contentId}/approve`, { method: 'PATCH' }),
    getAppointments: (params?: { page?: number; per_page?: number; status?: string }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/admin/appointments/manage${query}`);
    },
    getSystemLogs: (params?: { page?: number; per_page?: number; action?: string }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/admin/system/logs${query}`);
    },
    generateAnalytics: (data: { report_type: string; start_date?: string; end_date?: string }) => 
      this.request('/api/admin/analytics/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  };

  // Content Writer API
  contentWriter = {
    getDashboardStats: () => this.request('/api/content-writer/dashboard/stats'),
    getContent: (params?: { page?: number; per_page?: number; status?: string }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/content-writer/content${query}`);
    },
    createContent: (data: {
      title: string;
      content: string;
      category_id: string;
      summary?: string;
      image_url?: string;
      tags?: string[];
    }) => this.request('/api/content-writer/content', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateContent: (contentId: number, data: any) => this.request(`/api/content-writer/content/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    deleteContent: (contentId: number) => this.request(`/api/content-writer/content/${contentId}`, { method: 'DELETE' }),
    submitForReview: (contentId: number) => this.request(`/api/content-writer/content/${contentId}/submit`, { method: 'PATCH' }),
    getCategories: () => this.request('/api/content-writer/categories'),
    getProfile: () => this.request('/api/content-writer/profile'),
    updateProfile: (data: any) => this.request('/api/content-writer/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  };

  // Health Provider API
  healthProvider = {
    getDashboardStats: () => this.request('/api/health-provider/dashboard/stats'),
    getAppointments: (params?: { 
      page?: number; 
      per_page?: number; 
      status?: string; 
      priority?: string; 
      date_filter?: string; 
    }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/health-provider/appointments${query}`);
    },
    getUnassignedAppointments: () => this.request('/api/health-provider/appointments/unassigned'),
    claimAppointment: (appointmentId: number) => this.request(`/api/health-provider/appointments/${appointmentId}/claim`, { method: 'PATCH' }),
    updateAppointment: (appointmentId: number, data: {
      appointment_date?: string;
      status?: string;
      priority?: string;
      provider_notes?: string;
    }) => this.request(`/api/health-provider/appointments/${appointmentId}/update`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    getSchedule: (params?: { start_date?: string; end_date?: string }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/health-provider/schedule${query}`);
    },
    getPatients: () => this.request('/api/health-provider/patients'),
    getProfile: () => this.request('/api/health-provider/profile'),
    updateProfile: (data: any) => this.request('/api/health-provider/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  };

  // General API (existing)
  auth = {
    login: (data: { phone_number: string; password: string }) => 
      this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    register: (data: { name: string; phone_number: string; password: string; user_type: string }) =>
      this.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getCurrentUser: () => this.request('/api/auth/me'),
    getProfile: () => this.request('/api/auth/profile'),
    updateProfile: (data: any) => this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  };

  // Content API (public)
  content = {
    getCategories: () => this.request('/api/content/categories'),
    getContent: (params?: { category_id?: number; page?: number; per_page?: number }) => {
      const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
      return this.request(`/api/content${query}`);
    },
    getContentItem: (id: number) => this.request(`/api/content/${id}`)
  };

  // Cycle API - Enhanced with Intelligent Predictions
  cycle = {
    getLogs: (page?: number, per_page?: number, userId?: number | null) => {
      const params: string[] = [];
      if (page) params.push(`page=${page}`);
      if (per_page) params.push(`per_page=${per_page}`);
      if (userId) params.push(`user_id=${userId}`);
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      console.log('🔍 API: Getting cycle logs with query:', query);
      return this.request(`/api/cycle-logs/${query}`)
;
    },
    createLog: (data: any) => {
      console.log('🔍 API: Creating cycle log:', data);
      return this.request('/api/cycle-logs/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    // Enhanced stats with predictions, variability, and health insights
    getStats: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      console.log('🔍 API: Getting cycle stats for user:', userId || 'current');
      return this.request(`/api/cycle-logs/stats${query}`);
    },
    // NEW: Get personalized insights and recommendations
    getInsights: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      console.log('🔍 API: Getting cycle insights for user:', userId || 'current');
      return this.request(`/api/cycle-logs/insights${query}`);
    },
    // NEW: Get future predictions for planning
    getPredictions: (months: number = 3, userId?: number | null) => {
      const params: string[] = [`months=${months}`];
      if (userId) params.push(`user_id=${userId}`);
      console.log('🔍 API: Getting cycle predictions for', months, 'months, user:', userId || 'current');
      return this.request(`/api/cycle-logs/predictions?${params.join('&')}`);
    },
    // Enhanced calendar with phases, confidence, and cycle days
    getCalendarData: (year: number, month: number, userId?: number | null | undefined) => {
      const params: string[] = [`year=${year}`, `month=${month}`];
      if (userId) params.push(`user_id=${userId}`);
      console.log('🔍 API: Getting calendar data for', year, month, 'user:', userId || 'current');
      return this.request(`/api/cycle-logs/calendar?${params.join('&')}`);
    },
    // ML-Enhanced API Endpoints
    getMLInsights: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      return this.request(`/api/cycle-logs/ml-insights${query}`);
    },
    getPatternAnalysis: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      return this.request(`/api/cycle-logs/pattern-analysis${query}`);
    },
    getAdaptiveLearningStatus: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      return this.request(`/api/cycle-logs/adaptive-status${query}`);
    },
    getSeasonalPatterns: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      return this.request(`/api/cycle-logs/seasonal-patterns${query}`);
    },
    getAnomalyDetection: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      return this.request(`/api/cycle-logs/anomaly-detection${query}`);
    },
    getConfidenceMetrics: (userId?: number | null) => {
      const query = userId ? `?user_id=${userId}` : '';
      return this.request(`/api/cycle-logs/confidence-metrics${query}`);
    }
  };

  // Meal API
  meal = {
    getLogs: (page?: number, per_page?: number) => {
      const query = page || per_page ? `?page=${page || 1}&per_page=${per_page || 10}` : '';
      return this.request(`/api/meal-logs/${query}`);
    },
    createLog: (data: any) => this.request('/api/meal-logs/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  };

  // Appointment API
  appointment = {
    getUpcoming: () => this.request('/api/appointments/upcoming'),
    create: (data: any) => this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  };

  // Notification API
  notification = {
    getRecent: () => this.request('/api/notifications/recent'),
    getAll: (page?: number, per_page?: number) => {
      const query = page || per_page ? `?page=${page || 1}&per_page=${per_page || 10}` : '';
      return this.request(`/api/notifications/${query}`);
    },
    getUnreadCount: () => this.request('/api/notifications/unread-count'),
    markAsRead: (id: number) => this.request(`/api/notifications/${id}/read`, { method: 'PATCH' })
  };
}

export const api = new APIClient();
export default api;
