import { api } from '@/lib/axios';
import type {
  AvailabilityConfig,
  DashboardStats,
  NextAvailableSlot,
  Patient,
  ProviderAppointment,
  ProviderProfile,
  ScheduleDay,
  UnassignedAppointment,
  UpdateAppointmentPayload,
  ProviderNotification,
} from '@/types/provider';

export const providerApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/health-provider/dashboard/stats');
    return res.data;
  },

  getAppointments: async (
    params: {
      page?: number;
      per_page?: number;
      status?: string;
      priority?: string;
      date_filter?: string;
      patient_search?: string;
    } = {},
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') searchParams.set(k, String(v));
    });
    const qs = searchParams.toString();
    const res = await api.get<{
      appointments: ProviderAppointment[];
      total: number;
      pages: number;
      current_page: number;
    }>(`/health-provider/appointments${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  getAppointment: async (id: number): Promise<ProviderAppointment> => {
    const res = await api.get<ProviderAppointment>(`/health-provider/appointments/${id}`);
    return res.data;
  },

  getUnassignedAppointments: async (): Promise<{ appointments: UnassignedAppointment[] }> => {
    const res = await api.get<{ appointments: UnassignedAppointment[] }>(
      '/health-provider/appointments/unassigned',
    );
    return res.data;
  },

  claimAppointment: async (appointmentId: number): Promise<{ message: string }> => {
    const res = await api.patch<{ message: string }>(
      `/health-provider/appointments/${appointmentId}/claim`,
    );
    return res.data;
  },

  updateAppointment: async (
    appointmentId: number,
    payload: UpdateAppointmentPayload,
  ): Promise<{ message: string }> => {
    const res = await api.patch<{ message: string }>(
      `/health-provider/appointments/${appointmentId}/update`,
      payload,
    );
    return res.data;
  },

  getNextAvailableSlot: async (): Promise<NextAvailableSlot | null> => {
    try {
      const res = await api.get<NextAvailableSlot>(
        '/health-provider/appointments/next-available-slot',
      );
      return res.data;
    } catch {
      return null;
    }
  },

  getSchedule: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    const res = await api.get<{
      schedule: ScheduleDay;
      provider_info: { name: string; specialization: string; clinic_name: string };
    }>(`/health-provider/schedule${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  getPatients: async (search?: string): Promise<{ patients: Patient[] }> => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get<{ patients: Patient[] }>(`/health-provider/patients${qs}`);
    return res.data;
  },

  getAvailability: async (): Promise<AvailabilityConfig> => {
    const res = await api.get<AvailabilityConfig>('/health-provider/availability');
    return res.data;
  },

  updateAvailability: async (config: AvailabilityConfig): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>('/health-provider/availability', config);
    return res.data;
  },

  getProfile: async (): Promise<{ profile: ProviderProfile }> => {
    const res = await api.get<{ profile: ProviderProfile }>('/health-provider/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<ProviderProfile>): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>('/health-provider/profile', data);
    return res.data;
  },

  getNotifications: async (page = 1, perPage = 20) => {
    const res = await api.get<{
      notifications: ProviderNotification[];
      total: number;
      pages: number;
      current_page: number;
    }>(`/health-provider/notifications?page=${page}&per_page=${perPage}`);
    return res.data;
  },

  markNotificationRead: async (notificationId: number) => {
    const res = await api.patch(`/health-provider/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.patch('/health-provider/notifications/read-all');
    return res.data;
  },
};
