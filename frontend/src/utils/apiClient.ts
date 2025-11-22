// Enhanced API Client for Backend Integration
import { getApiUrl, isFeatureEnabled, API_ENDPOINTS } from './apiUrl';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  retries?: number;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseUrl = getApiUrl('');
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  private updateAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  private async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(getApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const nextToken = data.access_token || data.token;
        if (nextToken) {
          this.updateAuthToken(nextToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      requireAuth = true,
      retries = 1,
      timeout = 10000,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : getApiUrl(endpoint);
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    };

    // Add authentication if required and available
    if (requireAuth && this.authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle 401 (Unauthorized) - try to refresh token
      if (response.status === 401 && requireAuth && retries > 0) {
        const refreshSuccess = await this.refreshAuthToken();
        if (refreshSuccess) {
          // Retry the request with new token
          return this.makeRequest(endpoint, { ...options, retries: retries - 1 });
        } else {
          // Refresh failed, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
          return { success: false, error: 'Authentication expired' };
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }

      if (isFeatureEnabled('debug-mode')) {
        console.error('API request failed:', { endpoint, error });
      }

      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // Public API methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // File upload method
  async uploadFile<T>(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, string>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {};
    if (this.authToken && options?.requireAuth !== false) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        ...options?.headers
      }
    });
  }

  // Set auth token (for use by AuthContext)
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Update tokens from storage
  updateTokensFromStorage() {
    this.loadTokensFromStorage();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Enhanced API helpers for specific features
export class AnalyticsAPI {
  static async getDashboardAnalytics(): Promise<ApiResponse> {
    if (!isFeatureEnabled('analytics')) {
      return { success: false, error: 'Analytics feature disabled' };
    }
    return apiClient.get(API_ENDPOINTS.ANALYTICS.DASHBOARD);
  }

  static async getCycleInsights(startDate?: string, endDate?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const endpoint = `${API_ENDPOINTS.ANALYTICS.CYCLE_INSIGHTS}?${params.toString()}`;
    return apiClient.get(endpoint);
  }

  static async getHealthMetrics(): Promise<ApiResponse> {
    return apiClient.get(API_ENDPOINTS.ANALYTICS.HEALTH_METRICS);
  }

  static async getProviderAnalytics(): Promise<ApiResponse> {
    return apiClient.get(API_ENDPOINTS.ANALYTICS.PROVIDER_ANALYTICS);
  }
}

export class HealthProviderAPI {
  static async searchProviders(searchParams: {
    query?: string;
    specialization?: string;
    location?: string;
    availability?: string;
    rating?: number;
    verified?: boolean;
  }): Promise<ApiResponse> {
    if (!isFeatureEnabled('provider-search')) {
      return { success: false, error: 'Provider search feature disabled' };
    }

    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const endpoint = `${API_ENDPOINTS.HEALTH_PROVIDERS.SEARCH}?${params.toString()}`;
    return apiClient.get(endpoint);
  }

  static async getProviderDetails(providerId: number): Promise<ApiResponse> {
    return apiClient.get(`${API_ENDPOINTS.HEALTH_PROVIDERS.DETAILS}/${providerId}`);
  }

  static async getProviderAvailability(providerId: number, date: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ provider_id: providerId.toString(), date });
    return apiClient.get(`${API_ENDPOINTS.HEALTH_PROVIDERS.AVAILABILITY}?${params.toString()}`);
  }

  static async bookAppointment(bookingData: {
    providerId: number;
    date: string;
    time: string;
    consultationType: string;
    priority: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.HEALTH_PROVIDERS.BOOK_APPOINTMENT, bookingData);
  }
}

export class NotificationAPI {
  static async getNotifications(): Promise<ApiResponse> {
    return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
  }

  static async markAsRead(notificationIds: string[]): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, { notification_ids: notificationIds });
  }

  static async deleteNotifications(notificationIds: string[]): Promise<ApiResponse> {
    return apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.DELETE}`, {
      body: JSON.stringify({ notification_ids: notificationIds })
    });
  }

  static async updatePreferences(preferences: any): Promise<ApiResponse> {
    return apiClient.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, preferences);
  }
}

export default apiClient;
