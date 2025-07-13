// API utility functions for dashboard interactions

class APIClient {
  private getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint; // Use relative URLs to leverage Next.js rewrites
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
    getCurrentUser: () => this.request('/api/auth/me')
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

  // Cycle API
  cycle = {
    getLogs: (page?: number, per_page?: number) => {
      const query = page || per_page ? `?page=${page || 1}&per_page=${per_page || 10}` : '';
      return this.request(`/api/cycle-logs${query}`);
    },
    createLog: (data: any) => this.request('/api/cycle-logs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getStats: () => this.request('/api/cycle-logs/stats'),
    getCalendarData: (year: number, month: number) => 
      this.request(`/api/cycle-logs/calendar?year=${year}&month=${month}`)
  };

  // Meal API
  meal = {
    getLogs: (page?: number, per_page?: number) => {
      const query = page || per_page ? `?page=${page || 1}&per_page=${per_page || 10}` : '';
      return this.request(`/api/meal-logs${query}`);
    },
    createLog: (data: any) => this.request('/api/meal-logs', {
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
    markAsRead: (id: number) => this.request(`/api/notifications/${id}/read`, { method: 'PATCH' })
  };
}

export const api = new APIClient();
export default api;
