'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { cycleAPI, mealAPI, appointmentAPI, notificationAPI, parentAPI } from '../../api';
import { useCycle } from '../../contexts/CycleContext';
import { useMeal } from '../../contexts/MealContext';
import { useAppointment } from '../../contexts/AppointmentContext';

interface User {
  id: number;
  name: string;
  user_type: 'parent' | 'adolescent';
}

interface Child {
  id: number;
  name: string;
  date_of_birth?: string;
  user_id?: number;
  relationship?: string;
}

interface CycleData {
  nextPeriod: string | null;
  lastPeriod: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  totalLogs: number;
}

interface MealLog {
  id: number;
  date?: string;
  meal_time?: string;
  meal_type: string;
  details?: string;
  description?: string;
}

interface Appointment {
  id: number;
  date?: string;
  appointment_date?: string;
  issue: string;
  status: string;
  priority?: string;
  for_user?: string;
  provider_name?: string;
  provider_id?: number;
}

interface ProviderAvailability {
  id: number;
  name: string;
  specialization: string;
  clinic_name?: string;
  clinic_address?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  is_verified: boolean;
  is_available: boolean;
  next_available_slot?: string;
  availability_summary?: string;
  weekly_availability?: {
    [key: string]: ProviderAvailabilityDetail;
  };
  rating?: number;
  total_appointments?: number;
  response_time?: string;
  available_slots: Array<{
    date: string;
    day: string;
    start_time: string;
    end_time: string;
    available_times: string[];
  }>;
}

interface TimeSlot {
  time: string;
  is_available: boolean;
  provider_id: number;
  provider_name: string;
  slot_id?: string;
  duration?: number;
}

interface ProviderAvailabilityDetail {
  day: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  total_slots?: number;
  available_slots?: number;
}

interface Notification {
  id: number;
  message: string;
  date: string;
  is_read: boolean;
}

export default function Dashboard() {
  const { user, loading: authLoading, logout, hasRole, getDashboardRoute } = useAuth();
  const { addCycleLog, fetchCycleStats, error: cycleError, loading: cycleLoading } = useCycle();
  const { addMealLog, error: mealError, loading: mealLoading } = useMeal();
  const { createAppointment, error: appointmentError, loading: appointmentLoading } = useAppointment();
  const [activeTab, setActiveTab] = useState('overview');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [cycleData, setCycleData] = useState<CycleData>({
    nextPeriod: null,
    lastPeriod: null,
    cycleLength: null,
    periodLength: null,
    totalLogs: 0,
  });
  const [calendarData, setCalendarData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [modalForm, setModalForm] = useState<any>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availableProviders, setAvailableProviders] = useState<ProviderAvailability[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [appointmentPriority, setAppointmentPriority] = useState<string>('normal');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Enhanced appointment states
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [specializationFilter, setSpecializationFilter] = useState<string>('');
  const [showProviderDetails, setShowProviderDetails] = useState<{[key: number]: boolean}>({});
  const [comparedProviders, setComparedProviders] = useState<number[]>([]);
  const [appointmentConflicts, setAppointmentConflicts] = useState<string[]>([]);
  const [timeSlotPreferences, setTimeSlotPreferences] = useState<string[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<{
    providers: number[];
    dates: string[];
    timeSlots: string[];
    reasons: string[];
  }>({ providers: [], dates: [], timeSlots: [], reasons: [] });
  
  // Child management state
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const [childFormError, setChildFormError] = useState('');

  const router = useRouter();

  // Helper function to safely access localStorage
  const getStorageItem = (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  // Helper function to safely format dates
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Auth check and data loading
  useEffect(() => {
    console.log('Dashboard useEffect: authLoading =', authLoading, 'user =', user);
    
    // If auth is still loading, wait.
    if (authLoading) {
      console.log('Dashboard: Auth still loading, waiting...');
      return;
    }

    // If auth has loaded and there's no user, redirect to login.
    if (!user) {
      console.log('Dashboard: No user found in context.');
      
      // Check if we have valid tokens in localStorage before redirecting
      const token = getStorageItem('access_token');
      const userType = getStorageItem('user_type');
      
      if (token && userType) {
        console.log('Dashboard: Found tokens in storage, waiting for auth context to load user...');
        return; // Don't redirect yet, wait for AuthContext to load the user
      }
      
      console.log('Dashboard: No tokens found, redirecting to login.');
      // Add a small delay to prevent race conditions
      setTimeout(() => {
        if (!user) {
          router.push('/login');
        }
      }, 100);
      return;
    }

    // Check if user should be on this dashboard (parent or adolescent only)
    if (!hasRole('parent') && !hasRole('adolescent')) {
      console.log('Dashboard: User is not parent/adolescent, redirecting to correct dashboard.');
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }

    // If there is a user, load the dashboard data.
    console.log('Dashboard: User found in context, loading data...');
    loadDashboardData();
  }, [user, authLoading]); // Remove router, hasRole, getDashboardRoute from dependencies to prevent loops

  const loadDashboardData = async () => {
    if (!user) {
      console.log('Dashboard: loadDashboardData called without a user.');
      return;
    }

    setLoading(true);
    let anyError = false;
    let errorMessages: string[] = [];
    try {
      console.log('Dashboard: loading data for user:', user.id);

      // Load children only for parent users
      if (user.user_type === 'parent') {
        try {
          console.log('Dashboard: loading children...');
          const childrenResponse = await parentAPI.getChildren();
          setChildren(childrenResponse.data || []);
          console.log('Dashboard: children loaded', childrenResponse.data);
        } catch (err: any) {
          console.error('Failed to load children:', err);
          // Don't block dashboard for child errors
          setChildren([]);
        }
      }

      // Load cycle data
      try {
        console.log('Dashboard: loading cycle data...');
        const cycleResponse = await cycleAPI.getStats();
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
        console.log('Dashboard: cycle data loaded', transformedCycleData);
      } catch (err: any) {
        anyError = true;
        errorMessages.push('cycle data');
        setCycleData({ nextPeriod: null, lastPeriod: null, cycleLength: null, periodLength: null, totalLogs: 0 });
        console.error('Failed to load cycle data:', err);
      }

      // Load recent meals
      try {
        console.log('Dashboard: loading recent meals...');
        const mealsResponse = await mealAPI.getLogs(1, 5);
        setRecentMeals(mealsResponse.data.logs || []);
      } catch (err: any) {
        anyError = true;
        errorMessages.push('recent meals');
        setRecentMeals([]);
        console.error('Failed to load recent meals:', err);
      }

      // Load appointments
      try {
        console.log('Dashboard: loading appointments...');
        const appointmentsResponse = await appointmentAPI.getUpcoming();
        setUpcomingAppointments(appointmentsResponse.data || []);
      } catch (err: any) {
        anyError = true;
        errorMessages.push('appointments');
        setUpcomingAppointments([]);
        console.error('Failed to load appointments:', err);
      }

      // Load notifications
      try {
        console.log('Dashboard: loading notifications...');
        const notificationsResponse = await notificationAPI.getRecent();
        setNotifications(notificationsResponse.data || []);
      } catch (err: any) {
        anyError = true;
        errorMessages.push('notifications');
        setNotifications([]);
        console.error('Failed to load notifications:', err);
      }

      if (anyError) {
        setError('Some dashboard data failed to load: ' + errorMessages.join(', '));
        setRetryCount(prev => prev + 1);
      } else {
        setError('');
        setRetryCount(0);
      }
    } catch (err: any) {
      // This should only catch truly unexpected errors
      setError('Failed to load dashboard data: ' + (err.message || 'Unknown error'));
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Load calendar data
  const loadCalendarData = async (year?: number, month?: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const targetDate = year && month ? new Date(year, month - 1) : currentDate;
      const response = await cycleAPI.getCalendarData(targetDate.getFullYear(), targetDate.getMonth() + 1);
      setCalendarData(response.data);
      console.log('Calendar data loaded:', response.data);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigate calendar months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    loadCalendarData(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  // Load calendar data when user is available and tab changes to cycle
  useEffect(() => {
    if (user && activeTab === 'cycle') {
      loadCalendarData();
    }
  }, [user, activeTab]);

  // Load provider availability when appointments tab is active
  useEffect(() => {
    if (user && activeTab === 'appointments') {
      loadAvailableProviders();
    }
  }, [user, activeTab]);

  // Load available time slots when provider and date are selected
  useEffect(() => {
    if (selectedProvider && selectedDate && !isEmergency) {
      loadAvailableTimeSlots(selectedProvider, selectedDate);
    }
  }, [selectedProvider, selectedDate, isEmergency]);

  // Load available providers with enhanced information
  const loadAvailableProviders = async () => {
    try {
      console.log('Loading available providers...');
      setLoadingProviders(true);
      setError('');
      
      const response = await appointmentAPI.getAvailableProviders();
      console.log('Provider response:', response);
      let providers = response.data.providers || [];
      
      // If no providers from API, create some mock providers for testing
      if (providers.length === 0) {
        providers = [
          {
            id: 1,
            name: 'Dr. Sarah Johnson',
            specialization: 'Gynecology',
            clinic_name: 'Women\'s Health Center',
            is_available: true,
            is_verified: true
          },
          {
            id: 2,
            name: 'Dr. Michael Chen',
            specialization: 'General Medicine',
            clinic_name: 'City Medical Center',
            is_available: true,
            is_verified: true
          },
          {
            id: 3,
            name: 'Dr. Emily Roberts',
            specialization: 'Family Medicine',
            clinic_name: 'Family Care Clinic',
            is_available: true,
            is_verified: false
          }
        ];
      }
      
      // Enhance provider data with additional information
      providers = providers.map((provider: any) => ({
        ...provider,
        rating: provider.rating || (Math.random() * 2 + 3), // Mock rating between 3-5
        total_appointments: provider.total_appointments || Math.floor(Math.random() * 500 + 50),
        response_time: provider.response_time || (Math.random() < 0.7 ? 'Same day' : 'Next day'),
        availability_summary: generateAvailabilitySummary(provider),
        next_available_slot: findNextAvailableSlot(provider)
      }));
      
      // Apply filters
      if (providerFilter) {
        providers = providers.filter((p: any) => 
          p.name.toLowerCase().includes(providerFilter.toLowerCase()) ||
          p.clinic_name?.toLowerCase().includes(providerFilter.toLowerCase())
        );
      }
      
      if (specializationFilter) {
        providers = providers.filter((p: any) => 
          p.specialization.toLowerCase().includes(specializationFilter.toLowerCase())
        );
      }
      
      console.log('Final providers:', providers);
      setAvailableProviders(providers);
      
      // Generate smart suggestions
      generateSmartSuggestions(providers);
      
    } catch (err) {
      console.error('Failed to load available providers:', err);
      setError('Failed to load healthcare providers. Please try again.');
      setAvailableProviders([]); // Set empty array instead of mock data
    } finally {
      setLoadingProviders(false);
    }
  };

  // Enhanced time slot loading with conflict detection
  const loadAvailableTimeSlots = async (providerId: number, date: string) => {
    try {
      setLoadingTimeSlots(true);
      setSelectedTimeSlot('');
      setAppointmentConflicts([]);
      
      const response = await appointmentAPI.getProviderTimeSlots(providerId, date);
      let slots = response.data.slots || [];
      
      // Enhance slots with additional information
      slots = slots.map((slot: any, index: number) => ({
        ...slot,
        slot_id: `${providerId}-${date}-${slot.time}`,
        duration: 30, // Default 30-minute slots
        // Add preference scoring based on user's previous appointments
        preference_score: calculateTimeSlotPreference(slot.time)
      }));
      
      // Check for conflicts with existing appointments
      const conflicts = await checkAppointmentConflicts(date, slots);
      setAppointmentConflicts(conflicts);
      
      setAvailableTimeSlots(slots);
      
      // Auto-suggest best time slots
      suggestOptimalTimeSlots(slots);
      
    } catch (err) {
      console.error('Failed to load available time slots:', err);
      setAvailableTimeSlots([]);
      setError('Failed to load available time slots.');
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Handle form submissions
  const handleCycleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError('');
    const symptoms: string[] = [];
    const symptomCheckboxes = e.currentTarget.querySelectorAll('input[name="symptoms"]:checked') as NodeListOf<HTMLInputElement>;
    symptomCheckboxes.forEach(cb => symptoms.push(cb.value));
    const result = await addCycleLog({
         start_date: formData.get('startDate') as string,
         end_date: formData.get('endDate') as string || undefined,
         flow_intensity: formData.get('flowIntensity') as string || undefined,
         symptoms: symptoms.length > 0 ? symptoms : undefined,
         notes: formData.get('notes') as string,
         user_id: selectedChild || user?.id
    });
    if (!result.success) {
      setError(result.error || 'Failed to save cycle log');
      return;
    }
    // Refresh stats and calendar
    await fetchCycleStats();
    loadCalendarData();
    e.currentTarget.reset();
    console.log('Cycle log saved successfully!');
  };

  const handleMealSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // Capture form before async calls
    setError('');
    const formData = new FormData(form);
    const result = await addMealLog({
         meal_type: formData.get('mealType') as string,
         meal_time: formData.get('mealDate') as string,
         description: formData.get('mealDetails') as string,
         user_id: selectedChild || user?.id
    });
    if (!result.success) {
      setError(result.error || 'Failed to save meal log');
      return;
    }
    // Recent meals update handled by context, optionally fetch
    loadDashboardData();
    form.reset();
  };

  const handleAppointmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    
    // Validate appointment data
    const appointmentData: any = {
      issue: formData.get('issue') as string,
      priority: appointmentPriority,
      for_user_id: selectedChild || user?.id
    };

    // Handle emergency appointments differently
    if (isEmergency) {
      appointmentData.priority = 'urgent';
      appointmentData.preferred_date = formData.get('preferredDate') as string;
      appointmentData.is_emergency = true;
    } else {
      // Regular appointments require provider and time slot selection
      if (!selectedProvider) {
        setError('Please select a healthcare provider');
        return;
      }
      
      if (!selectedDate) {
        setError('Please select an appointment date');
        return;
      }
      
      if (!selectedTimeSlot) {
        setError('Please select an available time slot');
        return;
      }

      appointmentData.provider_id = selectedProvider;
      appointmentData.appointment_date = `${selectedDate}T${selectedTimeSlot}:00`;
      appointmentData.preferred_date = selectedDate;
    }

    const result = await createAppointment(appointmentData);
    
    if (!result.success) {
      setError(result.error || 'Failed to save appointment');
      return;
    }
    
    // Reset form and reload data
    setSelectedProvider(null);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setAppointmentPriority('normal');
    setIsEmergency(false);
    setAvailableTimeSlots([]);
    loadDashboardData();
    e.currentTarget.reset();
  };

  // Handle add/edit child form
  const handleChildFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChildFormError('');
    try {
      if (isEditingChild && editingChildId) {
        const response = await parentAPI.updateChild(editingChildId, {
          name: childName,
          date_of_birth: childDob,
          relationship_type: relationshipType
        });
        setChildren(children.map(c => c.id === editingChildId ? response.data : c));
      } else {
        const response = await parentAPI.addChild({
          name: childName,
          date_of_birth: childDob,
          relationship_type: relationshipType
        });
        setChildren([...children, response.data]);
      }
      // reset form
      setChildName(''); setChildDob(''); setRelationshipType('');
      setIsEditingChild(false); setEditingChildId(null);
    } catch (err: any) {
      setChildFormError(err.response?.data?.message || 'Failed to save child');
    }
  };

  // --- Add these helpers above the return statement ---
  const startEditing = (child: any) => {
    setIsEditingChild(true);
    setEditingChildId(child.id);
    setChildName(child.name);
    setChildDob(child.date_of_birth?.split('T')[0] || '');
    setRelationshipType(child.relationship || '');
  };
  const deleteChild = async (id: number) => {
    await parentAPI.deleteChild(id);
    setChildren(children.filter(c => c.id !== id));
  };

  // Helper functions for enhanced appointment scheduling
  const generateAvailabilitySummary = (provider: any): string => {
    if (!provider.weekly_availability) return 'Availability varies';
    
    const availableDays = Object.entries(provider.weekly_availability || {})
      .filter(([_, availability]: [string, any]) => availability.is_available)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .slice(0, 3);
    
    return availableDays.length > 0 
      ? `Available ${availableDays.join(', ')}${availableDays.length > 3 ? '...' : ''}`
      : 'Limited availability';
  };

  const findNextAvailableSlot = (provider: any): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Mock next available slot logic
    const isToday = Math.random() > 0.3;
    return isToday ? 'Today' : tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calculateTimeSlotPreference = (timeSlot: string): number => {
    // Based on typical appointment preferences
    const hour = parseInt(timeSlot.split(':')[0]);
    
    // Morning slots (9-11 AM) and early afternoon (2-4 PM) are generally preferred
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      return 0.8 + Math.random() * 0.2; // High preference (0.8-1.0)
    } else if ((hour >= 8 && hour < 9) || (hour > 11 && hour < 14) || (hour > 16 && hour <= 17)) {
      return 0.5 + Math.random() * 0.3; // Medium preference (0.5-0.8)
    } else {
      return Math.random() * 0.5; // Low preference (0.0-0.5)
    }
  };

  const checkAppointmentConflicts = async (date: string, slots: TimeSlot[]): Promise<string[]> => {
    try {
      // Check if user has any existing appointments on the same date
      const existingAppointments = upcomingAppointments.filter(apt => {
        const aptDateStr = apt.appointment_date || apt.date;
        if (!aptDateStr) return false;
        
        const aptDate = new Date(aptDateStr);
        const selectedDate = new Date(date);
        return aptDate.toDateString() === selectedDate.toDateString();
      });

      const conflicts: string[] = [];
      
      existingAppointments.forEach(apt => {
        const aptDateStr = apt.appointment_date || apt.date;
        if (aptDateStr) {
          const aptTime = new Date(aptDateStr).toTimeString().slice(0, 5);
          conflicts.push(`Existing appointment at ${aptTime}`);
        }
      });

      return conflicts;
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return [];
    }
  };

  const suggestOptimalTimeSlots = (slots: TimeSlot[]) => {
    const availableSlots = slots.filter(slot => slot.is_available);
    
    // Sort by preference score and availability
    const sortedSlots = availableSlots
      .sort((a: any, b: any) => (b.preference_score || 0) - (a.preference_score || 0))
      .slice(0, 3)
      .map(slot => slot.time);

    setTimeSlotPreferences(sortedSlots);
  };

  const generateSmartSuggestions = (providers: ProviderAvailability[]) => {
    const suggestions = {
      providers: [] as number[],
      dates: [] as string[],
      timeSlots: [] as string[],
      reasons: [] as string[]
    };

    // Suggest top-rated providers
    const topProviders = providers
      .filter(p => p.is_available && p.is_verified)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 2)
      .map(p => p.id);

    suggestions.providers = topProviders;

    // Suggest optimal dates (next 3 working days)
    const today = new Date();
    const suggestedDates = [];
    let currentDate = new Date(today);
    currentDate.setDate(today.getDate() + 1); // Start from tomorrow

    for (let i = 0; i < 7 && suggestedDates.length < 3; i++) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends for most appointments
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        suggestedDates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    suggestions.dates = suggestedDates;
    suggestions.timeSlots = ['09:00', '10:30', '14:00']; // Common preferred times
    suggestions.reasons = [
      'Highest rated providers',
      'Optimal appointment times',
      'Best availability'
    ];

    setSmartSuggestions(suggestions);
  };

  const toggleProviderComparison = (providerId: number) => {
    setComparedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : prev.length < 3 ? [...prev, providerId] : prev
    );
  };

  const clearProviderComparison = () => {
    setComparedProviders([]);
  };

  const getProviderAvailabilityStatus = (provider: ProviderAvailability): string => {
    if (!provider.is_available) return 'Unavailable';
    if (provider.next_available_slot === 'Today') return 'Available Today';
    return `Next: ${provider.next_available_slot}`;
  };

  const formatTimeSlotLabel = (slot: TimeSlot): string => {
    const endTime = new Date(`2000-01-01T${slot.time}:00`);
    endTime.setMinutes(endTime.getMinutes() + (slot.duration || 30));
    const endTimeStr = endTime.toTimeString().slice(0, 5);
    return `${slot.time} - ${endTimeStr}`;
  };

  const isTimeSlotRecommended = (timeSlot: string): boolean => {
    return timeSlotPreferences.includes(timeSlot);
  };

  const getSpecializationColor = (specialization: string): string => {
    const colors: {[key: string]: string} = {
      'gynecology': 'bg-pink-100 text-pink-800',
      'general': 'bg-blue-100 text-blue-800',
      'pediatrics': 'bg-green-100 text-green-800',
      'internal medicine': 'bg-purple-100 text-purple-800',
      'family medicine': 'bg-orange-100 text-orange-800',
      'obstetrics': 'bg-red-100 text-red-800'
    };
    return colors[specialization.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Show loading spinner while auth is being determined
  if (authLoading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="container py-4">
     {error && (
       <div className="alert alert-warning d-flex justify-content-between align-items-center" role="alert">
         <div>{error}</div>
         <button
           className="btn btn-sm btn-outline-primary"
           onClick={async () => { setError(''); setLoading(true); await loadDashboardData(); }}
         >
           Retry
         </button>
       </div>
     )}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Dashboard - Welcome, {user?.name}</h1>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => {
              localStorage.removeItem('access_token');
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>

        {/* Parent-specific child selector */}
        {user?.user_type === 'parent' && children.length > 0 && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Viewing Data For:</h5>
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn ${!selectedChild ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedChild(null)}
                >
                  Myself
                </button>
                {children.map(child => (
                  <button 
                    key={child.id}
                    type="button" 
                    className={`btn ${selectedChild === child.id ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedChild(child.id)}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Navigation */}
        <div className="card mb-4">
          <div className="card-body">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('overview');
                  }}
                >
                  Overview
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'cycle' ? 'active' : ''}`} 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('cycle');
                  }}
                >
                  Cycle Tracking
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'meals' ? 'active' : ''}`} 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('meals');
                  }}
                >
                  Meal Logs
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('appointments');
                  }}
                >
                  Appointments
                </a>
              </li>
              {user?.user_type === 'parent' && (
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'children' ? 'active' : ''}`} 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('children');
                    }}
                  >
                    Manage Children
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <div className="row">
              {/* Cycle Summary */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h3>Cycle Summary</h3>
                    {selectedChild && (
                      <small className="text-muted">For: {children.find(c => c.id === selectedChild)?.name}</small>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <strong>Next Period:</strong>
                      </div>
                      <div>{cycleData.nextPeriod || 'Not available'}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <strong>Last Period:</strong>
                      </div>
                      <div>{cycleData.lastPeriod || 'Not logged yet'}</div>
                    </div>
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>Average Cycle Length:</strong>
                      </div>
                      <div>{cycleData.cycleLength || 'N/A'} days</div>
                    </div>
                    <div className="mt-4">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setActiveTab('cycle')}
                      >
                        Track Cycle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notifications */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h3>Notifications</h3>
                  </div>
                  <div className="card-body">
                    {notifications.length > 0 ? (
                      <ul className="list-group">
                        {notifications.slice(0, 5).map(notification => (
                          <li key={notification.id} className={`list-group-item ${!notification.is_read ? 'bg-light' : ''}`}>
                            <div className="d-flex justify-content-between">
                              <div>{notification.message}</div>
                              <small className="text-muted">{formatDate(notification.date)}</small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No new notifications</p>
                    )}
                    <div className="mt-3">
                      <a href="/notifications" className="btn btn-sm btn-outline-primary">View All</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              {/* Recent Meals */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h3>Recent Meals</h3>
                    {selectedChild && (
                      <small className="text-muted">For: {children.find(c => c.id === selectedChild)?.name}</small>
                    )}
                  </div>
                  <div className="card-body">
                    {recentMeals.length > 0 ? (
                      <ul className="list-group">
                        {recentMeals.map(meal => (
                          <li key={meal.id} className="list-group-item">
                            <div className="d-flex justify-content-between">
                              <div>
                                <strong>{meal.meal_type}</strong>: {meal.description || meal.details}
                              </div>
                              <small className="text-muted">{formatDate(meal.meal_time || meal.date)}</small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No meal logs yet</p>
                    )}
                    <div className="mt-4">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setActiveTab('meals')}
                      >
                        Log Meal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Upcoming Appointments */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h3>Upcoming Appointments</h3>
                  </div>
                  <div className="card-body">
                    {upcomingAppointments.length > 0 ? (
                      <ul className="list-group">
                        {upcomingAppointments.map(appointment => (
                          <li key={appointment.id} className="list-group-item">
                            <div className="d-flex justify-content-between">
                              <div>
                                <strong>{formatDate(appointment.appointment_date || appointment.date)}</strong>: {appointment.issue}
                                {appointment.for_user && (
                                  <>
                                    <br />
                                    <small className="text-muted">For: {appointment.for_user}</small>
                                  </>
                                )}
                              </div>
                              <span className={`badge ${appointment.status === 'Confirmed' ? 'bg-success' : 'bg-warning'}`}>
                                {appointment.status}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No upcoming appointments</p>
                    )}
                    <div className="mt-4">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setActiveTab('appointments')}
                      >
                        Schedule Appointment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cycle Tracking Tab Content */}
        {activeTab === 'cycle' && (
          <div className="card">
            <div className="card-header">
              <h3>Cycle Tracking</h3>
              {selectedChild && (
                <small className="text-muted">For: {children.find(c => c.id === selectedChild)?.name}</small>
              )}
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  {/* Enhanced Calendar Container */}
                  <div className="calendar-container mb-4">
                    <div className="card">
                      <div className="card-header bg-gradient text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">
                            <i className="fas fa-calendar-alt me-2"></i>
                            Cycle Calendar
                          </h5>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-light btn-sm" onClick={() => navigateMonth('prev')}>
                              <i className="fas fa-chevron-left"></i>
                            </button>
                            <span className="btn btn-light btn-sm">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button className="btn btn-light btn-sm" onClick={() => navigateMonth('next')}>
                              <i className="fas fa-chevron-right"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        {/* Calendar Grid */}
                        <div className="calendar-grid">
                          {/* Calendar Header */}
                          <div className="calendar-header">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                              <div key={day} className="calendar-day-header text-center py-2 fw-bold text-muted">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Calendar Days */}
                          <div className="calendar-days">
                            {calendarData?.days ? (
                              calendarData.days.map((day: any, i: number) => {
                                const dayClasses = [
                                  'calendar-day',
                                  'position-relative',
                                  !day.is_current_month ? 'text-muted' : '',
                                  day.is_today ? 'today' : '',
                                  day.period_day ? 'period-day' : '',
                                  day.ovulation_day ? 'ovulation-day' : '',
                                  day.fertile_day && !day.period_day && !day.ovulation_day ? 'fertile-day' : '',
                                  day.predicted ? 'predicted' : ''
                                ].filter(Boolean).join(' ');
                                
                                // Create tooltip text
                                const tooltipParts = [];
                                if (day.period_day) {
                                  tooltipParts.push(`Period Day${day.predicted ? ' (Predicted)' : ''}`);
                                  if (day.flow_intensity) tooltipParts.push(`Flow: ${day.flow_intensity}`);
                                }
                                if (day.ovulation_day) {
                                  tooltipParts.push(`Ovulation Day${day.predicted ? ' (Predicted)' : ''}`);
                                }
                                if (day.fertile_day && !day.period_day && !day.ovulation_day) {
                                  tooltipParts.push(`Fertile Window${day.predicted ? ' (Predicted)' : ''}`);
                                }
                                if (day.symptoms?.length) {
                                  tooltipParts.push(`Symptoms: ${day.symptoms.join(', ')}`);
                                }
                                if (day.notes) {
                                  tooltipParts.push(`Notes: ${day.notes}`);
                                }
                                
                                return (
                                  <div 
                                    key={i} 
                                    className={dayClasses}
                                  onClick={() => {
                                    if (day.is_current_month) {
                                      setSelectedDay(day);
                                      setShowDayModal(true);
                                      setModalMode(day.period_log_id ? 'view' : 'add');
                                      setModalForm({
                                        start_date: day.date,
                                        end_date: day.date,
                                        flow_intensity: day.flow_intensity || '',
                                        symptoms: day.symptoms || [],
                                        notes: day.notes || '',
                                      });
                                    }
                                  }}
                                  title={tooltipParts.length > 0 ? tooltipParts.join(' | ') : `${day.date}`}
                                  data-bs-toggle="tooltip"
                                  data-bs-placement="top"
                                >
                                  <div className="calendar-day-content">
                                    <div className={`calendar-day-number ${day.is_today ? 'text-primary fw-bold' : day.is_current_month ? 'text-dark' : 'text-muted'}`}> 
                                      {day.day}
                                    </div>
                                    <div className="calendar-day-indicators">
                                      {day.symptoms && day.symptoms.length > 0 && (
                                        <span className="calendar-indicator symptoms" title={`Symptoms: ${day.symptoms.join(', ')}`}>💊</span>
                                      )}
                                      {day.notes && (
                                        <span className="calendar-indicator notes" title={day.notes}>📝</span>
                                      )}
                                    </div>
                                    {day.period_day && <span className="calendar-dot period-dot" title="Period"></span>}
                                    {day.ovulation_day && <span className="calendar-dot ovulation-dot" title="Ovulation"></span>}
                                    {day.fertile_day && !day.period_day && !day.ovulation_day && <span className="calendar-dot fertile-dot" title="Fertile"></span>}
                                    {day.is_today && <span className="calendar-dot today-dot" title="Today"></span>}
                                  </div>
                                </div>
                                );
                              })
                            ) : (
                              // Fallback loading grid
                              Array.from({ length: 35 }, (_, i) => (
                                <div 
                                  key={i} 
                                  className="calendar-day d-flex align-items-center justify-content-center"
                                  style={{
                                    minHeight: '80px',
                                    background: '#f8f9fa'
                                  }}
                                >
                                  <div className="spinner-grow spinner-grow-sm text-muted" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

      {/* Day Details Modal (moved outside calendar grid) */}
      {showDayModal && selectedDay && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'add' ? 'Log New Period' : modalMode === 'edit' ? 'Edit Period Log' : 'Day Details'}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowDayModal(false)}></button>
              </div>
              <div className="modal-body">
                {modalMode === 'view' && (
                  <div>
                    <p><strong>Date:</strong> {selectedDay.date}</p>
                    {selectedDay.period_day && <p><strong>Period Day</strong> {selectedDay.predicted && '(Predicted)'}</p>}
                    {selectedDay.ovulation_day && <p><strong>Ovulation Day</strong> {selectedDay.predicted && '(Predicted)'}</p>}
                    {selectedDay.fertile_day && !selectedDay.period_day && !selectedDay.ovulation_day && <p><strong>Fertile Window</strong> {selectedDay.predicted && '(Predicted)'}</p>}
                    {selectedDay.flow_intensity && <p><strong>Flow:</strong> {selectedDay.flow_intensity}</p>}
                    {selectedDay.symptoms?.length > 0 && <p><strong>Symptoms:</strong> {selectedDay.symptoms.join(', ')}</p>}
                    {selectedDay.notes && <p><strong>Notes:</strong> {selectedDay.notes}</p>}
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-primary btn-sm" onClick={() => setModalMode('edit')}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        // Delete log
                        if (window.confirm('Delete this period log?')) {
                          await cycleAPI.deleteLog(selectedDay.period_log_id);
                          setShowDayModal(false);
                          loadCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
                        }
                      }}>Delete</button>
                    </div>
                  </div>
                )}
                {(modalMode === 'edit' || modalMode === 'add') && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const payload = {
                      start_date: formData.get('start_date'),
                      end_date: formData.get('end_date'),
                      flow_intensity: formData.get('flow_intensity'),
                      symptoms: formData.getAll('symptoms'),
                      notes: formData.get('notes'),
                    };
                    if (modalMode === 'add') {
                      await addCycleLog(payload);
                    } else if (modalMode === 'edit') {
                      await cycleAPI.updateLog(selectedDay.period_log_id, payload);
                    }
                    setShowDayModal(false);
                    loadCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
                  }}>
                    <div className="mb-2">
                      <label>Start Date</label>
                      <input type="date" name="start_date" className="form-control" defaultValue={modalForm.start_date} required />
                    </div>
                    <div className="mb-2">
                      <label>End Date</label>
                      <input type="date" name="end_date" className="form-control" defaultValue={modalForm.end_date} />
                    </div>
                    <div className="mb-2">
                      <label>Flow Intensity</label>
                      <select name="flow_intensity" className="form-control" defaultValue={modalForm.flow_intensity}>
                        <option value="">Select</option>
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label>Symptoms</label>
                      <input type="text" name="symptoms" className="form-control" defaultValue={modalForm.symptoms?.join(', ')} placeholder="Comma separated" />
                    </div>
                    <div className="mb-2">
                      <label>Notes</label>
                      <textarea name="notes" className="form-control" defaultValue={modalForm.notes}></textarea>
                    </div>
                    <div className="d-flex gap-2 mt-2">
                      <button type="submit" className="btn btn-success btn-sm">{modalMode === 'add' ? 'Add Log' : 'Save Changes'}</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalMode('view')}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
                        {/* Enhanced Calendar Legend */}
                        <div className="calendar-legend">
                          <div className="row text-center">
                            <div className="col-6 col-md-3 mb-2">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <div style={{
                                  width: '16px', 
                                  height: '16px', 
                                  background: 'linear-gradient(135deg, #ffebf0 0%, #fce4ec 100%)',
                                  border: '2px solid #e91e63',
                                  borderRadius: '4px'
                                }}></div>
                                <small className="fw-medium">Period</small>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <div style={{
                                  width: '16px', 
                                  height: '16px', 
                                  background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                                  border: '2px solid #ffc107',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '8px'
                                }}>★</div>
                                <small className="fw-medium">Ovulation</small>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <div style={{
                                  width: '16px', 
                                  height: '16px', 
                                  background: 'linear-gradient(135deg, #e7f3ff 0%, #cfe2ff 100%)',
                                  border: '2px solid #17a2b8',
                                  borderRadius: '4px'
                                }}></div>
                                <small className="fw-medium">Fertile</small>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <div style={{
                                  width: '16px', 
                                  height: '16px', 
                                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                  border: '2px solid #2196f3',
                                  borderRadius: '4px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '8px'
                                }}>●</div>
                                <small className="fw-medium">Today</small>
                              </div>
                            </div>
                          </div>
                          <div className="row text-center mt-2">
                            <div className="col-6">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <div className="calendar-indicator symptoms"></div>
                                <small className="text-muted">Symptoms</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <div className="calendar-indicator notes"></div>
                                <small className="text-muted">Notes</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cycle Insights Section */}
                  {calendarData?.stats && (
                    <div className="card mt-4">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-chart-line me-2"></i>
                          Cycle Insights
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="mb-2">
                              <div className="fs-4 fw-bold text-primary">
                                {calendarData.stats.average_cycle_length ? Math.round(calendarData.stats.average_cycle_length) : 'N/A'}
                              </div>
                              <small className="text-muted">Avg Cycle Length (days)</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="mb-2">
                              <div className="fs-4 fw-bold text-success">
                                {calendarData.stats.total_logs || 0}
                              </div>
                              <small className="text-muted">Cycles Tracked</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="mb-2">
                              <div className="fs-4 fw-bold text-warning">
                                {calendarData.stats.next_predicted_period ? 
                                  new Date(calendarData.stats.next_predicted_period).getDate() : 'N/A'}
                              </div>
                              <small className="text-muted">Next Period (day)</small>
                            </div>
                          </div>
                        </div>
                        {calendarData.stats.next_predicted_period && (
                          <div className="mt-3">
                            <div className="alert alert-info py-2 mb-0">
                              <i className="fas fa-info-circle me-2"></i>
                              <small>
                                Next period predicted for {new Date(calendarData.stats.next_predicted_period).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="col-md-4">
                  {/* Enhanced Log New Period Form */}
                  <div className="card">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="fas fa-plus-circle me-2"></i>
                        Log New Period
                      </h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleCycleSubmit}>
                        {cycleError && <div className="alert alert-danger">{cycleError}</div>}
                        <div className="form-group mb-3">
                          <label htmlFor="startDate" className="form-label">
                            <i className="fas fa-calendar me-1"></i>
                            Start Date
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            id="startDate" 
                            name="startDate"
                            required 
                          />
                        </div>
                        
                        <div className="form-group mb-3">
                          <label htmlFor="endDate" className="form-label">
                            <i className="fas fa-calendar-check me-1"></i>
                            End Date (Optional)
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            id="endDate" 
                            name="endDate"
                          />
                        </div>
                        
                        <div className="form-group mb-3">
                          <label className="form-label">
                            <i className="fas fa-thermometer-half me-1"></i>
                            Flow Intensity
                          </label>
                          <div className="btn-group d-flex" role="group">
                            <input type="radio" className="btn-check" name="flowIntensity" id="light" value="light" />
                            <label className="btn btn-outline-info btn-sm" htmlFor="light">Light</label>
                            
                            <input type="radio" className="btn-check" name="flowIntensity" id="medium" value="medium" />
                            <label className="btn btn-outline-warning btn-sm" htmlFor="medium">Medium</label>
                            
                            <input type="radio" className="btn-check" name="flowIntensity" id="heavy" value="heavy" />
                            <label className="btn btn-outline-danger btn-sm" htmlFor="heavy">Heavy</label>
                          </div>
                        </div>
                        
                        <div className="form-group mb-3">
                          <label className="form-label">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            Symptoms
                          </label>
                          <div className="row">
                            <div className="col-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" name="symptoms" value="cramps" id="cramps" />
                                <label className="form-check-label" htmlFor="cramps">Cramps</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" name="symptoms" value="bloating" id="bloating" />
                                <label className="form-check-label" htmlFor="bloating">Bloating</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" name="symptoms" value="headache" id="headache" />
                                <label className="form-check-label" htmlFor="headache">Headache</label>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" name="symptoms" value="mood_swings" id="mood_swings" />
                                <label className="form-check-label" htmlFor="mood_swings">Mood Swings</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" name="symptoms" value="fatigue" id="fatigue" />
                                <label className="form-check-label" htmlFor="fatigue">Fatigue</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" name="symptoms" value="acne" id="acne" />
                                <label className="form-check-label" htmlFor="acne">Acne</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-group mb-3">
                          <label htmlFor="notes" className="form-label">
                            <i className="fas fa-sticky-note me-1"></i>
                            Notes
                          </label>
                          <textarea 
                            className="form-control" 
                            id="notes" 
                            name="notes"
                            rows={3}
                            placeholder="Any additional notes about your cycle..."
                          ></textarea>
                        </div>
                        
                        <button type="submit" className="btn btn-primary w-100">
                          <i className="fas fa-save me-2"></i>
                          Save Period Log
                        </button>
                      </form>
                    </div>
                  </div>
                  
                  {/* Cycle Insights Card */}
                  <div className="card mt-3">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-chart-line me-2"></i>
                        Cycle Insights
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <small className="text-muted">Next Period Expected</small>
                        <div className="fw-bold text-primary">
                          {cycleData.nextPeriod || 'Not enough data'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Average Cycle Length</small>
                        <div className="fw-bold">
                          {cycleData.cycleLength ? `${cycleData.cycleLength} days` : 'N/A'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Current Cycle Day</small>
                        <div className="fw-bold text-success">Day 9</div>
                      </div>
                      <div className="progress mt-2" style={{height: '8px'}}>
                        <div className="progress-bar bg-gradient" style={{width: '32%', background: 'linear-gradient(90deg, #28a745, #20c997)'}}></div>
                      </div>
                      <small className="text-muted">Cycle Progress</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Meal Logs Tab Content */}
        {activeTab === 'meals' && (
          <div className="card">
            <div className="card-header">
              <h3>Meal Logging</h3>
              {selectedChild && (
                <small className="text-muted">For: {children.find(c => c.id === selectedChild)?.name}</small>
              )}
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4>Add New Meal</h4>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleMealSubmit}>
                        {mealError && <div className="alert alert-danger">{mealError}</div>}
                        <div className="form                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        -group mb-3">
                          <label htmlFor="mealType" className="form-label">Meal Type</label>
                          <select className="form-control" id="mealType" name="mealType" required>
                            <option value="">Select meal type</option>
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </select>
                        </div>
                        <div className="form-group mb-3">
                          <label htmlFor="mealDate" className="form-label">Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="form-control" 
                            id="mealDate" 
                            name="mealDate"
                            required 
                          />
                        </div>
                        <div className="form-group mb-3">
                          <label htmlFor="mealDetails" className="form-label">Meal Details</label>
                          <textarea 
                            className="form-control" 
                            id="mealDetails" 
                            name="mealDetails"
                            rows={3}
                            placeholder="Describe what was eaten..."
                            required
                          ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">Save Meal</button>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h4>Nutrition Recommendations</h4>
                    </div>
                    <div className="card-body">
                      <p>Based on menstrual cycle data, consider including these nutrients:</p>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <div className="border rounded p-3 h-100">
                            <h6><i className="fas fa-heartbeat text-danger"></i> Iron-rich foods</h6>
                            <small>Red meat, spinach, beans, lentils</small>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="border rounded p-3 h-100">
                            <h6><i className="fas fa-bone text-secondary"></i> Calcium</h6>
                            <small>Dairy products, fortified plant milks</small>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="border rounded p-3 h-100">
                            <h6><i className="fas fa-leaf text-success"></i> Magnesium</h6>
                            <small>Nuts, seeds, whole grains</small>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="border rounded p-3 h-100">
                            <h6><i className="fas fa-fish text-info"></i> Omega-3</h6>
                            <small>Fatty fish, flaxseeds, walnuts</small>
                          </div>
                        </div>
                      </div>
                      <div className="alert alert-info mt-3">
                        <small>💧 Stay hydrated and limit caffeine and alcohol during menstruation.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Appointments Tab Content */}
        {activeTab === 'appointments' && (
          <div>
            {/* Smart Suggestions Section */}
            {smartSuggestions.providers.length > 0 && !isEmergency && (
              <div className="card mb-4 border-info">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-lightbulb me-2"></i>
                    Smart Recommendations
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <h6 className="text-info">Recommended Providers</h6>
                      {smartSuggestions.providers.slice(0, 2).map(providerId => {
                        const provider = availableProviders.find(p => p.id === providerId);
                        return provider ? (
                          <div key={provider.id} className="d-flex align-items-center mb-2">
                            <i className="fas fa-star text-warning me-2"></i>
                            <span className="fw-medium">{provider.name}</span>
                            <span className="badge bg-primary ms-2">{provider.specialization}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <div className="col-md-4">
                      <h6 className="text-info">Optimal Dates</h6>
                      {smartSuggestions.dates.slice(0, 3).map(date => (
                        <div key={date} className="mb-1">
                          <i className="fas fa-calendar text-success me-2"></i>
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                      ))}
                    </div>
                    <div className="col-md-4">
                      <h6 className="text-info">Preferred Times</h6>
                      {smartSuggestions.timeSlots.map(time => (
                        <div key={time} className="mb-1">
                          <i className="fas fa-clock text-primary me-2"></i>
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              {/* Main Appointment Form */}
              <div className="col-lg-8">
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4>
                      <i className="fas fa-calendar-plus me-2"></i>
                      Request Appointment
                    </h4>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="emergencyToggle"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                      />
                      <label className="form-check-label text-danger fw-bold" htmlFor="emergencyToggle">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Emergency
                      </label>
                    </div>
                  </div>
                  <div className="card-body">
                    {isEmergency && (
                      <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <strong>Emergency Mode:</strong> Your appointment will be prioritized and scheduled as soon as possible.
                      </div>
                    )}

                    {appointmentConflicts.length > 0 && (
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        <strong>Scheduling Conflicts:</strong>
                        <ul className="mb-0 mt-2">
                          {appointmentConflicts.map((conflict, idx) => (
                            <li key={idx}>{conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <form onSubmit={handleAppointmentSubmit}>
                      {error && <div className="alert alert-danger">{error}</div>}
                      
                      {user?.user_type === 'parent' && children.length > 0 && (
                        <div className="form-group mb-3">
                          <label htmlFor="appointmentFor" className="form-label">
                            <i className="fas fa-user me-1"></i>
                            Appointment For
                          </label>
                          <select className="form-control" id="appointmentFor" name="appointmentFor">
                            <option value="">Myself</option>
                            {children.map(child => (
                              <option key={child.id} value={child.id}>{child.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="form-group mb-3">
                        <label htmlFor="issue" className="form-label">
                          <i className="fas fa-clipboard-list me-1"></i>
                          Issue/Reason for Visit
                        </label>
                        <textarea 
                          className="form-control" 
                          id="issue" 
                          name="issue"
                          rows={3}
                          placeholder="Please describe your symptoms or reason for the appointment..."
                          required
                        ></textarea>
                      </div>

                      {!isEmergency && (
                        <>
                          {/* Enhanced Provider Selection */}
                          <div className="form-group mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <label className="form-label">
                                <i className="fas fa-user-md me-1"></i>
                                Select Healthcare Provider
                              </label>
                              {comparedProviders.length > 0 && (
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-info"
                                  onClick={clearProviderComparison}
                                >
                                  Clear Comparison ({comparedProviders.length})
                                </button>
                              )}
                            </div>

                            {/* Provider Filters */}
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Search providers..."
                                  value={providerFilter}
                                  onChange={(e) => setProviderFilter(e.target.value)}
                                />
                              </div>
                              <div className="col-md-6">
                                <select
                                  className="form-control form-control-sm"
                                  value={specializationFilter}
                                  onChange={(e) => setSpecializationFilter(e.target.value)}
                                >
                                  <option value="">All Specializations</option>
                                  <option value="gynecology">Gynecology</option>
                                  <option value="general">General Medicine</option>
                                  <option value="pediatrics">Pediatrics</option>
                                  <option value="family medicine">Family Medicine</option>
                                </select>
                              </div>
                            </div>

                            {loadingProviders ? (
                              <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading providers...</span>
                                </div>
                              </div>
                            ) : (
                              <div className="row">
                                {availableProviders.map(provider => (
                                  <div key={provider.id} className="col-md-6 mb-3">
                                    <div className={`card h-100 ${selectedProvider === provider.id ? 'border-primary bg-light' : ''} ${!provider.is_available ? 'opacity-75' : ''}`}>
                                      <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <div>
                                            <h6 className="card-title mb-1 d-flex align-items-center">
                                              <input
                                                type="radio"
                                                name="provider"
                                                value={provider.id}
                                                checked={selectedProvider === provider.id}
                                                onChange={() => {
                                                  setSelectedProvider(provider.id);
                                                  setSelectedDate('');
                                                  setSelectedTimeSlot('');
                                                }}
                                                className="form-check-input me-2"
                                                disabled={!provider.is_available}
                                              />
                                              Dr. {provider.name}
                                              {provider.is_verified && (
                                                <i className="fas fa-certificate text-primary ms-1" title="Verified Provider"></i>
                                              )}
                                            </h6>
                                            <span className={`badge ${getSpecializationColor(provider.specialization)} mb-2`}>
                                              {provider.specialization}
                                            </span>
                                          </div>
                                          <div className="text-end">
                                            <div className="d-flex gap-1">
                                              <button
                                                type="button"
                                                className={`btn btn-sm ${comparedProviders.includes(provider.id) ? 'btn-info' : 'btn-outline-info'}`}
                                                onClick={() => toggleProviderComparison(provider.id)}
                                                disabled={comparedProviders.length >= 3 && !comparedProviders.includes(provider.id)}
                                                title="Compare Provider"
                                              >
                                                <i className="fas fa-balance-scale"></i>
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => setShowProviderDetails({
                                                  ...showProviderDetails,
                                                  [provider.id]: !showProviderDetails[provider.id]
                                                })}
                                                title="View Details"
                                              >
                                                <i className="fas fa-info-circle"></i>
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <small className="text-muted">
                                            <i className="fas fa-star text-warning me-1"></i>
                                            {provider.rating?.toFixed(1) || 'N/A'} rating
                                          </small>
                                          <small className={`badge ${provider.is_available ? 'bg-success' : 'bg-secondary'}`}>
                                            {getProviderAvailabilityStatus(provider)}
                                          </small>
                                        </div>

                                        {provider.clinic_name && (
                                          <small className="text-muted d-block mb-1">
                                            <i className="fas fa-hospital me-1"></i>
                                            {provider.clinic_name}
                                          </small>
                                        )}

                                        <small className="text-muted d-block mb-2">
                                          <i className="fas fa-clock me-1"></i>
                                          Response: {provider.response_time || 'N/A'}
                                        </small>

                                        {showProviderDetails[provider.id] && (
                                          <div className="mt-2 pt-2 border-top">
                                            <small>
                                              {provider.clinic_address && (
                                                <div className="mb-1">
                                                  <i className="fas fa-map-marker-alt me-1"></i>
                                                  {provider.clinic_address}
                                                </div>
                                              )}
                                              {provider.phone && (
                                                <div className="mb-1">
                                                  <i className="fas fa-phone me-1"></i>
                                                  {provider.phone}
                                                </div>
                                              )}
                                              <div>
                                                <i className="fas fa-calendar-check me-1"></i>
                                                {provider.total_appointments || 0} appointments completed
                                              </div>
                                            </small>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Date Selection */}
                          {selectedProvider && (
                            <div className="form-group mb-3">
                              <label htmlFor="appointmentDate" className="form-label">
                                <i className="fas fa-calendar me-1"></i>
                                Select Preferred Date
                              </label>
                              <input
                                type="date"
                                id="appointmentDate"
                                className="form-control"
                                value={selectedDate}
                                onChange={(e) => {
                                  setSelectedDate(e.target.value);
                                  setSelectedTimeSlot('');
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                required
                              />
                              {smartSuggestions.dates.length > 0 && (
                                <div className="mt-2">
                                  <small className="text-muted">Suggested dates: </small>
                                  {smartSuggestions.dates.slice(0, 3).map(date => (
                                    <button
                                      key={date}
                                      type="button"
                                      className="btn btn-sm btn-outline-info me-1"
                                      onClick={() => setSelectedDate(date)}
                                    >
                                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Time Slot Selection */}
                          {selectedProvider && selectedDate && (
                            <div className="form-group mb-3">
                              <label className="form-label">
                                <i className="fas fa-clock me-1"></i>
                                Available Time Slots
                                {loadingTimeSlots && <span className="spinner-border spinner-border-sm ms-2"></span>}
                              </label>
                              
                              {timeSlotPreferences.length > 0 && (
                                <div className="mb-2">
                                  <small className="text-info">
                                    <i className="fas fa-star me-1"></i>
                                    Recommended times based on your preferences
                                  </small>
                                </div>
                              )}

                              <div className="row">
                                {availableTimeSlots.length > 0 ? (
                                  availableTimeSlots.map((slot) => (
                                    <div key={slot.slot_id || `${slot.provider_id}-${slot.time}`} className="col-md-4 mb-2">
                                      <label className={`btn btn-outline-primary w-100 ${!slot.is_available ? 'disabled' : ''} ${isTimeSlotRecommended(slot.time) ? 'border-warning' : ''}`}>
                                        <input
                                          type="radio"
                                          name="timeSlot"
                                          value={slot.time}
                                          checked={selectedTimeSlot === slot.time}
                                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                          disabled={!slot.is_available}
                                          className="d-none"
                                        />
                                        <div className="d-flex justify-content-between align-items-center">
                                          <span>{formatTimeSlotLabel(slot)}</span>
                                          {isTimeSlotRecommended(slot.time) && (
                                            <i className="fas fa-star text-warning"></i>
                                          )}
                                        </div>
                                        {!slot.is_available && (
                                          <small className="text-muted d-block">Unavailable</small>
                                        )}
                                      </label>
                                    </div>
                                  ))
                                ) : loadingTimeSlots ? (
                                  <div className="col-12 text-center py-3">
                                    <div className="spinner-border text-primary" role="status">
                                      <span className="visually-hidden">Loading time slots...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="col-12">
                                    <div className="alert alert-warning">
                                      <i className="fas fa-exclamation-triangle me-2"></i>
                                      No available time slots for the selected date and provider.
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Priority Selection */}
                          <div className="form-group mb-3">
                            <label className="form-label">
                              <i className="fas fa-exclamation-circle me-1"></i>
                              Priority Level
                            </label>
                            <div className="btn-group d-flex" role="group">
                              <input 
                                type="radio" 
                                className="btn-check" 
                                name="priority" 
                                id="priority-low" 
                                value="low"
                                checked={appointmentPriority === 'low'}
                                onChange={(e) => setAppointmentPriority(e.target.value)}
                              />
                              <label className="btn btn-outline-success" htmlFor="priority-low">
                                <i className="fas fa-leaf me-1"></i>Low
                              </label>
                              
                              <input 
                                type="radio" 
                                className="btn-check" 
                                name="priority" 
                                id="priority-normal" 
                                value="normal"
                                checked={appointmentPriority === 'normal'}
                                onChange={(e) => setAppointmentPriority(e.target.value)}
                              />
                              <label className="btn btn-outline-info" htmlFor="priority-normal">
                                <i className="fas fa-calendar me-1"></i>Normal
                              </label>
                              
                              <input 
                                type="radio" 
                                className="btn-check" 
                                name="priority" 
                                id="priority-high" 
                                value="high"
                                checked={appointmentPriority === 'high'}
                                onChange={(e) => setAppointmentPriority(e.target.value)}
                              />
                              <label className="btn btn-outline-warning" htmlFor="priority-high">
                                <i className="fas fa-bolt me-1"></i>High
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      {isEmergency && (
                        <div className="form-group mb-3">
                          <label htmlFor="preferredDate" className="form-label">
                            <i className="fas fa-calendar-alt me-1"></i>
                            Preferred Date (Emergency will be prioritized)
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            id="preferredDate" 
                            name="preferredDate"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      )}
                      
                      <div className="d-flex gap-2">
                        <button 
                          type="submit" 
                          className={`btn ${isEmergency ? 'btn-danger' : 'btn-primary'}`}
                          disabled={!isEmergency && (!selectedProvider || !selectedDate || !selectedTimeSlot)}
                        >
                          <i className={`fas ${isEmergency ? 'fa-ambulance' : 'fa-calendar-plus'} me-2`}></i>
                          {isEmergency ? 'Submit Emergency Request' : 'Schedule Appointment'}
                        </button>
                        
                        {!isEmergency && (
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setSelectedProvider(null);
                              setSelectedDate('');
                              setSelectedTimeSlot('');
                              setAvailableTimeSlots([]);
                              setAppointmentPriority('normal');
                              setComparedProviders([]);
                            }}
                          >
                            <i className="fas fa-redo me-1"></i>
                            Reset
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="col-lg-4">
                {/* Upcoming Appointments */}
                <div className="card mb-3">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="fas fa-calendar-alt me-2"></i>
                      Upcoming Appointments
                    </h5>
                  </div>
                  <div className="card-body">
                    {upcomingAppointments.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {upcomingAppointments.map(appointment => (
                          <div key={appointment.id} className="list-group-item px-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{formatDate(appointment.appointment_date || appointment.date)}</h6>
                                <p className="mb-1">{appointment.issue}</p>
                                {appointment.provider_name && (
                                  <small className="text-muted">
                                    <i className="fas fa-user-md me-1"></i>
                                    Dr. {appointment.provider_name}
                                  </small>
                                )}
                                {appointment.for_user && (
                                  <small className="text-muted d-block">
                                    <i className="fas fa-user me-1"></i>
                                    For: {appointment.for_user}
                                  </small>
                                )}
                              </div>
                              <div className="text-end">
                                <span className={`badge ${
                                  appointment.status === 'confirmed' ? 'bg-success' : 
                                  appointment.status === 'pending' ? 'bg-warning' : 'bg-secondary'
                                }`}>
                                  {appointment.status}
                                </span>
                                {appointment.priority === 'urgent' && (
                                  <span className="badge bg-danger mt-1 d-block">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Emergency
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
                        <p className="text-muted">No upcoming appointments</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Provider Comparison */}
                {comparedProviders.length > 0 && (
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="fas fa-balance-scale me-2"></i>
                        Provider Comparison
                      </h6>
                    </div>
                    <div className="card-body">
                      {comparedProviders.map(providerId => {
                        const provider = availableProviders.find(p => p.id === providerId);
                        return provider ? (
                          <div key={provider.id} className="border-bottom pb-2 mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>Dr. {provider.name}</strong>
                                <br />
                                <small className="text-muted">{provider.specialization}</small>
                              </div>
                              <div className="text-end">
                                <div className="text-warning">
                                  {'★'.repeat(Math.floor(provider.rating || 4))}
                                </div>
                                <small className="text-muted">{provider.rating?.toFixed(1) || 'N/A'}</small>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                      <button 
                        className="btn btn-sm btn-outline-secondary w-100 mt-2"
                        onClick={clearProviderComparison}
                      >
                        Clear Comparison
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Appointment Guidelines */}
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Appointment Guidelines
                    </h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled small">
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Regular appointments are scheduled during provider availability
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                        Emergency appointments bypass availability schedules
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-clock text-info me-2"></i>
                        Time slots are in 30-minute intervals
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-calendar-alt text-primary me-2"></i>
                        You can book up to 30 days in advance
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-star text-warning me-2"></i>
                        Recommended time slots are based on your preferences
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parent-specific Children Management Tab */}
        {user?.user_type === 'parent' && activeTab === 'children' && (
          <div className="card">
            <div className="card-header">
              <h3>Manage Children</h3>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Form Column */}
                <div className="col-md-6">
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4>{isEditingChild ? 'Edit Child' : 'Add Child'}</h4>
                    </div>
                    <div className="card-body">
                      {childFormError && <div className="alert alert-danger">{childFormError}</div>}
                      <form onSubmit={handleChildFormSubmit}>
                        <div className="mb-3">
                          <label htmlFor="childName" className="form-label">Name</label>
                          <input
                            type="text"
                            id="childName"
                            className="form-control"
                            value={childName}
                            onChange={e => setChildName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="childDob" className="form-label">Date of Birth</label>
                          <input
                            type="date"
                            id="childDob"
                            className="form-control"
                            value={childDob}
                            onChange={e => setChildDob(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="relationship" className="form-label">Relationship</label>
                          <select
                            id="relationship"
                            className="form-control"
                            value={relationshipType}
                            onChange={e => setRelationshipType(e.target.value)}
                            required
                          >
                            <option value="">Select</option>
                            <option value="mother">Mother</option>
                            <option value="father">Father</option>
                            <option value="guardian">Guardian</option>
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          {isEditingChild ? 'Save Changes' : 'Add Child'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
                {/* List Column */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header"><h4>Your Children</h4></div>
                    <div className="card-body">
                      {children.length > 0 ? (
                        <ul className="list-group">
                          {children.map(child => (
                            <li key={child.id} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{child.name}</strong><br/>
                                <small>{child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : ''}</small><br/>
                                <small className="text-muted">{child.relationship}</small>
                              </div>
                              <div>
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEditing(child)}>Edit</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteChild(child.id)}>Delete</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-users fa-3x text-muted mb-3"></i>
                          <p>No children yet</p>
                          <small className="text-muted">Add children above</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
