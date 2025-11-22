'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { healthProviderAPI } from '../api';
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
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getDashboard(user.user_id);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard statistics');
    }
  }, [user?.user_id]);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getAppointments({});
      setAppointments(response.data.appointments || response.data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      setError(error.response?.data?.message || 'Failed to load appointments');
    }
  }, [user?.user_id]);

  // Load unassigned appointments
  const loadUnassignedAppointments = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getAppointments({ status: 'pending' });
      setUnassignedAppointments(response.data.appointments || response.data || []);
    } catch (error: any) {
      console.error('Error loading unassigned appointments:', error);
      setError(error.response?.data?.message || 'Failed to load available appointments');
    }
  }, [user?.user_id]);

  // Load patients
  const loadPatients = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getPatients(user.user_id);
      setPatients(response.data.patients || response.data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      setError(error.response?.data?.message || 'Failed to load patients');
    }
  }, [user?.user_id]);

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
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getProfile(user.user_id);
      setProfile(response.data.provider || response.data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.response?.data?.message || 'Failed to load profile');
    }
  }, [user?.user_id]);

  // Load availability
  const loadAvailability = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getAvailability(user.user_id);
      setAvailability(response.data.availability || response.data || {});
    } catch (error: any) {
      console.error('Error loading availability:', error);
      setError(error.response?.data?.message || 'Failed to load availability schedule');
    }
  }, [user?.user_id]);

  // Load schedule
  const loadSchedule = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user?.user_id) return;
    
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await healthProviderAPI.getAppointments(params);
      const appointmentsByDate: Record<string, any[]> = {};
      
      (response.data.appointments || []).forEach((apt: any) => {
        const date = apt.appointment_date.split('T')[0];
        if (!appointmentsByDate[date]) appointmentsByDate[date] = [];
        appointmentsByDate[date].push(apt);
      });
      
      setSchedule(appointmentsByDate);
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      setError(error.response?.data?.message || 'Failed to load schedule');
    }
  }, [user?.user_id]);

  // Load analytics
  const loadAnalytics = useCallback(async (days: number = 30) => {
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getAnalytics(user.user_id, { days });
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error.response?.data?.message || 'Failed to load analytics data');
    }
  }, [user?.user_id]);

  // Load available providers for booking
  const loadAvailableProviders = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      const response = await healthProviderAPI.getPublicProviders();
      setAvailableProviders(response.data.providers || response.data || []);
    } catch (error: any) {
      console.error('Error loading available providers:', error);
      setError(error.response?.data?.message || 'Failed to load available providers');
    }
  }, [user?.user_id]);

  // Load provider time slots
  const loadProviderTimeSlots = useCallback(async (providerId: number, date: string) => {
    if (!user?.user_id) return;
    
    setLoadingTimeSlots(true);
    try {
      const response = await healthProviderAPI.getProviderTimeSlots(providerId, date);
      setProviderTimeSlots(response.data.time_slots || response.data || []);
    } catch (error: any) {
      console.error('Error loading time slots:', error);
      setError(error.response?.data?.message || 'Failed to load available time slots');
    } finally {
      setLoadingTimeSlots(false);
    }
  }, [user?.user_id]);

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
