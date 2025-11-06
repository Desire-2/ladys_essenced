/**
 * Parent Appointment Service
 * 
 * Handles all API calls related to parent-managed appointments for children
 */

import api from '@/api';
import { getApiUrl } from '../utils/apiUrl';

export interface Child {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  relationship_type: string;
  created_at?: string;
}

export interface ChildAppointmentBooking {
  provider_id: number;
  child_id: number;
  appointment_date: string;
  issue: string;
  appointment_type_id: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  is_telemedicine?: boolean;
  payment_method?: string;
}

export interface ChildAppointment {
  id: number;
  appointment_date: string;
  issue: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  priority: string;
  provider: {
    id: number;
    name: string;
    specialization: string;
  };
  notes?: string;
  provider_notes?: string;
  booked_by_parent: boolean;
  created_at: string;
}

class ParentAppointmentService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(method: string, params?: any): string {
    return `${method}:${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get list of children for the current parent
   */
  async getParentChildren(): Promise<Child[]> {
    try {
      const cacheKey = this.getCacheKey('getChildren');
      const cached = this.getFromCache<Child[]>(cacheKey);
      if (cached) return cached;

      const response = await api.get(getApiUrl('/parent/children'));
      
      if (response?.data) {
        const children = response?.data?.children || [];
        this.setCache(cacheKey, children);
        return children;
      }

      throw new Error(response?.data?.error || 'Failed to fetch children');
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific child
   */
  async getChildDetails(childId: number): Promise<any> {
    try {
      const cacheKey = this.getCacheKey('getChildDetails', { childId });
      const cached = this.getFromCache<any>(cacheKey);
      if (cached) return cached;

      const response = await api.get(
        getApiUrl(`/parent/children/${childId}/details`)
      );

      if (response?.data) {
        this.setCache(cacheKey, response?.data?.child);
        return response?.data?.child;
      }

      throw new Error(response?.data?.error || 'Failed to fetch child details');
    } catch (error) {
      console.error('Error fetching child details:', error);
      throw error;
    }
  }

  /**
   * Book an appointment for a child
   */
  async bookAppointmentForChild(
    bookingData: ChildAppointmentBooking
  ): Promise<{ success: boolean; message: string; appointment?: any }> {
    try {
      const response = await api.post(
        getApiUrl('/parent/book-appointment-for-child'),
        bookingData
      );

      if (response?.data) {
        this.clearCache(); // Clear cache after booking
        return {
          success: true,
          message: response?.data?.message || 'Appointment booked successfully',
          appointment: response?.data?.appointment
        };
      }

      return {
        success: false,
        message: response?.data?.error || 'Failed to book appointment'
      };
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      return {
        success: false,
        message: error.message || 'Failed to book appointment'
      };
    }
  }

  /**
   * Get all appointments for a specific child
   */
  async getChildAppointments(
    childId: number,
    filters?: {
      status?: string;
      date_from?: string;
      date_to?: string;
      provider_id?: number;
    }
  ): Promise<ChildAppointment[]> {
    try {
      const cacheKey = this.getCacheKey('getChildAppointments', { childId, ...filters });
      const cached = this.getFromCache<ChildAppointment[]>(cacheKey);
      if (cached) return cached;

      let url = getApiUrl(`/parent/children/${childId}/appointments`);
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.provider_id) params.append('provider_id', filters.provider_id.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);

      if (response?.data) {
        const appointments = response?.data?.appointments || [];
        this.setCache(cacheKey, appointments);
        return appointments;
      }

      throw new Error(response?.data?.error || 'Failed to fetch appointments');
    } catch (error) {
      console.error('Error fetching child appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment details
   */
  async getAppointmentDetails(appointmentId: number): Promise<any> {
    try {
      const cacheKey = this.getCacheKey('getAppointmentDetails', { appointmentId });
      const cached = this.getFromCache<any>(cacheKey);
      if (cached) return cached;

      const response = await api.get(
        getApiUrl(`/parent/appointments/${appointmentId}`)
      );

      if (response?.data) {
        this.setCache(cacheKey, response?.data?.appointment);
        return response?.data?.appointment;
      }

      throw new Error(response?.data?.error || 'Failed to fetch appointment details');
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(
        getApiUrl(`/parent/appointments/${appointmentId}/cancel`),
        {}
      );

      if (response?.data) {
        this.clearCache();
        return {
          success: true,
          message: response?.data?.message || 'Appointment cancelled successfully'
        };
      }

      return {
        success: false,
        message: response?.data?.error || 'Failed to cancel appointment'
      };
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel appointment'
      };
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: number,
    newDate: string
  ): Promise<{ success: boolean; message: string; appointment?: any }> {
    try {
      const response = await api.post(
        getApiUrl(`/parent/appointments/${appointmentId}/reschedule`),
        {
          new_appointment_date: newDate
        }
      );

      if (response?.data) {
        this.clearCache();
        return {
          success: true,
          message: response?.data?.message || 'Appointment rescheduled successfully',
          appointment: response?.data?.appointment
        };
      }

      return {
        success: false,
        message: response?.data?.error || 'Failed to reschedule appointment'
      };
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        message: error.message || 'Failed to reschedule appointment'
      };
    }
  }

  /**
   * Get child's appointment history
   */
  async getChildAppointmentHistory(childId: number): Promise<any> {
    try {
      const appointments = await this.getChildAppointments(childId, {
        status: 'completed'
      });

      return {
        completed_appointments: appointments,
        total_completed: appointments.length
      };
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a child
   */
  async getChildUpcomingAppointments(childId: number): Promise<ChildAppointment[]> {
    try {
      const appointments = await this.getChildAppointments(childId, {
        status: 'confirmed'
      });

      // Filter for future appointments
      const now = new Date();
      return appointments.filter(
        apt => new Date(apt.appointment_date) > now
      ).sort((a, b) => 
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      );
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics for a child
   */
  async getChildAppointmentStats(childId: number): Promise<any> {
    try {
      const [details, allAppointments] = await Promise.all([
        this.getChildDetails(childId),
        this.getChildAppointments(childId)
      ]);

      const upcoming = allAppointments.filter(
        apt => new Date(apt.appointment_date) > new Date() && 
               ['pending', 'confirmed'].includes(apt.status)
      );

      const completed = allAppointments.filter(apt => apt.status === 'completed');
      const cancelled = allAppointments.filter(apt => apt.status === 'cancelled');

      return {
        total_appointments: allAppointments.length,
        upcoming_appointments: upcoming.length,
        completed_appointments: completed.length,
        cancelled_appointments: cancelled.length,
        last_appointment: allAppointments[0] || null
      };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      throw error;
    }
  }

  /**
   * Download appointment summary/receipt
   */
  async downloadAppointmentSummary(appointmentId: number): Promise<Blob> {
    try {
      const response = await fetch(
        getApiUrl(`/parent/appointments/${appointmentId}/download`),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download appointment summary');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading appointment summary:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const parentAppointmentService = new ParentAppointmentService();
export default parentAppointmentService;
