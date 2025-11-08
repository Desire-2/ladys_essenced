'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { cycleAPI, mealAPI, appointmentAPI, notificationAPI, parentAPI } from '../../api';
import { useCycle } from '../../contexts/CycleContext';
import { useMeal } from '../../contexts/MealContext';
import { useAppointment } from '../../contexts/AppointmentContext';
import { useNotification } from '../../contexts/NotificationContext';
import EnhancedAppointmentBooking from '../../components/EnhancedAppointmentBooking';
import CycleCalendar from '../../components/CycleCalendar';

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
  for_user?: string;
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
  const [activeTab, setActiveTab] = useState<string>('overview');
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Enhanced individual loading and error states for better UX
  const [dataLoadingStates, setDataLoadingStates] = useState({
    children: false,
    cycle: false,
    meals: false,
    appointments: false,
    notifications: false,
    calendar: false
  });
  
  const [dataErrors, setDataErrors] = useState({
    children: '',
    cycle: '',
    meals: '',
    appointments: '',
    notifications: '',
    calendar: ''
  });
  
  const [dataAvailability, setDataAvailability] = useState({
    children: false,
    cycle: false,
    meals: false,
    appointments: false,
    notifications: false,
    calendar: false
  });
  
  // Child management state
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [childPhoneNumber, setChildPhoneNumber] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const [childFormError, setChildFormError] = useState('');
  const [childFormSuccess, setChildFormSuccess] = useState('');
  
  // View child modal state
  const [viewingChild, setViewingChild] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Generate random phone number for child
  const generateRandomPhone = () => {
    const prefix = '250'; // Rwanda country code
    const randomDigits = Math.floor(Math.random() * 900000000) + 100000000; // 9 digits
    return `${prefix}${randomDigits}`;
  };

  // Generate random password for child
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const router = useRouter();

  // Helper functions for managing data states
  const setDataLoading = (dataType: keyof typeof dataLoadingStates, isLoading: boolean) => {
    setDataLoadingStates(prev => ({ ...prev, [dataType]: isLoading }));
  };

  const setDataError = (dataType: keyof typeof dataErrors, error: string) => {
    setDataErrors(prev => ({ ...prev, [dataType]: error }));
  };

  const setDataAvailable = (dataType: keyof typeof dataAvailability, available: boolean) => {
    setDataAvailability(prev => ({ ...prev, [dataType]: available }));
  };

  const clearDataError = (dataType: keyof typeof dataErrors) => {
    setDataError(dataType, '');
  };

  // Helper function to retry loading specific data type
  const retryDataLoad = async (dataType: string) => {
    switch (dataType) {
      case 'children':
        await loadChildrenData();
        break;
      case 'cycle':
        await loadCycleData();
        break;
      case 'meals':
        await loadMealsData();
        break;
      case 'appointments':
        await loadAppointmentsData();
        break;
      case 'notifications':
        await loadNotificationsData();
        break;
      case 'calendar':
        await loadCalendarData();
        break;
      default:
        await loadDashboardData();
    }
  };

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
    // If auth is still loading, wait.
    if (authLoading) {
      return;
    }

    // If auth has loaded and there's no user, redirect to login.
    if (!user) {
      console.log('Dashboard: No user found in context, redirecting to login.');
      router.push('/login');
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
  }, [user, authLoading, router, hasRole, getDashboardRoute]); // Depend on user and authLoading state

  const loadDashboardData = async () => {
    if (!user) {
      console.log('Dashboard: loadDashboardData called without a user.');
      return;
    }

    setLoading(true);
    setError('');

    // Load all data sections individually for better error handling
    await Promise.allSettled([
      loadChildrenData(),
      loadCycleData(),
      loadMealsData(),
      loadAppointmentsData(),
      loadNotificationsData()
    ]);

    setLoading(false);
  };

  // Individual data loading functions with enhanced error handling
  const loadChildrenData = async () => {
    if (!user || user.user_type !== 'parent') return;
    
    setDataLoading('children', true);
    clearDataError('children');
    
    try {
      console.log('Dashboard: loading children...');
      const childrenResponse = await parentAPI.getChildren();
      setChildren(childrenResponse.data || []);
      setDataAvailable('children', true);
      console.log('Dashboard: children loaded', childrenResponse.data);
    } catch (err: any) {
      console.error('Failed to load children:', err);
      setDataError('children', err.response?.data?.message || 'Failed to load children data');
      setDataAvailable('children', false);
    } finally {
      setDataLoading('children', false);
    }
  };

  const loadCycleData = async () => {
    if (!user) return;
    
    setDataLoading('cycle', true);
    clearDataError('cycle');
    
    try {
      console.log('Dashboard: loading cycle data for user:', selectedChild || user.id);
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
      console.log('Dashboard: cycle data loaded', transformedCycleData);
    } catch (err: any) {
      console.error('Failed to load cycle data:', err);
      setDataError('cycle', err.response?.data?.message || 'Failed to load cycle tracking data');
      setDataAvailable('cycle', false);
    } finally {
      setDataLoading('cycle', false);
    }
  };

  const loadMealsData = async () => {
    if (!user) return;
    
    setDataLoading('meals', true);
    clearDataError('meals');
    
    try {
      console.log('Dashboard: loading recent meals for user:', selectedChild || user.id);
      // @ts-ignore - mealAPI.getLogs accepts userId parameter
      const mealsResponse = await mealAPI.getLogs(1, 5, {}, selectedChild);
      setRecentMeals(mealsResponse.data.logs || []);
      setDataAvailable('meals', true);
      console.log('Dashboard: meals loaded', mealsResponse.data.logs);
    } catch (err: any) {
      console.error('Failed to load meals:', err);
      setDataError('meals', err.response?.data?.message || 'Failed to load meal logs');
      setDataAvailable('meals', false);
    } finally {
      setDataLoading('meals', false);
    }
  };

  const loadAppointmentsData = async () => {
    if (!user) return;
    
    setDataLoading('appointments', true);
    clearDataError('appointments');
    
    try {
      console.log('Dashboard: loading appointments for user:', selectedChild || user.id);
      // @ts-ignore - appointmentAPI.getUpcoming accepts userId parameter
      const appointmentsResponse = await appointmentAPI.getUpcoming(selectedChild);
      setUpcomingAppointments(appointmentsResponse.data || []);
      setDataAvailable('appointments', true);
      console.log('Dashboard: appointments loaded', appointmentsResponse.data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setDataError('appointments', err.response?.data?.message || 'Failed to load appointments');
      setDataAvailable('appointments', false);
    } finally {
      setDataLoading('appointments', false);
    }
  };

  const loadNotificationsData = async () => {
    if (!user) return;
    
    setDataLoading('notifications', true);
    clearDataError('notifications');
    
    try {
      console.log('Dashboard: loading notifications...');
      const notificationsResponse = await notificationAPI.getRecent();
      setNotifications(notificationsResponse.data || []);
      setDataAvailable('notifications', true);
      console.log('Dashboard: notifications loaded', notificationsResponse.data);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setDataError('notifications', err.response?.data?.message || 'Failed to load notifications');
      setDataAvailable('notifications', false);
    } finally {
      setDataLoading('notifications', false);
    }
  };

  // Load calendar data with enhanced error handling
  const loadCalendarData = async (year?: number, month?: number) => {
    if (!user) return;
    
    setDataLoading('calendar', true);
    clearDataError('calendar');
    
    try {
      const targetDate = year && month ? new Date(year, month - 1) : currentDate;
      // @ts-ignore - cycleAPI.getCalendarData accepts number | null
      const response = await cycleAPI.getCalendarData(targetDate.getFullYear(), targetDate.getMonth() + 1, selectedChild);
      setCalendarData(response.data);
      setDataAvailable('calendar', true);
      console.log('Calendar data loaded for user:', selectedChild || user.id, response.data);
    } catch (err: any) {
      console.error('Failed to load calendar data:', err);
      setDataError('calendar', err.response?.data?.message || 'Failed to load calendar data');
      setDataAvailable('calendar', false);
    } finally {
      setDataLoading('calendar', false);
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
  }, [user, activeTab, selectedChild]);

  // Reload cycle data when selectedChild changes
  useEffect(() => {
    if (user) {
      console.log('Dashboard: selectedChild changed, reloading cycle data for:', selectedChild || user.id);
      loadCycleData();
    }
  }, [selectedChild, user]);

  // Reload meals data when selectedChild changes
  useEffect(() => {
    if (user) {
      console.log('Dashboard: selectedChild changed, reloading meals data for:', selectedChild || user.id);
      loadMealsData();
    }
  }, [selectedChild, user]);

  // Reload appointments data when selectedChild changes
  useEffect(() => {
    if (user) {
      console.log('Dashboard: selectedChild changed, reloading appointments data for:', selectedChild || user.id);
      loadAppointmentsData();
    }
  }, [selectedChild, user]);

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
    const result = await createAppointment({
         issue: formData.get('issue') as string,
         preferred_date: formData.get('preferredDate') as string,
         appointment_date: formData.get('appointmentDate') as string || undefined,
         for_user_id: selectedChild || user?.id
    });
    if (!result.success) {
      setError(result.error || 'Failed to save appointment');
      return;
    }
    // Upcoming appointments updated in context
    loadDashboardData();
    e.currentTarget.reset();
  };

  // Handle add/edit child form
  const handleChildFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChildFormError('');
    setChildFormSuccess('');
    
    try {
      if (isEditingChild && editingChildId) {
        await parentAPI.updateChild(editingChildId, {
          name: childName,
          date_of_birth: childDob,
          relationship_type: relationshipType,
          phone_number: childPhoneNumber,
          password: childPassword
        });
        setChildFormSuccess('Child information updated successfully!');
      } else {
        await parentAPI.addChild({
          name: childName,
          date_of_birth: childDob,
          relationship_type: relationshipType,
          phone_number: childPhoneNumber || generateRandomPhone(),
          password: childPassword || generateRandomPassword()
        });
        setChildFormSuccess('Child added successfully!');
      }
      
      // Reset form
      setChildName(''); 
      setChildDob(''); 
      setRelationshipType('');
      setChildPhoneNumber('');
      setChildPassword('');
      setIsEditingChild(false); 
      setEditingChildId(null);
      
      // Refresh children list
      await loadChildrenData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setChildFormSuccess(''), 3000);
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
    setChildPhoneNumber(child.phone_number || '');
    setChildPassword(''); // Don't show password when editing
  };
  
  const viewChild = (child: any) => {
    setViewingChild(child);
    setShowViewModal(true);
  };
  
  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingChild(null);
  };
  
  const deleteChild = async (id: number) => {
    try {
      setChildFormError('');
      setChildFormSuccess('');
      await parentAPI.deleteChild(id);
      // Refresh children list after deletion
      await loadChildrenData();
      setChildFormSuccess('Child removed successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setChildFormSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to delete child:', err);
      setChildFormError(err.response?.data?.message || 'Failed to delete child');
    }
  };

  // Reusable component for displaying data with loading and error states
  const DataSection = ({ 
    title, 
    dataType, 
    children, 
    icon,
    showRetry = true 
  }: { 
    title: string; 
    dataType: keyof typeof dataLoadingStates; 
    children: React.ReactNode;
    icon?: string;
    showRetry?: boolean;
  }) => {
    const isLoading = dataLoadingStates[dataType];
    const error = dataErrors[dataType];
    const hasData = dataAvailability[dataType];

    if (isLoading) {
      return (
        <div className="card h-100">
          <div className="card-header d-flex align-items-center">
            {icon && <i className={`${icon} me-2`}></i>}
            <h5 className="mb-0">{title}</h5>
          </div>
          <div className="card-body d-flex align-items-center justify-content-center">
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading {title.toLowerCase()}...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="card h-100 border-warning">
          <div className="card-header bg-warning text-dark d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <h5 className="mb-0">{title}</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-warning mb-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-circle me-2"></i>
                <div className="flex-grow-1">
                  <strong>Unable to load data</strong>
                  <div className="small mt-1">{error}</div>
                </div>
              </div>
            </div>
            {showRetry && (
              <div className="text-center">
                <button 
                  className="btn btn-outline-warning btn-sm"
                  onClick={() => retryDataLoad(dataType)}
                  disabled={isLoading}
                >
                  <i className="fas fa-redo me-1"></i>
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="card h-100">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            {icon && <i className={`${icon} me-2`}></i>}
            <h5 className="mb-0">{title}</h5>
          </div>
          {hasData && (
            <span className="badge bg-success">
              <i className="fas fa-check-circle me-1"></i>
              Loaded
            </span>
          )}
        </div>
        <div className="card-body">
          {children}
        </div>
      </div>
    );
  };

  // Enhanced empty state component
  const EmptyState = ({ 
    icon, 
    title, 
    description, 
    actionText, 
    onAction 
  }: {
    icon: string;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
  }) => (
    <div className="text-center py-4">
      <i className={`${icon} text-muted mb-3`} style={{ fontSize: '3rem' }}></i>
      <h6 className="text-muted mb-2">{title}</h6>
      <p className="text-muted small mb-3">{description}</p>
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Loading Dashboard</h4>
          <p className="text-muted">Fetching your data...</p>
          
          {/* Show individual loading states */}
          <div className="row mt-4">
            <div className="col-md-8 mx-auto">
              <div className="list-group">
                {Object.entries(dataLoadingStates).map(([key, isLoading]) => (
                  <div key={key} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-capitalize">{key}</span>
                    {isLoading ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : dataAvailability[key as keyof typeof dataAvailability] ? (
                      <i className="fas fa-check-circle text-success"></i>
                    ) : dataErrors[key as keyof typeof dataErrors] ? (
                      <i className="fas fa-exclamation-circle text-warning"></i>
                    ) : (
                      <i className="fas fa-clock text-muted"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center mb-3">
            <i className="fas fa-exclamation-triangle me-2" style={{ fontSize: '1.5rem' }}></i>
            <h4 className="mb-0">Dashboard Error</h4>
          </div>
          <p className="mb-3">{error}</p>
          
          {/* Enhanced error details */}
          <div className="card bg-light mb-3">
            <div className="card-body">
              <h6 className="card-title">Debug Information</h6>
              <div className="row">
                <div className="col-md-6">
                  <small>
                    <strong>Authentication:</strong><br />
                    Token exists: {getStorageItem('access_token') ? '✅ Yes' : '❌ No'}<br />
                    User ID: {getStorageItem('user_id') || 'Not set'}<br />
                    User Type: {getStorageItem('user_type') || 'Not set'}
                  </small>
                </div>
                <div className="col-md-6">
                  <small>
                    <strong>System:</strong><br />
                    API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}<br />
                    Retry attempts: {retryCount}<br />
                    Browser: {typeof window !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Data loading status */}
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Data Loading Status</h6>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(dataErrors).map(([key, error]) => (
                  <div key={key} className="col-md-6 mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-capitalize">{key}:</span>
                      {error ? (
                        <span className="badge bg-danger">
                          <i className="fas fa-times me-1"></i>
                          Error
                        </span>
                      ) : dataAvailability[key as keyof typeof dataAvailability] ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check me-1"></i>
                          Loaded
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <i className="fas fa-clock me-1"></i>
                          Pending
                        </span>
                      )}
                    </div>
                    {error && <small className="text-danger">{error}</small>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr />
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-primary"
              onClick={async () => {
                if (retryCount < 5) {
                  setError('');
                  setRetryCount(prev => prev + 1);
                  await loadDashboardData();
                } else {
                  alert('Maximum retry attempts reached. Please check your connection and try logging in again.');
                }
              }}
              disabled={retryCount >= 5}
            >
              <i className="fas fa-redo me-1"></i>
              {retryCount >= 5 ? 'Max Retries Reached' : `Retry Loading (${retryCount}/5)`}
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-refresh me-1"></i>
              Refresh Page
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_type');
                router.push('/login');
              }}
            >
              <i className="fas fa-sign-out-alt me-1"></i>
              Logout & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3 py-md-4 px-2 px-md-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2">
          <h1 className="h4 h3-md mb-0">Dashboard - Welcome, {user?.name}</h1>
          <button 
            className="btn btn-outline-secondary btn-sm w-100 w-md-auto"
            onClick={() => {
              localStorage.removeItem('access_token');
              router.push('/login');
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>

        {/* Parent-specific child selector - Responsive */}
        {user?.user_type === 'parent' && children.length > 0 && (
          <div className="card mb-3 mb-md-4">
            <div className="card-body p-2 p-md-3">
              <h5 className="card-title small mb-2">Viewing Data For:</h5>
              <div className="d-flex flex-wrap gap-2" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm ${!selectedChild ? 'btn-primary' : 'btn-outline-primary'} flex-fill flex-md-grow-0`}
                  onClick={() => setSelectedChild(null)}
                >
                  Myself
                </button>
                {children.map(child => (
                  <button 
                    key={child.id}
                    type="button" 
                    className={`btn btn-sm ${selectedChild === child.user_id ? 'btn-primary' : 'btn-outline-primary'} flex-fill flex-md-grow-0`}
                    onClick={() => setSelectedChild(child.user_id || null)}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Navigation - Responsive with horizontal scroll */}
        <div className="card mb-3 mb-md-4">
          <div className="card-body p-0">
            <div className="overflow-auto">
              <ul className="nav nav-tabs border-0 flex-nowrap" style={{ minWidth: 'max-content' }}>
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('overview');
                    }}
                  >
                    <i className="fas fa-home me-1 me-md-2"></i>
                    <span className="d-none d-sm-inline">Overview</span>
                    <span className="d-inline d-sm-none">Home</span>
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
                    <i className="fas fa-calendar-alt me-1 me-md-2"></i>
                    <span className="d-none d-sm-inline">Cycle Tracking</span>
                    <span className="d-inline d-sm-none">Cycle</span>
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
                    <i className="fas fa-utensils me-1 me-md-2"></i>
                    <span className="d-none d-sm-inline">Meal Logs</span>
                    <span className="d-inline d-sm-none">Meals</span>
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
                  <i className="fas fa-calendar-check me-1 me-md-2"></i>
                  <span className="d-none d-sm-inline">Appointments</span>
                  <span className="d-inline d-sm-none">Appts</span>
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
                    <i className="fas fa-users me-1 me-md-2"></i>
                    <span className="d-none d-sm-inline">Manage Children</span>
                    <span className="d-inline d-sm-none">Children</span>
                  </a>
                </li>
              )}
            </ul>
            </div>
          </div>
        </div>
        
        {/* Overview Tab Content - Responsive */}
        {activeTab === 'overview' && (
          <div>
            <div className="row g-3 g-md-4">
              {/* Cycle Summary */}
              <div className="col-12 col-lg-6 mb-3 mb-md-4">
                <DataSection
                  title="Cycle Summary"
                  dataType="cycle"
                  icon="fas fa-calendar-alt"
                >
                  {selectedChild && (
                    <small className="text-muted d-block mb-2 mb-md-3">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
                  )}
                  {dataAvailability.cycle ? (
                    <>
                      <div className="d-flex justify-content-between mb-2 mb-md-3">
                        <div className="small">
                          <strong>Next Period:</strong>
                        </div>
                        <div className={`${cycleData.nextPeriod ? 'text-primary fw-bold' : 'text-muted'} small`}>
                          {cycleData.nextPeriod || 'Not available'}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mb-2 mb-md-3">
                        <div className="small">
                          <strong>Last Period:</strong>
                        </div>
                        <div className={`${cycleData.lastPeriod ? 'text-success' : 'text-muted'} small`}>
                          {cycleData.lastPeriod || 'Not logged yet'}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mb-2 mb-md-3">
                        <div className="small">
                          <strong>Average Cycle Length:</strong>
                        </div>
                        <div className={`${cycleData.cycleLength ? 'text-info fw-bold' : 'text-muted'} small`}>
                          {cycleData.cycleLength ? `${cycleData.cycleLength} days` : 'N/A'}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mb-2 mb-md-3">
                        <div className="small">
                          <strong>Total Logs:</strong>
                        </div>
                        <div className="text-secondary fw-bold small">
                          {cycleData.totalLogs} cycles
                        </div>
                      </div>
                      <div className="mt-4">
                        <button 
                          className="btn btn-primary w-100"
                          onClick={() => setActiveTab('cycle')}
                        >
                          <i className="fas fa-plus-circle me-2"></i>
                          Track Cycle
                        </button>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon="fas fa-calendar-plus"
                      title="No Cycle Data"
                      description="Start tracking your menstrual cycle to see insights and predictions."
                      actionText="Start Tracking"
                      onAction={() => setActiveTab('cycle')}
                    />
                  )}
                </DataSection>
              </div>
              
              {/* Notifications - Responsive */}
              <div className="col-12 col-lg-6 mb-3 mb-md-4">
                <DataSection
                  title="Notifications"
                  dataType="notifications"
                  icon="fas fa-bell"
                >
                  {dataAvailability.notifications ? (
                    notifications.length > 0 ? (
                      <>
                        <ul className="list-group list-group-flush">
                          {notifications.slice(0, 5).map(notification => (
                            <li key={notification.id} className={`list-group-item px-0 py-2 ${!notification.is_read ? 'bg-light border-start border-primary border-3' : ''}`}>
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-1">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-1">
                                    {!notification.is_read && <span className="badge bg-primary me-2 small">New</span>}
                                    <span className={`${!notification.is_read ? 'fw-bold' : ''} small`}>{notification.message}</span>
                                  </div>
                                </div>
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(notification.date)}</small>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {notifications.length > 5 && (
                          <div className="mt-2 mt-md-3 text-center">
                            <a href="/notifications" className="btn btn-sm btn-outline-primary w-100 w-md-auto">
                              View All {notifications.length} Notifications
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState
                        icon="fas fa-bell-slash"
                        title="No Notifications"
                        description="You're all caught up! No new notifications to display."
                      />
                    )
                  ) : (
                    <EmptyState
                      icon="fas fa-exclamation-triangle"
                      title="Notifications Unavailable"
                      description="Unable to load your notifications at this time."
                    />
                  )}
                </DataSection>
              </div>
            </div>
            
            <div className="row g-3 g-md-4">
              {/* Recent Meals - Responsive */}
              <div className="col-12 col-lg-6 mb-3 mb-md-4">
                <DataSection
                  title="Recent Meals"
                  dataType="meals"
                  icon="fas fa-utensils"
                >
                  {selectedChild && (
                    <small className="text-muted d-block mb-2 mb-md-3">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
                  )}
                  {dataAvailability.meals ? (
                    recentMeals.length > 0 ? (
                      <>
                        <ul className="list-group list-group-flush">
                          {recentMeals.map(meal => (
                            <li key={meal.id} className="list-group-item px-0 py-2">
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-1">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-1">
                                    <span className={`badge me-2 small ${
                                      meal.meal_type === 'breakfast' ? 'bg-warning' :
                                      meal.meal_type === 'lunch' ? 'bg-success' :
                                      meal.meal_type === 'dinner' ? 'bg-info' :
                                      'bg-secondary'
                                    }`}>
                                      {meal.meal_type}
                                    </span>
                                    <strong className="text-capitalize small">{meal.meal_type}</strong>
                                  </div>
                                  <p className="mb-0 text-muted small">{meal.description || meal.details}</p>
                                </div>
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(meal.meal_time || meal.date)}</small>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 mt-md-4">
                          <button 
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => setActiveTab('meals')}
                          >
                            <i className="fas fa-plus-circle me-2"></i>
                            Log New Meal
                          </button>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon="fas fa-utensils"
                        title="No Meal Logs"
                        description="Start logging your meals to track your nutrition and eating patterns."
                        actionText="Log First Meal"
                        onAction={() => setActiveTab('meals')}
                      />
                    )
                  ) : (
                    <EmptyState
                      icon="fas fa-exclamation-triangle"
                      title="Meals Unavailable"
                      description="Unable to load your meal logs at this time."
                    />
                  )}
                </DataSection>
              </div>
              
              {/* Upcoming Appointments - Responsive */}
              <div className="col-12 col-lg-6 mb-3 mb-md-4">
                <DataSection
                  title="Upcoming Appointments"
                  dataType="appointments"
                  icon="fas fa-calendar-check"
                >
                  {dataAvailability.appointments ? (
                    upcomingAppointments.length > 0 ? (
                      <>
                        <ul className="list-group list-group-flush">
                          {upcomingAppointments.map(appointment => (
                            <li key={appointment.id} className="list-group-item px-0 py-2">
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-calendar text-primary me-2"></i>
                                    <strong className="small">{formatDate(appointment.appointment_date || appointment.date)}</strong>
                                  </div>
                                  <p className="mb-1 small">{appointment.issue}</p>
                                  {appointment.for_user && (
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      <i className="fas fa-user me-1"></i>
                                      For: {appointment.for_user}
                                    </small>
                                  )}
                                </div>
                                <span className={`badge align-self-md-start ${
                                  appointment.status.toLowerCase() === 'confirmed' ? 'bg-success' : 
                                  appointment.status.toLowerCase() === 'pending' ? 'bg-warning' : 
                                  appointment.status.toLowerCase() === 'completed' ? 'bg-info' : 'bg-secondary'
                                }`}>
                                  {appointment.status}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 mt-md-4">
                          <button 
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => setActiveTab('appointments')}
                          >
                            <i className="fas fa-plus-circle me-2"></i>
                            Schedule Appointment
                          </button>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon="fas fa-calendar-plus"
                        title="No Upcoming Appointments"
                        description="Schedule your first appointment with a healthcare provider."
                        actionText="Book Appointment"
                        onAction={() => setActiveTab('appointments')}
                      />
                    )
                  ) : (
                    <EmptyState
                      icon="fas fa-exclamation-triangle"
                      title="Appointments Unavailable"
                      description="Unable to load your appointments at this time."
                    />
                  )}
                </DataSection>
              </div>
            </div>
          </div>
        )}

        {/* Cycle Tracking Tab */}
        {activeTab === 'cycle' && (
          <div>
            <div className="card">
              <div className="card-header">
                <h3>Cycle Tracking</h3>
                {selectedChild && (
                  <small className="text-muted">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
                )}
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <DataSection
                      title="Cycle Calendar"
                      dataType="calendar"
                      icon="fas fa-calendar-alt"
                      showRetry={true}
                    >
                      {dataAvailability.calendar && calendarData ? (
                        <CycleCalendar 
                          calendarData={calendarData}
                          currentDate={currentDate}
                          onNavigateMonth={navigateMonth}
                        />
                      ) : (
                        <EmptyState
                          icon="fas fa-calendar-times"
                          title="Calendar Unavailable"
                          description="Unable to load calendar data. Please check your connection and try again."
                          actionText="Retry Loading"
                          onAction={() => retryDataLoad('calendar')}
                        />
                      )}
                    </DataSection>
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
                            <i className="fas fa-calendar-check me-1 text-success"></i>
                            <span className="fw-semibold">End Date</span> <span className="text-muted small">(Optional)</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-0"><i className="fas fa-calendar-day text-success"></i></span>
                            <input 
                              type="date" 
                              className="form-control border-start-0" 
                              id="endDate" 
                              name="endDate"
                              style={{ background: '#133557ff' }}
                            />
                          </div>
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
        </div>
        )}
        
        {/* Meal Logs Tab Content */}
        {activeTab === 'meals' && (
          <div className="card">
            <div className="card-header">
              <h3>Meal Logging</h3>
              {selectedChild && (
                <small className="text-muted">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
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
                        <div className="form-group mb-3">
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
            <div className="row mb-4">
              <div className="col-md-8">
                <EnhancedAppointmentBooking 
                  onAppointmentBooked={loadDashboardData}
                  selectedChild={selectedChild}
                  children={children}
                />
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-calendar-check text-primary me-2"></i>
                      Your Upcoming Appointments
                    </h6>
                  </div>
                  <div className="card-body">
                    {upcomingAppointments.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {upcomingAppointments.map(appointment => (
                          <div key={appointment.id} className="list-group-item px-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-1">
                                  <i className="fas fa-calendar text-primary me-2"></i>
                                  <strong className="small">{formatDate(appointment.date || appointment.appointment_date)}</strong>
                                </div>
                                <p className="mb-1 small">{appointment.issue}</p>
                                {appointment.for_user && (
                                  <small className="text-muted">
                                    <i className="fas fa-user me-1"></i>
                                    For: {appointment.for_user}
                                  </small>
                                )}
                              </div>
                              <span className={`badge ${
                                appointment.status.toLowerCase() === 'confirmed' ? 'bg-success' : 
                                appointment.status.toLowerCase() === 'pending' ? 'bg-warning' : 
                                appointment.status.toLowerCase() === 'completed' ? 'bg-info' : 'bg-secondary'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-calendar-plus text-muted mb-3" style={{ fontSize: '2.5rem' }}></i>
                        <h6 className="text-muted">No Upcoming Appointments</h6>
                        <p className="text-muted small mb-0">Book your first appointment using the form on the left.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick appointment tips */}
                <div className="card mt-3">
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-lightbulb me-2"></i>
                      Appointment Tips
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="small">
                      <div className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        Book in advance for better availability
                      </div>
                      <div className="mb-2">
                        <i className="fas fa-clock text-info me-2"></i>
                        Arrive 10 minutes early
                      </div>
                      <div className="mb-2">
                        <i className="fas fa-notes-medical text-warning me-2"></i>
                        Prepare a list of symptoms or questions
                      </div>
                      <div className="mb-0">
                        <i className="fas fa-id-card text-primary me-2"></i>
                        Bring your ID and insurance card
                      </div>
                    </div>
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
                      {childFormSuccess && <div className="alert alert-success">{childFormSuccess}</div>}
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
                        
                        {/* Phone Number Field */}
                        <div className="mb-3">
                          <label htmlFor="childPhoneNumber" className="form-label d-flex justify-content-between align-items-center">
                            <span>Phone Number <small className="text-muted">(Optional - can be changed later)</small></span>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setChildPhoneNumber(generateRandomPhone())}
                            >
                              <i className="fas fa-sync-alt me-1"></i>
                              Generate
                            </button>
                          </label>
                          <input
                            type="tel"
                            id="childPhoneNumber"
                            className="form-control"
                            value={childPhoneNumber}
                            onChange={e => setChildPhoneNumber(e.target.value)}
                            placeholder="250XXXXXXXXX (leave empty for random)"
                          />
                          <small className="form-text text-muted">
                            If left empty, a random phone number will be assigned that can be changed later when child gets a phone.
                          </small>
                        </div>

                        {/* Password Field */}
                        <div className="mb-3">
                          <label htmlFor="childPassword" className="form-label d-flex justify-content-between align-items-center">
                            <span>Password <small className="text-muted">(Optional - can be changed later)</small></span>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setChildPassword(generateRandomPassword())}
                            >
                              <i className="fas fa-key me-1"></i>
                              Generate
                            </button>
                          </label>
                          <input
                            type="text"
                            id="childPassword"
                            className="form-control"
                            value={childPassword}
                            onChange={e => setChildPassword(e.target.value)}
                            placeholder="Leave empty for random password"
                          />
                          <small className="form-text text-muted">
                            If left empty, a random password will be generated. Child can change it later.
                          </small>
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary flex-grow-1">
                            <i className={`fas ${isEditingChild ? 'fa-save' : 'fa-plus'} me-2`}></i>
                            {isEditingChild ? 'Save Changes' : 'Add Child'}
                          </button>
                          
                          {isEditingChild && (
                            <button 
                              type="button" 
                              className="btn btn-secondary"
                              onClick={() => {
                                setIsEditingChild(false);
                                setEditingChildId(null);
                                setChildName('');
                                setChildDob('');
                                setRelationshipType('');
                                setChildPhoneNumber('');
                                setChildPassword('');
                                setChildFormError('');
                                setChildFormSuccess('');
                              }}
                            >
                              <i className="fas fa-times me-2"></i>
                              Cancel
                            </button>
                          )}
                        </div>
                        
                        {!isEditingChild && (
                          <div className="alert alert-info mt-3 mb-0">
                            <i className="fas fa-info-circle me-2"></i>
                            <small>
                              <strong>Note:</strong> If phone number and password are left empty, random credentials will be generated. 
                              These can be updated later when the child gets their own phone.
                            </small>
                          </div>
                        )}
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
                                <small>{child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'No DOB'}</small><br/>
                                <small className="text-muted">Relationship: {child.relationship}</small>
                              </div>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-sm btn-outline-info" 
                                  onClick={() => viewChild(child)}
                                  title="View child information"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-primary" 
                                  onClick={() => startEditing(child)}
                                  title="Edit child information"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger" 
                                  onClick={() => deleteChild(child.id)}
                                  title="Remove child"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
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

        {/* View Child Information Modal */}
        {showViewModal && viewingChild && (
          <div 
            className="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeViewModal}
          >
            <div 
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-user-circle me-2"></i>
                    Child Information
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeViewModal}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                          <i className="fas fa-user"></i>
                        </div>
                        <div className="ms-3">
                          <h4 className="mb-0">{viewingChild.name}</h4>
                          <small className="text-muted">ID: {viewingChild.id}</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small">Date of Birth</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-calendar"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={viewingChild.date_of_birth ? new Date(viewingChild.date_of_birth).toLocaleDateString() : 'Not set'} 
                          readOnly 
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small">Age</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-birthday-cake"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={viewingChild.date_of_birth 
                            ? `${Math.floor((new Date().getTime() - new Date(viewingChild.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years`
                            : 'N/A'
                          } 
                          readOnly 
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small">Relationship</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-heart"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control text-capitalize" 
                          value={viewingChild.relationship || 'Not specified'} 
                          readOnly 
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-muted small">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-phone"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={viewingChild.phone_number || 'Not set'} 
                          readOnly 
                        />
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small">User ID</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-id-card"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={viewingChild.user_id || 'N/A'} 
                          readOnly 
                        />
                      </div>
                      <small className="text-muted">This ID is used for tracking child's health data</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedChild(viewingChild.user_id || null);
                      closeViewModal();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    View Dashboard
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      startEditing(viewingChild);
                      closeViewModal();
                    }}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={closeViewModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
