import { useState, useCallback } from 'react';
import { cycleAPI, mealAPI, appointmentAPI } from '../../api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useParentChildData } from './useParentChildData';
import { 
  CycleData, 
  MealLog, 
  Appointment, 
  Notification,
  DataLoadingStates,
  DataErrors,
  DataAvailability 
} from '../../app/dashboard/types';
import { formatDate } from '../../app/dashboard/utils';

export function useDashboardData() {
  // Get enhanced notifications from context
  const { notifications: enhancedNotifications, fetchNotifications: refreshNotifications } = useNotification();
  const { hasRole, accessToken } = useAuth();
  const { getAppointmentsForChild, getMealsForChild, getCycleDataForChild } = useParentChildData();
  
  // State for different data types
  const [cycleData, setCycleData] = useState<any>({});
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any>({});

  // Loading and error states
  const [dataLoadingStates, setDataLoadingStates] = useState<DataLoadingStates>({
    children: false,
    cycle: false,
    meals: false,
    appointments: false,
    notifications: false,
    calendar: false
  });

  const [dataErrors, setDataErrors] = useState<DataErrors>({
    children: '',
    cycle: '',
    meals: '',
    appointments: '',
    notifications: '',
    calendar: ''
  });

  const [dataAvailability, setDataAvailability] = useState<DataAvailability>({
    children: false,
    cycle: false,
    meals: false,
    appointments: false,
    notifications: false,
    calendar: false
  });

  // Helper functions for managing data states
  const setDataLoading = useCallback((dataType: keyof DataLoadingStates, isLoading: boolean) => {
    setDataLoadingStates(prev => ({ ...prev, [dataType]: isLoading }));
  }, []);

  const setDataError = useCallback((dataType: keyof DataErrors, error: string) => {
    setDataErrors(prev => ({ ...prev, [dataType]: error }));
  }, []);

  const setDataAvailable = useCallback((dataType: keyof DataAvailability, available: boolean) => {
    setDataAvailability(prev => ({ ...prev, [dataType]: available }));
  }, []);

  const clearDataError = useCallback((dataType: keyof DataErrors) => {
    setDataError(dataType, '');
  }, [setDataError]);

  // Individual data loading functions
  const loadCycleData = useCallback(async (selectedChild?: number | null) => {
    if (!accessToken) {
      console.warn('Skipping cycle data load until authentication token is available');
      return;
    }
    setDataLoading('cycle', true);
    clearDataError('cycle');

    try {
      console.log('🔄 Loading cycle data for user:', selectedChild || 'current user');
      
      let cycleResponse;
      
      if (selectedChild && hasRole('parent')) {
        // Use parent-child aware method for parent viewing child data
        console.log('👨‍👩‍👧 Using parent-child method for child:', selectedChild);
        const cycleData = await getCycleDataForChild(selectedChild);
        cycleResponse = { data: cycleData };
      } else {
        // Use regular API for self or when no child selected
        console.log('👤 Using regular API for user:', selectedChild || 'current');
        cycleResponse = await cycleAPI.getStats(selectedChild as any);
      }

      console.log('📊 Raw cycle response:', cycleResponse);

      const transformedCycleData = {
        nextPeriod: cycleResponse.data.next_period_prediction 
          ? formatDate(cycleResponse.data.next_period_prediction) 
          : null,
        lastPeriod: cycleResponse.data.latest_period_start 
          ? formatDate(cycleResponse.data.latest_period_start) 
          : null,
        cycleLength: cycleResponse.data.average_cycle_length 
          ? Math.round(cycleResponse.data.average_cycle_length) 
          : null,
        periodLength: cycleResponse.data.average_period_length 
          ? Math.round(cycleResponse.data.average_period_length) 
          : null,
        totalLogs: cycleResponse.data.total_logs || 0
      };

      console.log('✅ Transformed cycle data:', transformedCycleData);
      setCycleData(transformedCycleData);
      setDataAvailable('cycle', true);
    } catch (err: any) {
      console.error('❌ Failed to load cycle data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setDataError('cycle', err.response?.data?.message || err.message || 'Failed to load cycle tracking data');
      setDataAvailable('cycle', false);
    } finally {
      setDataLoading('cycle', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable, hasRole, getCycleDataForChild, accessToken]);

  const loadMealsData = useCallback(async (selectedChild?: number | null) => {
    // Token is handled by axios interceptor, but log if missing
    if (!accessToken && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        console.error('❌ No token available for meals API call');
        setDataError('meals', 'Authorization token is required. Please log in again.');
        return;
      }
      console.log('⚠️ accessToken state not set but localStorage has token, proceeding...');
    }
    setDataLoading('meals', true);
    clearDataError('meals');

    try {
      console.log('Loading recent meals for user:', selectedChild || 'current user');
      
      let meals = [];
      
      if (selectedChild && hasRole('parent')) {
        // Use parent-child aware method for parent viewing child data
        meals = await getMealsForChild(selectedChild);
      } else {
        // Use regular API for self or when no child selected
        const mealsResponse = await (mealAPI.getLogs as any)(1, 5, {}, selectedChild);
        meals = mealsResponse.data.logs || [];
      }
      
      setRecentMeals(meals);
      setDataAvailable('meals', true);
      console.log('Meals loaded:', meals);
    } catch (err: any) {
      console.error('Failed to load meals:', err);
      setDataError('meals', err.response?.data?.message || err.message || 'Failed to load meal logs');
      setDataAvailable('meals', false);
    } finally {
      setDataLoading('meals', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable, hasRole, getMealsForChild, accessToken]);

  const loadAppointmentsData = useCallback(async (selectedChild?: number | null, forceRefresh = false) => {
    // Token is handled by axios interceptor, but log if missing
    if (!accessToken && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        console.error('❌ No token available for appointments API call');
        setDataError('appointments', 'Authorization token is required. Please log in again.');
        return;
      }
      console.log('⚠️ accessToken state not set but localStorage has token, proceeding...');
    }
    setDataLoading('appointments', true);
    clearDataError('appointments');

    try {
      console.log('Loading appointments for user:', selectedChild || 'current user', forceRefresh ? '(forced refresh)' : '');
      
      // Add a small delay to ensure backend has processed any recent changes
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      let appointments = [];
      
      console.log('🔍 useDashboardData: selectedChild:', selectedChild);
      console.log('🔍 useDashboardData: hasRole("parent"):', hasRole('parent'));
      
      if (selectedChild && hasRole('parent')) {
        // Use parent-child aware method for parent viewing child data
        console.log('🔍 useDashboardData: Using parent-child method for selectedChild:', selectedChild);
        appointments = await getAppointmentsForChild(selectedChild);
      } else {
        // Use regular API for self or when no child selected
        console.log('🔍 useDashboardData: Using regular API with selectedChild:', selectedChild);
        const appointmentsResponse = await (appointmentAPI.getUpcoming as any)(selectedChild);
        appointments = appointmentsResponse.data || [];
      }
      
      setUpcomingAppointments(appointments);
      setDataAvailable('appointments', true);
      
      console.log('Appointments loaded successfully:', appointments.length, 'appointments found');
      
      if (forceRefresh && appointments.length > 0) {
        console.log('Refresh successful - appointments updated in UI');
      }
      
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Response error:', err.response.status, err.response.data);
      } else if (err.request) {
        console.error('Network error:', err.request);
      } else {
        console.error('Request setup error:', err.message);
      }
      
      setDataError('appointments', err.response?.data?.message || err.message || 'Failed to load appointments');
      setDataAvailable('appointments', false);
    } finally {
      setDataLoading('appointments', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable, hasRole, getAppointmentsForChild, accessToken]);

  const loadNotificationsData = useCallback(async () => {
    if (!accessToken) {
      console.warn('⚠️ Skipping notification refresh - no access token available');
      return;
    }
    setDataLoading('notifications', true);
    clearDataError('notifications');

    try {
      console.log('📬 Loading enhanced notifications...');
      // Use enhanced notification context to refresh data
      const result = await refreshNotifications();
      
      if (result !== null) {
        setDataAvailable('notifications', true);
        console.log('✅ Enhanced notifications refreshed successfully');
      } else {
        console.warn('⚠️ Notifications fetch returned null, likely auth issue');
        setDataAvailable('notifications', false);
      }
    } catch (err: any) {
      // This catch might not be reached if fetchNotifications handles its own errors
      console.error('❌ Unexpected error in notification refresh:', err);
      setDataError('notifications', err?.message || 'Failed to load notifications');
      setDataAvailable('notifications', false);
    } finally {
      setDataLoading('notifications', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable, refreshNotifications, accessToken]);

  const loadCalendarData = useCallback(async (year?: number, month?: number, selectedChild?: number | null) => {
    if (!accessToken) {
      console.warn('⚠️ Skipping calendar load - no access token available');
      setDataError('calendar', 'Authentication required. Please log in.');
      return;
    }
    
    setDataLoading('calendar', true);
    clearDataError('calendar');

    try {
      const targetDate = year && month ? new Date(year, month - 1) : new Date();
      console.log('🗓️ Loading calendar data for:', {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        user: selectedChild || 'current'
      });
      
      const response = await cycleAPI.getCalendarData(
        targetDate.getFullYear(), 
        targetDate.getMonth() + 1, 
        selectedChild as any
      );
      
      console.log('✅ Calendar data loaded:', response.data);
      setCalendarData(response.data);
      setDataAvailable('calendar', true);
    } catch (err: any) {
      console.error('❌ Failed to load calendar data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to load calendar data';
      if (err.message?.includes('Invalid token') || err.message?.includes('expired')) {
        errorMessage = 'Session expired. Please refresh the page or log in again.';
      } else if (err.message?.includes('Authorization')) {
        errorMessage = 'Authentication required. Please log in.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setDataError('calendar', errorMessage);
      setDataAvailable('calendar', false);
    } finally {
      setDataLoading('calendar', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable, accessToken]);

  // Helper function to retry loading specific data type
  const retryDataLoad = useCallback(async (dataType: string, selectedChild?: number | null) => {
    switch (dataType) {
      case 'cycle':
        await loadCycleData(selectedChild);
        break;
      case 'meals':
        await loadMealsData(selectedChild);
        break;
      case 'appointments':
        await loadAppointmentsData(selectedChild, false);
        break;
      case 'notifications':
        await loadNotificationsData();
        break;
      case 'calendar':
        await loadCalendarData(undefined, undefined, selectedChild || null);
        break;
    }
  }, [loadCycleData, loadMealsData, loadAppointmentsData, loadNotificationsData, loadCalendarData]);

  // Load all dashboard data
  const loadAllData = useCallback(async (selectedChild?: number | null) => {
    if (!accessToken) {
      console.warn('Skipping dashboard data load until authentication token is available');
      return;
    }

    await Promise.allSettled([
      loadCycleData(selectedChild),
      loadMealsData(selectedChild),
      loadAppointmentsData(selectedChild),
      loadNotificationsData()
    ]);
  }, [loadCycleData, loadMealsData, loadAppointmentsData, loadNotificationsData, accessToken]);

  return {
    // Data
    cycleData,
    recentMeals,
    upcomingAppointments,
    notifications: enhancedNotifications, // Use enhanced notifications from context
    calendarData,
    
    // States
    dataLoadingStates,
    dataErrors,
    dataAvailability,
    
    // Actions
    loadCycleData,
    loadMealsData,
    loadAppointmentsData,
    loadNotificationsData,
    loadCalendarData,
    loadAllData,
    retryDataLoad,
    
    // Helpers
    setDataLoading,
    setDataError,
    setDataAvailable,
    clearDataError
  };
};