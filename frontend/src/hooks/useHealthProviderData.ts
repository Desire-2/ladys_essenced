'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildHealthProviderApiUrl } from '../utils/apiConfig';
import { handleApiResponse } from '../utils/health-provider';
import type { 
  ProviderStats, 
  Appointment, 
  UnassignedAppointment, 
  Patient, 
  PatientHistory, 
  HealthProvider, 
  WeeklyAvailability, 
  TimeSlot, 
  Analytics 
} from '../types/health-provider';

export const useHealthProviderData = () => {
  const { user } = useAuth();
  
  // State management
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unassignedAppointments, setUnassignedAppointments] = useState<UnassignedAppointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [profile, setProfile] = useState<HealthProvider | null>(null);
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [schedule, setSchedule] = useState<Record<string, Appointment[]>>({});
  
  // Providers for booking
  const [availableProviders, setAvailableProviders] = useState<HealthProvider[]>([]);
  const [providerTimeSlots, setProviderTimeSlots] = useState<TimeSlot[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  
  // Error and success states
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load dashboard stats');
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load dashboard statistics');
    }
  }, [user?.access_token]);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/appointments'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load appointments');
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    }
  }, [user?.access_token]);

  // Load unassigned appointments
  const loadUnassignedAppointments = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/appointments/unassigned'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load unassigned appointments');
      setUnassignedAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error loading unassigned appointments:', error);
      setError('Failed to load available appointments');
    }
  }, [user?.access_token]);

  // Load patients
  const loadPatients = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/patients'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load patients');
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
    }
  }, [user?.access_token]);

  // Load patient history
  const loadPatientHistory = useCallback(async (patientId: number) => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl(`/patients/${patientId}/history`), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load patient history');
      setPatientHistory(data);
    } catch (error) {
      console.error('Error loading patient history:', error);
      setError('Failed to load patient history');
    }
  }, [user?.access_token]);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/profile'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load profile');
      setProfile(data.provider);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    }
  }, [user?.access_token]);

  // Load availability
  const loadAvailability = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/availability'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load availability');
      setAvailability(data.availability || {});
    } catch (error) {
      console.error('Error loading availability:', error);
      setError('Failed to load availability schedule');
    }
  }, [user?.access_token]);

  // Load schedule
  const loadSchedule = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/schedule'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load schedule');
      setSchedule(data.schedule || {});
    } catch (error) {
      console.error('Error loading schedule:', error);
      setError('Failed to load weekly schedule');
    }
  }, [user?.access_token]);

  // Load analytics
  const loadAnalytics = useCallback(async (days: number = 30) => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl(`/analytics?days=${days}`), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    }
  }, [user?.access_token]);

  // Load available providers for booking
  const loadAvailableProviders = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl('/providers/available'), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load available providers');
      setAvailableProviders(data.providers || []);
    } catch (error) {
      console.error('Error loading available providers:', error);
      setError('Failed to load available providers');
    }
  }, [user?.access_token]);

  // Load provider time slots
  const loadProviderTimeSlots = useCallback(async (providerId: number, date: string) => {
    if (!user?.access_token) return;
    
    setLoadingTimeSlots(true);
    try {
      const response = await fetch(buildHealthProviderApiUrl(`/providers/${providerId}/slots?date=${date}`), {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to load time slots');
      setProviderTimeSlots(data.time_slots || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setError('Failed to load available time slots');
    } finally {
      setLoadingTimeSlots(false);
    }
  }, [user?.access_token]);

  // Claim appointment
  const claimAppointment = useCallback(async (appointmentId: number) => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(buildHealthProviderApiUrl(`/appointments/${appointmentId}/claim`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await handleApiResponse(response, 'Failed to claim appointment');
      setSuccessMessage('Appointment claimed successfully!');
      
      // Reload data
      await Promise.all([
        loadUnassignedAppointments(),
        loadAppointments(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error claiming appointment:', error);
      setError('Failed to claim appointment');
    }
  }, [user?.access_token, loadUnassignedAppointments, loadAppointments, loadStats]);

  // Initial data loading
  useEffect(() => {
    if (user?.access_token) {
      setLoading(true);
      Promise.all([
        loadStats(),
        loadAppointments(),
        loadUnassignedAppointments(),
        loadPatients(),
        loadProfile(),
        loadAvailability(),
        loadSchedule(),
        loadAnalytics(),
        loadAvailableProviders()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [
    user?.access_token,
    loadStats,
    loadAppointments,
    loadUnassignedAppointments,
    loadPatients,
    loadProfile,
    loadAvailability,
    loadSchedule,
    loadAnalytics,
    loadAvailableProviders
  ]);

  return {
    // Data
    stats,
    appointments,
    unassignedAppointments,
    patients,
    patientHistory,
    profile,
    availability,
    analytics,
    schedule,
    availableProviders,
    providerTimeSlots,
    
    // Loading states
    loading,
    loadingTimeSlots,
    
    // Error and success states
    error,
    successMessage,
    setError,
    setSuccessMessage,
    
    // Actions
    loadPatientHistory,
    loadAnalytics,
    loadProviderTimeSlots,
    claimAppointment,
    
    // Refresh functions
    refreshData: () => {
      Promise.all([
        loadStats(),
        loadAppointments(),
        loadUnassignedAppointments(),
        loadPatients(),
        loadSchedule()
      ]);
    }
  };
};
