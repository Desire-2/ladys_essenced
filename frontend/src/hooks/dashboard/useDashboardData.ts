import { useState, useCallback } from 'react';
import { cycleAPI, mealAPI, appointmentAPI, notificationAPI } from '../../api';
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

export const useDashboardData = () => {
  // Data states
  const [cycleData, setCycleData] = useState<CycleData>({
    nextPeriod: null,
    lastPeriod: null,
    cycleLength: null,
    periodLength: null,
    totalLogs: 0,
  });
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [calendarData, setCalendarData] = useState<any>(null);

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
    setDataLoading('cycle', true);
    clearDataError('cycle');

    try {
      console.log('Loading cycle data for user:', selectedChild || 'current user');
      // @ts-ignore - cycleAPI.getStats accepts number | null
      const cycleResponse = await cycleAPI.getStats(selectedChild);

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

      setCycleData(transformedCycleData);
      setDataAvailable('cycle', true);
      console.log('Cycle data loaded:', transformedCycleData);
    } catch (err: any) {
      console.error('Failed to load cycle data:', err);
      setDataError('cycle', err.response?.data?.message || 'Failed to load cycle tracking data');
      setDataAvailable('cycle', false);
    } finally {
      setDataLoading('cycle', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable]);

  const loadMealsData = useCallback(async (selectedChild?: number | null) => {
    setDataLoading('meals', true);
    clearDataError('meals');

    try {
      console.log('Loading recent meals for user:', selectedChild || 'current user');
      // @ts-ignore - mealAPI.getLogs accepts userId parameter
      const mealsResponse = await mealAPI.getLogs(1, 5, {}, selectedChild);
      setRecentMeals(mealsResponse.data.logs || []);
      setDataAvailable('meals', true);
      console.log('Meals loaded:', mealsResponse.data.logs);
    } catch (err: any) {
      console.error('Failed to load meals:', err);
      setDataError('meals', err.response?.data?.message || 'Failed to load meal logs');
      setDataAvailable('meals', false);
    } finally {
      setDataLoading('meals', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable]);

  const loadAppointmentsData = useCallback(async (selectedChild?: number | null) => {
    setDataLoading('appointments', true);
    clearDataError('appointments');

    try {
      console.log('Loading appointments for user:', selectedChild || 'current user');
      // @ts-ignore - appointmentAPI.getUpcoming accepts userId parameter
      const appointmentsResponse = await appointmentAPI.getUpcoming(selectedChild);
      setUpcomingAppointments(appointmentsResponse.data || []);
      setDataAvailable('appointments', true);
      console.log('Appointments loaded:', appointmentsResponse.data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setDataError('appointments', err.response?.data?.message || 'Failed to load appointments');
      setDataAvailable('appointments', false);
    } finally {
      setDataLoading('appointments', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable]);

  const loadNotificationsData = useCallback(async () => {
    setDataLoading('notifications', true);
    clearDataError('notifications');

    try {
      console.log('Loading notifications...');
      const notificationsResponse = await notificationAPI.getRecent();
      setNotifications(notificationsResponse.data || []);
      setDataAvailable('notifications', true);
      console.log('Notifications loaded:', notificationsResponse.data);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setDataError('notifications', err.response?.data?.message || 'Failed to load notifications');
      setDataAvailable('notifications', false);
    } finally {
      setDataLoading('notifications', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable]);

  const loadCalendarData = useCallback(async (year?: number, month?: number, selectedChild?: number | null) => {
    setDataLoading('calendar', true);
    clearDataError('calendar');

    try {
      const targetDate = year && month ? new Date(year, month - 1) : new Date();
      // Use type assertion to handle API type mismatch
      const response = await (cycleAPI.getCalendarData as any)(
        targetDate.getFullYear(), 
        targetDate.getMonth() + 1, 
        selectedChild
      );
      setCalendarData(response.data);
      setDataAvailable('calendar', true);
      console.log('Calendar data loaded for user:', selectedChild || 'current user', response.data);
    } catch (err: any) {
      console.error('Failed to load calendar data:', err);
      setDataError('calendar', err.response?.data?.message || 'Failed to load calendar data');
      setDataAvailable('calendar', false);
    } finally {
      setDataLoading('calendar', false);
    }
  }, [setDataLoading, clearDataError, setDataError, setDataAvailable]);

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
        await loadAppointmentsData(selectedChild);
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
    await Promise.allSettled([
      loadCycleData(selectedChild),
      loadMealsData(selectedChild),
      loadAppointmentsData(selectedChild),
      loadNotificationsData()
    ]);
  }, [loadCycleData, loadMealsData, loadAppointmentsData, loadNotificationsData]);

  return {
    // Data
    cycleData,
    recentMeals,
    upcomingAppointments,
    notifications,
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