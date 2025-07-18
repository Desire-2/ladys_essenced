import { useState, useEffect, useCallback } from 'react';
import { appointmentAPI } from '../api';

interface AvailabilitySlot {
  date: string;
  time: string;
  datetime: string;
  day_name: string;
  provider_id: number;
  duration_minutes: number;
}

interface AvailabilitySummary {
  date: string;
  day_name: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  available_slots: number;
  total_slots: number;
  availability_percentage: number;
}

interface WeeklyPattern {
  [key: string]: {
    available: boolean;
    start_time: string | null;
    end_time: string | null;
  };
}

interface ProviderAvailabilityData {
  provider_id: number;
  availability_summary: AvailabilitySummary[];
  weekly_pattern: WeeklyPattern;
  has_availability: boolean;
  summary_period_days: number;
}

interface UseEnhancedAvailabilityReturn {
  // State
  nextAvailableSlot: AvailabilitySlot | null;
  availabilitySummary: ProviderAvailabilityData | null;
  timeSlots: any[];
  loading: boolean;
  error: string | null;
  
  // Functions
  getNextAvailableSlot: (providerId: number, daysAhead?: number, duration?: number) => Promise<AvailabilitySlot | null>;
  getAvailabilitySummary: (providerId: number, daysAhead?: number) => Promise<ProviderAvailabilityData | null>;
  getTimeSlots: (providerId: number, date: string) => Promise<any[]>;
  formatAvailabilityDisplay: (slot: AvailabilitySlot | null) => string;
  getAvailabilityStatusColor: (availabilityText: string) => string;
  clearData: () => void;
}

export const useEnhancedAvailability = (): UseEnhancedAvailabilityReturn => {
  const [nextAvailableSlot, setNextAvailableSlot] = useState<AvailabilitySlot | null>(null);
  const [availabilitySummary, setAvailabilitySummary] = useState<ProviderAvailabilityData | null>(null);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNextAvailableSlot = useCallback(async (
    providerId: number, 
    daysAhead: number = 14, 
    duration: number = 30
  ): Promise<AvailabilitySlot | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentAPI.getNextAvailableSlot(providerId, daysAhead, duration);
      
      if (response.data.next_available_slot) {
        const slot = response.data.next_available_slot;
        setNextAvailableSlot(slot);
        return slot;
      } else {
        setNextAvailableSlot(null);
        return null;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get next available slot');
      setNextAvailableSlot(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailabilitySummary = useCallback(async (
    providerId: number, 
    daysAhead: number = 7
  ): Promise<ProviderAvailabilityData | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentAPI.getProviderAvailabilitySummary(providerId, daysAhead);
      const data = response.data;
      
      setAvailabilitySummary(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get availability summary');
      setAvailabilitySummary(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTimeSlots = useCallback(async (
    providerId: number, 
    date: string
  ): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentAPI.getProviderTimeSlots(providerId, date);
      const slots = response.data.slots || [];
      
      setTimeSlots(slots);
      return slots;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get time slots');
      setTimeSlots([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const formatAvailabilityDisplay = useCallback((slot: AvailabilitySlot | null): string => {
    if (!slot) return 'No availability found';
    
    const slotDate = new Date(slot.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format the date nicely
    if (slotDate.toDateString() === today.toDateString()) {
      return `Today at ${slot.time}`;
    } else if (slotDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${slot.time}`;
    } else {
      return `${slotDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })} at ${slot.time}`;
    }
  }, []);

  const getAvailabilityStatusColor = useCallback((availabilityText: string): string => {
    if (availabilityText.includes('today') || availabilityText.includes('Today')) {
      return 'text-success';
    } else if (availabilityText.includes('Tomorrow') || availabilityText.includes('tomorrow')) {
      return 'text-info';
    } else if (availabilityText.includes('Limited') || availabilityText.includes('No availability')) {
      return 'text-warning';
    }
    return 'text-primary';
  }, []);

  const clearData = useCallback(() => {
    setNextAvailableSlot(null);
    setAvailabilitySummary(null);
    setTimeSlots([]);
    setError(null);
  }, []);

  return {
    // State
    nextAvailableSlot,
    availabilitySummary,
    timeSlots,
    loading,
    error,
    
    // Functions
    getNextAvailableSlot,
    getAvailabilitySummary,
    getTimeSlots,
    formatAvailabilityDisplay,
    getAvailabilityStatusColor,
    clearData
  };
};
