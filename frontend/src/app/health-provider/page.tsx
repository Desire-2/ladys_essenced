'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { buildHealthProviderApiUrl } from '../../utils/apiConfig';
import { toast } from 'react-hot-toast';
import api from '../../lib/api/client';
import StatCard from './components/StatCard';
import AvailabilityWidget from './components/AvailabilityWidget';
import AnalyticsWidget from './components/AnalyticsWidget';
import NotificationCenter from './components/NotificationCenter';
import NotificationBell from '../../components/notifications/NotificationBell';
import NotificationSender from '../../components/notifications/NotificationSender';
import AvailabilityManagement from './components/AvailabilityManagement';

// Helper function to handle API responses safely
const handleApiResponse = async (response: Response, errorMessage: string = 'API request failed') => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${errorMessage}:`, response.status, errorText);
    throw new Error(`${errorMessage}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`Expected JSON but received:`, text.substring(0, 200));
    throw new Error(`Expected JSON response but received: ${contentType || 'unknown content type'}`);
  }

  try {
    return await response.json();
  } catch (parseError) {
    const text = await response.text();
    console.error('JSON parse error:', parseError, 'Response text:', text.substring(0, 200));
    throw new Error('Invalid JSON response from server');
  }
};

interface ProviderStats {
  appointment_stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    today: number;
    this_week: number;
    urgent: number;
  };
  recent_appointments: Array<{
    id: number;
    patient_name: string;
    issue: string;
    appointment_date: string | null;
    status: string;
    priority: string;
    created_at: string;
  }>;
  monthly_trends: Array<{
    month: string;
    total_appointments: number;
    completed_appointments: number;
  }>;
  provider_info: {
    name: string;
    specialization: string;
    clinic_name: string;
    is_verified: boolean;
    license_number?: string;
    clinic_address?: string;
    phone?: string;
  };
}

export interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  issue: string;
  appointment_date: string | null;
  preferred_date: string | null;
  status: string;
  priority: string;
  notes: string;
  provider_notes: string;
  created_at: string;
}

interface UnassignedAppointment {
  id: number;
  patient_name: string;
  issue: string;
  preferred_date: string | null;
  priority: string;
  created_at: string;
}

interface Patient {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  total_appointments: number;
  last_appointment: string | null;
  last_appointment_status: string | null;
}

interface Schedule {
  [date: string]: Array<{
    id: number;
    patient_name: string;
    issue: string;
    time: string;
    status: string;
    priority: string;
  }>;
}

interface Notification {
  id: number;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

export interface ProviderProfile {
  id?: number;
  name: string;
  email: string;
  license_number: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  phone: string;
  is_verified: boolean;
  availability_hours: Record<string, any>;
  created_at: string;
}

function HealthProviderDashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unassignedAppointments, setUnassignedAppointments] = useState<UnassignedAppointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [providerId, setProviderId] = useState<number>(0);
  const isInitializedRef = useRef(false);
  const hasRedirectedRef = useRef(false);
  const isLoadingDataRef = useRef(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);

  // Date range filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const router = useRouter();
  const { user, loading: authLoading, hasRole, getDashboardRoute } = useAuth();

  // Dashboard data loading function
  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingDataRef.current) {
      console.log('Dashboard data already loading, skipping...');
      return;
    }

    try {
      isLoadingDataRef.current = true;
      console.log('Loading dashboard data...');
      setLoading(true);
      
      // Check if user has health provider role
      if (!hasRole('health_provider')) {
        console.error('User does not have health provider access');
        setError('Access denied: Health provider role required');
        router.push('/dashboard');
        return;
      }
      
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('No access token found - user not authenticated');
        return;
      }

      // Load multiple data sources in parallel using authenticated endpoints
      const [statsData, profileData, notificationsData] = await Promise.all([
        api.healthProvider.getDashboardStats().catch((err) => {
          console.warn('Failed to load dashboard stats:', err);
          return null;
        }),
        api.healthProvider.getProfile().catch((err) => {
          console.warn('Failed to load profile:', err);
          return null;
        }),
        fetch(buildHealthProviderApiUrl('/notifications'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch((err) => {
          console.log('Notifications fetch failed:', err.message);
          return null;
        }) // Load notifications for the provider
      ]);

      // Handle stats data
      if (statsData) {
        setStats(statsData);
      } else {
        console.warn('Failed to load dashboard stats');
        // Provide default stats if API fails
        setStats({
          appointment_stats: {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            today: 0,
            this_week: 0,
            urgent: 0
          },
          recent_appointments: [],
          monthly_trends: [],
          provider_info: { name: 'Provider', specialization: 'N/A', clinic_name: 'N/A', is_verified: false }
        });
      }

      // Handle profile data
      let currentProviderId = 0;
      if (profileData && profileData.profile) {
        setProfile(profileData.profile);
        currentProviderId = profileData.profile.id || 0;
        console.log('Profile loaded successfully, Provider ID:', currentProviderId);
      } else {
        console.error('Failed to load profile data or profile is missing');
        setError('Failed to load health provider profile');
        return;
      }
      
      // Set provider ID for components
      setProviderId(currentProviderId);

      // If no provider ID found, show error
      if (currentProviderId === 0) {
        console.error('No provider ID in profile - health provider account may be incomplete');
        setError('Provider profile incomplete. Please contact administrator.');
        toast.error('Provider profile incomplete. Please contact administrator.');
        return;
      }

      // Handle notifications data
      if (notificationsData && notificationsData.ok) {
        const notificationsJson = await notificationsData.json();
        setNotifications(notificationsJson.notifications || []);
      }

      setError('');
      // Only show success toast if we actually loaded data, not every time
      if (statsData) {
        console.log('Dashboard data loaded successfully');
      }
    } catch (err: unknown) {
      console.error('Failed to load health provider dashboard:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      // TEMPORARY: Even if API fails, set provider ID 1 for demo purposes
      console.log('API failed, using test provider ID 1 for demo');
      setProviderId(1);
      
      // Don't show error toast if we can still show demo data
      if (!stats) {
        toast.error(errorMessage);
      }
    } finally {
      console.log('Dashboard data loading completed');
      setLoading(false);
      isLoadingDataRef.current = false;
    }
  }, []); // Empty dependencies since this function should be stable

  // Role-based access control and initial data loading
  useEffect(() => {
    if (authLoading) return; // Don't do anything while auth is loading

    if (!user) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.push('/login');
      }
      return;
    }
    
    // Check user role safely
    const userType = user.user_type || localStorage.getItem('user_type');
    if (user && userType !== 'health_provider') {
      // Redirect to appropriate dashboard based on user type
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        const dashboardRoutes: Record<string, string> = {
          'admin': '/admin',
          'content_writer': '/content-writer', 
          'parent': '/dashboard',
          'adolescent': '/dashboard'
        };
        const route = dashboardRoutes[userType] || '/dashboard';
        router.push(route);
      }
      return;
    }
    
    // Mark as ready for data loading and load data once
    if (!isInitializedRef.current && user && userType === 'health_provider') {
      isInitializedRef.current = true;
      // Load dashboard data immediately when auth is ready
      loadDashboardData();
    }
  }, [user, authLoading, router]); // Removed function dependencies

  // Set up real-time updates separately
  useEffect(() => {
    // Only set up interval if user is authenticated and is health provider
    const userType = user?.user_type || localStorage.getItem('user_type');
    if (!user || userType !== 'health_provider') return;

    // Clear existing interval first
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      // Double check we're still authenticated
      const currentUser = localStorage.getItem('access_token');
      const currentUserType = localStorage.getItem('user_type');
      if (currentUser && currentUserType === 'health_provider') {
        console.log('Real-time update: refreshing dashboard data');
        loadDashboardData();
      }
    }, 30000);
    
    setRefreshInterval(interval);
    
    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user]); // Only depend on user to prevent excessive re-creation

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const loadAppointments = useCallback(async () => {
    try {
      console.log('Loading appointments with filters:', { statusFilter, priorityFilter, dateFilter, searchTerm });
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      // Defensive checks for filter states
      if (statusFilter && typeof statusFilter === 'string') {
        params.append('status', statusFilter);
      }
      if (priorityFilter && typeof priorityFilter === 'string') {
        params.append('priority', priorityFilter);
      }
      if (dateFilter && typeof dateFilter === 'string') {
        params.append('date_filter', dateFilter);
      }

      // Use proper authenticated endpoint
      const data = await api.healthProvider.getAppointments({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        date_from: dateFrom,
        date_to: dateTo
      });
      let appointmentsData = data.appointments || [];

      // Update total count for pagination
      if (data.total !== undefined) {
        setTotalAppointments(data.total);
      }

      // Apply client-side search if search term is provided
      if (searchTerm.trim()) {
        appointmentsData = appointmentsData.filter((appointment: Appointment) =>
          appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.patient_phone?.includes(searchTerm) ||
          appointment.patient_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      console.log('Loaded appointments:', appointmentsData.length);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toast.error('Failed to load appointments');
    }
  }, [statusFilter, priorityFilter, dateFilter, searchTerm]);

  const loadUnassignedAppointments = useCallback(async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping unassigned appointments load - invalid provider ID:', providerId);
      return;
    }

    try {
      console.log('Loading unassigned appointments for provider:', providerId);
      // Use proper authenticated endpoint
      const data = await api.healthProvider.getUnassignedAppointments();
      console.log('Loaded unassigned appointments:', data.appointments?.length || 0);
      setUnassignedAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to load unassigned appointments:', err);
      toast.error('Failed to load available appointments');
    }
  }, [providerId]);

  const loadPatients = useCallback(async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping patients load - invalid provider ID:', providerId);
      return;
    }

    try {
      console.log('Loading patients for provider:', providerId);
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/patients'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load patients');
      console.log('Loaded patients:', data.patients.length);
      setPatients(data.patients);
    } catch (err) {
      console.error('Failed to load patients:', err);
      toast.error('Failed to load patients');
    }
  }, [providerId]);

  const loadSchedule = useCallback(async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping schedule load - invalid provider ID:', providerId);
      return;
    }

    try {
      console.log('Loading schedule for provider:', providerId);
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const response = await fetch(buildHealthProviderApiUrl(`/test/schedule?provider_id=${providerId}&start_date=${today.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`), {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load schedule');
      console.log('Loaded schedule:', Object.keys(data.schedule).length, 'days');
      setSchedule(data.schedule);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      toast.error('Failed to load schedule');
    }
  }, [providerId]);

  const claimAppointment = useCallback(async (appointmentId: number) => {
    try {
      // Use proper authenticated endpoint
      await api.healthProvider.claimAppointment(appointmentId);
      toast.success('Appointment claimed successfully');
      loadUnassignedAppointments();
      loadAppointments();
      loadDashboardData();
    } catch (err) {
      console.error('Failed to claim appointment:', err);
      toast.error('Failed to claim appointment');
    }
  }, [loadUnassignedAppointments, loadAppointments, loadDashboardData]);

  const updateAppointment = useCallback(async (appointmentId: number, updates: Record<string, unknown>) => {
    try {
      // TEMPORARY: Use test endpoint for demo
      const response = await fetch(buildHealthProviderApiUrl(`/test/appointments/${appointmentId}/update`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      await handleApiResponse(response, 'Failed to update appointment');
      toast.success('Appointment updated successfully');
      loadAppointments();
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update appointment:', err);
      toast.error('Failed to update appointment');
    }
  }, [loadAppointments, loadDashboardData]);

  const updateProfile = async (profileUpdates: Partial<ProviderProfile>) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileUpdates)
      });

      await handleApiResponse(response, 'Failed to update profile');
      toast.success('Profile updated successfully');
      setProfile(prev => prev ? { ...prev, ...profileUpdates } : null);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'completed': return 'bg-info';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning';
      case 'normal': return 'bg-primary';
      case 'low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  // Load tab-specific data when tab changes
  useEffect(() => {
    console.log('Tab changed to:', activeTab, 'Provider ID:', providerId);
    // Only make API calls if we have a valid provider ID and user is authenticated
    const userType = user?.user_type || localStorage.getItem('user_type');
    if (providerId > 0 && user && userType === 'health_provider') {
      // Use setTimeout to debounce rapid tab changes
      const timeoutId = setTimeout(() => {
        if (activeTab === 'appointments') {
          loadAppointments();
        } else if (activeTab === 'unassigned') {
          loadUnassignedAppointments();
        } else if (activeTab === 'patients') {
          loadPatients();
        } else if (activeTab === 'schedule') {
          loadSchedule();
        }
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log('Skipping tab data load - not authenticated or provider ID not set');
    }
  }, [activeTab, providerId, user]); // Keep minimal dependencies

  // Handle filter changes separately to prevent excessive re-renders
  useEffect(() => {
    // Only run if we're on appointments tab, have a provider ID, and user is authenticated
    const userType = user?.user_type || localStorage.getItem('user_type');
    if (activeTab === 'appointments' && providerId > 0 && user && userType === 'health_provider') {
      const debounceTimeout = setTimeout(() => {
        console.log('Filter changed, reloading appointments with:', { statusFilter, priorityFilter, dateFilter, searchTerm });
        loadAppointments();
      }, 500); // Increased debounce to 500ms to prevent rapid calls

      return () => clearTimeout(debounceTimeout);
    }
  }, [statusFilter, priorityFilter, dateFilter, searchTerm, activeTab, providerId, user]); // Added necessary dependencies

  // Show loading only during initial load, not for refreshes
  if (loading && !stats) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading health provider dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Health Provider Dashboard</h1>
          {profile && (
            <small className="text-muted">
              Welcome back, Dr. {profile.name} | {profile.specialization}
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          {/* Enhanced Notifications */}
          <NotificationBell />
          
          {/* Profile Button */}
          <button 
            className="btn btn-outline-info"
            onClick={() => setShowProfileModal(true)}
          >
            <i className="fas fa-user-md me-1"></i>
            Profile
          </button>
          
          {/* Logout Button */}
          <button 
            className="btn btn-outline-secondary"
            onClick={() => {
              if (refreshInterval) clearInterval(refreshInterval);
              localStorage.removeItem('access_token');
              router.push('/login');
            }}
          >
            <i className="fas fa-sign-out-alt me-1"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {stats && stats.provider_info && !stats.provider_info.is_verified && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Your health provider account is pending verification. Some features may be limited until verification is complete.
        </div>
      )}

      {/* Navigation */}
      <div className="card mb-4">
        <div className="card-body">
          <style jsx>{`
            .nav-link {
              border: none;
              background: none;
              padding: 0.5rem 1rem;
              color: #6c757d;
              text-decoration: none;
              display: block;
              border: 1px solid transparent;
              border-top-left-radius: 0.375rem;
              border-top-right-radius: 0.375rem;
            }
            .nav-link:hover {
              border-color: #e9ecef #e9ecef #dee2e6;
              color: #495057;
            }
            .nav-link.active {
              color: #495057;
              background-color: #fff;
              border-color: #dee2e6 #dee2e6 #fff;
            }
          `}</style>
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-tachometer-alt me-1"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} 
                onClick={() => setActiveTab('appointments')}
              >
                <i className="fas fa-calendar-check me-1"></i>
                My Appointments
                {stats && stats.appointment_stats.pending > 0 && (
                  <span className="badge bg-warning text-dark ms-2">
                    {stats.appointment_stats.pending}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'unassigned' ? 'active' : ''}`} 
                onClick={() => setActiveTab('unassigned')}
              >
                <i className="fas fa-clipboard-list me-1"></i>
                Available Appointments
                {unassignedAppointments.length > 0 && (
                  <span className="badge bg-danger ms-2">{unassignedAppointments.length}</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'schedule' ? 'active' : ''}`} 
                onClick={() => setActiveTab('schedule')}
              >
                <i className="fas fa-calendar-week me-1"></i>
                Schedule
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'availability' ? 'active' : ''}`} 
                onClick={() => setActiveTab('availability')}
              >
                <i className="fas fa-calendar-cog me-1"></i>
                Availability
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`} 
                onClick={() => setActiveTab('patients')}
              >
                <i className="fas fa-users me-1"></i>
                Patients
                {patients.length > 0 && (
                  <span className="badge bg-info ms-2">{patients.length}</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} 
                onClick={() => setActiveTab('analytics')}
              >
                <i className="fas fa-chart-line me-1"></i>
                Analytics
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button"
                className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`} 
                onClick={() => setActiveTab('notifications')}
              >
                <i className="fas fa-envelope me-1"></i>
                Send Notifications
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <StatCard
                title="Total Appointments"
                value={stats.appointment_stats.total}
                icon="fa-calendar-check"
                colorClass="bg-primary"
                subtitle="All time"
                onClick={() => setActiveTab('appointments')}
              />
            </div>
            <div className="col-md-3 mb-3">
              <StatCard
                title="Pending"
                value={stats.appointment_stats.pending}
                icon="fa-clock"
                colorClass="bg-warning"
                subtitle="Awaiting confirmation"
                onClick={() => {
                  setActiveTab('appointments');
                  setStatusFilter('pending');
                }}
              />
            </div>
            <div className="col-md-3 mb-3">
              <StatCard
                title="Today"
                value={stats.appointment_stats.today}
                icon="fa-calendar-day"
                colorClass="bg-success"
                subtitle="Scheduled for today"
                onClick={() => {
                  setActiveTab('appointments');
                  setDateFilter('today');
                }}
              />
            </div>
            <div className="col-md-3 mb-3">
              <StatCard
                title="Urgent"
                value={stats.appointment_stats.urgent}
                icon="fa-exclamation-triangle"
                colorClass="bg-danger"
                subtitle="Requires immediate attention"
                onClick={() => {
                  setActiveTab('appointments');
                  setPriorityFilter('urgent');
                }}
              />
            </div>
          </div>

          {/* Enhanced Dashboard Widgets */}
          <div className="row mb-4">
            <div className="col-lg-8 mb-4">
              <AnalyticsWidget providerId={providerId} />
            </div>
            <div className="col-lg-4 mb-4">
              <AvailabilityWidget providerId={providerId} />
            </div>
          </div>
          {/* Recent Appointments and Monthly Trends */}
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Recent Appointments</h5>
                </div>
                <div className="card-body">
                  {stats.recent_appointments.map(appointment => (
                    <div key={appointment.id} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                      <div>
                        <strong>{appointment.patient_name}</strong>
                        <br />
                        <small className="text-muted">{appointment.issue.substring(0, 50)}...</small>
                        <br />
                        <span className={`badge bg-${
                          appointment.priority === 'urgent' ? 'danger' : 
                          appointment.priority === 'high' ? 'warning' : 'secondary'
                        } me-2`}>
                          {appointment.priority}
                        </span>
                        <span className={`badge bg-${
                          appointment.status === 'confirmed' ? 'success' : 
                          appointment.status === 'pending' ? 'warning' : 'secondary'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <small>{new Date(appointment.created_at).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Monthly Performance</h5>
                </div>
                <div className="card-body">
                  {stats.monthly_trends.map((month, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{month.month}</strong>
                      </div>
                      <div className="text-end">
                        <div>{month.total_appointments} total</div>
                        <small className="text-muted">{month.completed_appointments} completed</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div>
          {/* Filters and Search */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Status Filter</label>
                  <select 
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Priority Filter</label>
                  <select 
                    className="form-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Date Filter</label>
                  <select 
                    className="form-select"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Search</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <button 
                  className="btn btn-outline-secondary btn-sm me-2"
                  onClick={() => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setDateFilter('');
                    setSearchTerm('');
                  }}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear Filters
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={loadAppointments}
                >
                  <i className="fas fa-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Appointments</h5>
              <span className="badge bg-primary">{appointments.length} appointments</span>
            </div>
            <div className="card-body">
              {appointments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Patient</th>
                        <th>Issue</th>
                        <th>Date/Time</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(appointment => (
                        <tr key={appointment.id} className={appointment.priority === 'urgent' ? 'table-warning' : ''}>
                          <td>
                            <div>
                              <strong>{appointment.patient_name}</strong>
                              <br />
                              <small className="text-muted">
                                <i className="fas fa-phone me-1"></i>
                                {appointment.patient_phone}
                              </small>
                              {appointment.patient_email && (
                                <>
                                  <br />
                                  <small className="text-muted">
                                    <i className="fas fa-envelope me-1"></i>
                                    {appointment.patient_email}
                                  </small>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px' }}>
                          {appointment.issue.length > 100 ? (
                                <>
                                  {appointment.issue.substring(0, 100)}...
                                  <br />
                                  <button 
                                    className="btn btn-sm btn-link p-0"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setShowAppointmentModal(true);
                                    }}
                                  >
                                    Read more
                                  </button>
                                </>
                              ) : appointment.issue}
                            </div>
                          </td>
                          <td>
                            <div>
                              {formatDate(appointment.appointment_date)}
                              {appointment.preferred_date && !appointment.appointment_date && (
                                <div>
                                  <small className="text-muted">
                                    Preferred: {formatDate(appointment.preferred_date)}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getPriorityBadgeClass(appointment.priority)}`}>
                              {appointment.priority}
                              {appointment.priority === 'urgent' && <i className="fas fa-exclamation-triangle ms-1"></i>}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {appointment.status === 'pending' && (
                                <button 
                                  className="btn btn-outline-success"
                                  onClick={() => updateAppointment(appointment.id, { status: 'confirmed' })}
                                  title="Confirm Appointment"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <button 
                                  className="btn btn-outline-info"
                                  onClick={() => updateAppointment(appointment.id, { status: 'completed' })}
                                  title="Mark as Completed"
                                >
                                  <i className="fas fa-check-double"></i>
                                </button>
                              )}
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowAppointmentModal(true);
                                }}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => updateAppointment(appointment.id, { status: 'cancelled' })}
                                  title="Cancel Appointment"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h6>No appointments found</h6>
                  <p className="text-muted">
                    {searchTerm 
                      ? 'Try adjusting your filters'
                      : 'You don&apos;t have any appointments yet'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Appointments Tab */}
      {activeTab === 'unassigned' && (
        <div className="card">
          <div className="card-header">
            <h5>Available Appointments</h5>
            <small className="text-muted">Claim appointments that match your expertise</small>
          </div>
          <div className="card-body">
            {unassignedAppointments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Issue</th>
                      <th>Preferred Date</th>
                      <th>Priority</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td><strong>{appointment.patient_name}</strong></td>
                        <td>{appointment.issue.substring(0, 100)}...</td>
                        <td>
                          {appointment.preferred_date ? 
                            new Date(appointment.preferred_date).toLocaleDateString() : 
                            'Flexible'
                          }
                        </td>
                        <td>
                          <span className={`badge bg-${
                            appointment.priority === 'urgent' ? 'danger' : 
                            appointment.priority === 'high' ? 'warning' : 'secondary'
                          }`}>
                            {appointment.priority}
                          </span>
                        </td>
                        <td>{new Date(appointment.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => claimAppointment(appointment.id)}
                          >
                            Claim Appointment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p>No unassigned appointments available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="card">
          <div className="card-header">
            <h5>Weekly Schedule</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(schedule).map(([date, dayAppointments]) => (
                <div key={date} className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h6>
                    </div>
                    <div className="card-body">
                      {dayAppointments.length > 0 ? (
                        dayAppointments.map(appointment => (
                          <div key={appointment.id} className="mb-2 p-2 border rounded">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong>{appointment.time}</strong>
                                <br />
                                <small>{appointment.patient_name}</small>
                                <br />
                                <span className={`badge bg-${
                                  appointment.status === 'confirmed' ? 'success' : 'warning'
                                } me-1`}>
                                  {appointment.status}
                                </span>
                                {appointment.priority === 'urgent' && (
                                  <span className="badge bg-danger">Urgent</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted text-center">No appointments</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="card">
          <div className="card-header">
            <h5>My Patients</h5>
          </div>
          <div className="card-body">
            {patients.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Total Appointments</th>
                      <th>Last Visit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(patient => (
                      <tr key={patient.id}>
                        <td><strong>{patient.name}</strong></td>
                        <td>
                          <div>
                            {patient.phone_number}
                            <br />
                            <small>{patient.email}</small>
                          </div>
                        </td>
                        <td>{patient.total_appointments}</td>
                        <td>
                          {patient.last_appointment ? 
                            new Date(patient.last_appointment).toLocaleDateString() : 
                            'No visits'
                          }
                        </td>
                        <td>
                          {patient.last_appointment_status && (
                            <span className={`badge bg-${
                              patient.last_appointment_status === 'completed' ? 'success' : 'warning'
                            }`}>
                              {patient.last_appointment_status}
                            </span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <p>No patients yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && profile && (
        <div>
          <div className="row">
            <div className="col-12">
              <AnalyticsWidget providerId={providerId} />
            </div>
          </div>
          
          <div className="row mt-4">
            <div className="col-lg-6">
              <AvailabilityWidget providerId={providerId} />
            </div>
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Quick Actions
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => setActiveTab('appointments')}
                    >
                      <i className="fas fa-calendar-check me-2"></i>
                      View All Appointments
                    </button>
                    <button 
                      className="btn btn-outline-success"
                      onClick={() => setActiveTab('unassigned')}
                    >
                      <i className="fas fa-clipboard-list me-2"></i>
                      Check Available Appointments
                    </button>
                    <button 
                      className="btn btn-outline-info"
                      onClick={() => setActiveTab('patients')}
                    >
                      <i className="fas fa-users me-2"></i>
                      Manage Patients
                    </button>
                    <button 
                      className="btn btn-outline-warning"
                      onClick={() => setShowProfileModal(true)}
                    >
                      <i className="fas fa-user-cog me-2"></i>
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Management Tab */}
      {activeTab === 'availability' && providerId > 0 && (
        <div>
          <AvailabilityManagement providerId={providerId} />
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <h5><i className="fas fa-envelope me-2"></i>Send Notifications to Patients</h5>
            <small className="text-muted">Send real-time notifications to your patients and their families</small>
          </div>
          <div className="card-body">
            <NotificationSender />
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className={`modal fade ${showAppointmentModal ? 'show' : ''}`} 
             style={{ display: showAppointmentModal ? 'block' : 'none' }}
             tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Appointment Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAppointmentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Patient Information</h6>
                    <p><strong>Name:</strong> {selectedAppointment.patient_name}</p>
                    <p><strong>Phone:</strong> {selectedAppointment.patient_phone}</p>
                    <p><strong>Email:</strong> {selectedAppointment.patient_email}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Appointment Details</h6>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${getStatusBadgeClass(selectedAppointment.status)} ms-2`}>
                        {selectedAppointment.status}
                      </span>
                    </p>
                    <p><strong>Priority:</strong> 
                      <span className={`badge ${getPriorityBadgeClass(selectedAppointment.priority)} ms-2`}>
                        {selectedAppointment.priority}
                      </span>
                    </p>
                    <p><strong>Scheduled:</strong> {formatDate(selectedAppointment.appointment_date)}</p>
                    {selectedAppointment.preferred_date && (
                      <p><strong>Preferred Date:</strong> {formatDate(selectedAppointment.preferred_date)}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <h6>Patient's Issue</h6>
                  <div className="border rounded p-3 bg-light">
                    {selectedAppointment.issue}
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="mt-3">
                    <h6>Patient Notes</h6>
                    <div className="border rounded p-3 bg-light">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <h6>Provider Notes</h6>
                  <textarea 
                    className="form-control"
                    rows={3}
                    placeholder="Add your notes here..."
                    value={selectedAppointment.provider_notes || ''}
                    onChange={(e) => setSelectedAppointment({
                      ...selectedAppointment,
                      provider_notes: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    updateAppointment(selectedAppointment.id, {
                      provider_notes: selectedAppointment.provider_notes
                    });
                    setShowAppointmentModal(false);
                  }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profile && (
        <div className={`modal fade ${showProfileModal ? 'show' : ''}`} 
             style={{ display: showProfileModal ? 'block' : 'none' }}
             tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Provider Profile</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowProfileModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const profileUpdates = {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    specialization: formData.get('specialization') as string,
                    clinic_name: formData.get('clinic_name') as string,
                    clinic_address: formData.get('clinic_address') as string,
                    phone: formData.get('phone') as string,
                  };
                  updateProfile(profileUpdates);
                }}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="name"
                          defaultValue={profile.name}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          name="email"
                          defaultValue={profile.email}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Specialization</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="specialization"
                          defaultValue={profile.specialization}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Clinic Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="clinic_name"
                          defaultValue={profile.clinic_name}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Clinic Address</label>
                        <textarea 
                          className="form-control" 
                          name="clinic_address"
                          rows={2}
                          defaultValue={profile.clinic_address}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          name="phone"
                          defaultValue={profile.phone}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">License Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      defaultValue={profile.license_number}
                      disabled
                    />
                    <small className="text-muted">Contact administration to update license number</small>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center">
                      <span className="me-2">Verification Status:</span>
                      {profile.is_verified ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check-circle me-1"></i>
                          Verified
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          <i className="fas fa-clock me-1"></i>
                          Pending Verification
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowProfileModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showAppointmentModal || showProfileModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}

export default function HealthProviderDashboard() {
  return <HealthProviderDashboardContent />;
}
