'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { cycleAPI, mealAPI, appointmentAPI, notificationAPI, parentAPI } from '../../api';
import { useCycle } from '../../contexts/CycleContext';
import { useMeal } from '../../contexts/MealContext';
import { useAppointment } from '../../contexts/AppointmentContext';
import { useNotification } from '../../contexts/NotificationContext';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
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
      return; // Don't proceed if there's no user
    }

    setLoading(true);
    try {
      console.log('Dashboard: loading data for user:', user.id);

      // Load children if user is parent
      if (user.user_type === 'parent') {
        try {
          console.log('Dashboard: loading children...');
          const childrenResponse = await parentAPI.getChildren();
          setChildren(childrenResponse.data || []);
          console.log('Dashboard: children loaded', childrenResponse.data);
        } catch (err) {
          console.error('Failed to load children:', err);
          // Not a critical error, continue with empty children array
        }
      }

      console.log('Dashboard: loading cycle data...');
      // Load cycle data
      const cycleResponse = await cycleAPI.getStats();
      
      // Transform the API response to match frontend expectations
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

      console.log('Dashboard: loading recent meals...');
      // Load recent meals
      const mealsResponse = await mealAPI.getLogs(1, 5);
      setRecentMeals(mealsResponse.data.logs || []);

      console.log('Dashboard: loading appointments...');
      // Load appointments
      const appointmentsResponse = await appointmentAPI.getUpcoming();
      setUpcomingAppointments(appointmentsResponse.data || []);

      console.log('Dashboard: loading notifications...');
      // Load notifications
      const notificationsResponse = await notificationAPI.getRecent();
      setNotifications(notificationsResponse.data || []);

      console.log('Dashboard: all data loaded successfully');
      // Clear error and reset retry count on success
      setError('');
      setRetryCount(0);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      console.log('Error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        url: err.config?.url
      });
      
      if (err.response?.status === 401) {
        console.log('Dashboard: unauthorized, logging out.');
        logout(); // Use logout from context
        router.push('/login');
      } else {
        setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
        setRetryCount(prev => prev + 1);
      }
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

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Dashboard</h4>
          <p>{error}</p>
          <hr />
          <div className="mb-3">
            <strong>Debug Info:</strong>
            <br />
            <small>
              Token exists: {getStorageItem('access_token') ? 'Yes' : 'No'}
              <br />
              User ID: {getStorageItem('user_id') || 'Not set'}
              <br />
              User Type: {getStorageItem('user_type') || 'Not set'}
              <br />
              API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
              <br />
              Retry attempts: {retryCount}
            </small>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={async () => {
                if (retryCount < 3) {
                  setError('');
                  setLoading(true);
                  await loadDashboardData();
                } else {
                  alert('Too many retry attempts. Please check your connection and login again.');
                }
              }}
              disabled={retryCount >= 3}
            >
              {retryCount >= 3 ? 'Max Retries Reached' : 'Retry Loading'}
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
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
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
                                        console.log(`Clicked on ${day.date}`, day);
                                        // Future: Open day details modal
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
                                          <div className="calendar-indicator symptoms" title={`Symptoms: ${day.symptoms.join(', ')}`}></div>
                                        )}
                                        {day.notes && (
                                          <div className="calendar-indicator notes" title={day.notes}></div>
                                        )}
                                      </div>
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

        {/* Appointments Tab Content */}
        {activeTab === 'appointments' && (
          <div className="card">
            <div className="card-header">
              <h3>Appointment Scheduling</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4>Request Appointment</h4>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleAppointmentSubmit}>
                        {appointmentError && <div className="alert alert-danger">{appointmentError}</div>}
                        {user?.user_type === 'parent' && children.length > 0 && (
                          <div className="form-group mb-3">
                            <label htmlFor="appointmentFor" className="form-label">For</label>
                            <select className="form-control" id="appointmentFor" name="appointmentFor">
                              <option value="">Myself</option>
                              {children.map(child => (
                                <option key={child.id} value={child.id}>{child.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="form-group mb-3">
                          <label htmlFor="issue" className="form-label">Issue/Reason</label>
                          <textarea 
                            className="form-control" 
                            id="issue" 
                            name="issue"
                            rows={3}
                            placeholder="Describe the reason for the appointment..."
                            required
                          ></textarea>
                        </div>
                        <div className="form-group mb-3">
                          <label htmlFor="preferredDate" className="form-label">Preferred Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            id="preferredDate" 
                            name="preferredDate"
                            min={new Date().toISOString().split('T')[0]}
                            required 
                          />
                        </div>
                        {/* New actual appointment date field */}
                        <div className="form-group mb-3">
                          <label htmlFor="appointmentDate" className="form-label">Appointment Date (Optional)</label>
                          <input
                            type="date"
                            className="form-control"
                            id="appointmentDate"
                            name="appointmentDate"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary">Request Appointment</button>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h4>Upcoming Appointments</h4>
                    </div>
                    <div className="card-body">
                      {upcomingAppointments.length > 0 ? (
                        <ul className="list-group">
                          {upcomingAppointments.map(appointment => (
                            <li key={appointment.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>{formatDate(appointment.date)}</strong>
                                  <br />
                                  {appointment.issue}
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
                        <div className="text-center py-4">
                          <i className="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
                          <p>No upcoming appointments</p>
                        </div>
                      )}
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
