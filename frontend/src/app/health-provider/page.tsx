'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { buildHealthProviderApiUrl } from '../../utils/apiConfig';

// Add CSS styles for provider cards and dropdown
const providerCardStyles = `
  .provider-card {
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
  }
  
  .provider-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    border-color: #007bff;
  }
  
  .provider-avatar {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    color: white;
  }
  
  .time-slot-btn {
    transition: all 0.2s ease;
  }
  
  .time-slot-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }
  
  .provider-dropdown .dropdown-menu {
    border: 1px solid #dee2e6;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-radius: 0.375rem;
  }
  
  .provider-dropdown .dropdown-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.2s ease;
  }
  
  .provider-dropdown .dropdown-item:hover {
    background-color: #f8f9fa;
  }
  
  .provider-dropdown .dropdown-item:last-child {
    border-bottom: none;
  }
  
  .search-highlight {
    background-color: #fff3cd;
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

// Inject styles
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = providerCardStyles;
  document.head.appendChild(styleSheet);
}

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
  };
}

interface Appointment {
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

interface ProviderProfile {
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

interface PatientHistory {
  patient: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
  appointments: Array<{
    id: number;
    issue: string;
    appointment_date: string | null;
    status: string;
    priority: string;
    notes: string;
    provider_notes: string;
    created_at: string;
  }>;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

interface Analytics {
  period_days: number;
  total_appointments: number;
  status_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  daily_counts: Record<string, number>;
  average_response_time_hours: number;
  completion_rate: number;
}

interface AvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Availability {
  monday: AvailabilitySlot;
  tuesday: AvailabilitySlot;
  wednesday: AvailabilitySlot;
  thursday: AvailabilitySlot;
  friday: AvailabilitySlot;
  saturday: AvailabilitySlot;
  sunday: AvailabilitySlot;
}

interface ProviderInfo {
  id: number;
  name: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  phone: string;
  email: string;
  is_verified: boolean;
  rating?: number;
  total_appointments?: number;
  availability_summary?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  date: string;
  is_available: boolean;
  duration?: number;
  provider_id: number;
}

export default function HealthProviderDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unassignedAppointments, setUnassignedAppointments] = useState<UnassignedAppointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Provider slot selection states
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [providerTimeSlots, setProviderTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showProviderSlotsModal, setShowProviderSlotsModal] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  
  // Provider search and filter states
  const [providerSearchTerm, setProviderSearchTerm] = useState<string>('');
  const [specializationFilter, setSpecializationFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modal states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form states
  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: '',
    status: '',
    priority: '',
    provider_notes: ''
  });

  const router = useRouter();
  const { user, loading: authLoading, hasRole, getDashboardRoute } = useAuth();

  // Role-based access control
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && !hasRole('health_provider')) {
      // Redirect to appropriate dashboard based on user type
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }
    
    if (!authLoading && user && hasRole('health_provider')) {
      loadDashboardData();
    }
  }, [user, authLoading, router, hasRole, getDashboardRoute]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const statsResponse = await fetch(buildHealthProviderApiUrl('/dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const statsData = await handleApiResponse(statsResponse, 'Failed to load dashboard stats');
      setStats(statsData);

      setError('');
    } catch (err: any) {
      console.error('Failed to load health provider dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = useCallback(async () => {
    try {
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

      const response = await fetch(buildHealthProviderApiUrl(`/appointments?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load appointments');
      setAppointments(data.appointments);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  }, [statusFilter, priorityFilter, dateFilter]);

  const loadUnassignedAppointments = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/appointments/unassigned'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load unassigned appointments');
      setUnassignedAppointments(data.appointments);
    } catch (err) {
      console.error('Failed to load unassigned appointments:', err);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/patients'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load patients');
      setPatients(data.patients);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const response = await fetch(buildHealthProviderApiUrl(`/schedule?start_date=${today.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load schedule');
      setSchedule(data.schedule);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load profile');
      setProfile(data.profile);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  const loadPatientHistory = async (patientId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl(`/patients/${patientId}/history`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load patient history');
      setPatientHistory(data);
      setShowPatientHistoryModal(true);
    } catch (err) {
      console.error('Failed to load patient history:', err);
      setError('Failed to load patient history');
    }
  };

  const loadAnalytics = useCallback(async (days: number = 30) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl(`/analytics?days=${days}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load analytics');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/availability'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await handleApiResponse(response, 'Failed to load availability');
      setAvailability(data.availability);
    } catch (err) {
      console.error('Failed to load availability:', err);
      // Set default availability if none exists
      setAvailability({
        monday: { day: 'monday', start_time: '09:00', end_time: '17:00', is_available: true },
        tuesday: { day: 'tuesday', start_time: '09:00', end_time: '17:00', is_available: true },
        wednesday: { day: 'wednesday', start_time: '09:00', end_time: '17:00', is_available: true },
        thursday: { day: 'thursday', start_time: '09:00', end_time: '17:00', is_available: true },
        friday: { day: 'friday', start_time: '09:00', end_time: '17:00', is_available: true },
        saturday: { day: 'saturday', start_time: '09:00', end_time: '12:00', is_available: false },
        sunday: { day: 'sunday', start_time: '09:00', end_time: '12:00', is_available: false }
      });
    }
  }, []);

  const claimAppointment = async (appointmentId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl(`/appointments/${appointmentId}/claim`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await handleApiResponse(response, 'Failed to claim appointment');
      loadUnassignedAppointments();
      loadAppointments();
      loadDashboardData();
    } catch (err) {
      console.error('Failed to claim appointment:', err);
    }
  };

  const updateAppointment = async (appointmentId: number, updates: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl(`/appointments/${appointmentId}/update`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      await handleApiResponse(response, 'Failed to update appointment');
      loadAppointments();
      loadDashboardData();
      setSuccessMessage('Appointment updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update appointment:', err);
      setError('Failed to update appointment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateProfile = async (profileData: Partial<ProviderProfile>) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      await handleApiResponse(response, 'Failed to update profile');
      loadProfile();
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateAvailability = async (availabilityData: Availability) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/availability'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availability: availabilityData })
      });

      await handleApiResponse(response, 'Failed to update availability');
      setAvailability(availabilityData);
      setSuccessMessage('Availability updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAvailabilityModal(false);
    } catch (err) {
      console.error('Failed to update availability:', err);
      setError('Failed to update availability');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openAppointmentModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      appointment_date: appointment.appointment_date ? new Date(appointment.appointment_date).toISOString().slice(0, 16) : '',
      status: appointment.status,
      priority: appointment.priority,
      provider_notes: appointment.provider_notes || ''
    });
    setShowAppointmentModal(true);
  };

  const showPatientInfo = (appointment: Appointment) => {
    // Find patient by matching name or create a patient object from appointment data
    let patient = patients.find(p => p.name === appointment.patient_name);
    
    if (!patient) {
      // Create a temporary patient object from appointment data
      patient = {
        id: 0, // temporary ID
        name: appointment.patient_name,
        phone_number: appointment.patient_phone,
        email: appointment.patient_email,
        total_appointments: 1,
        last_appointment: appointment.appointment_date,
        last_appointment_status: appointment.status
      };
    }
    
    setSelectedPatient(patient);
    setShowPatientInfoModal(true);
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    const updates: any = {};
    if (appointmentForm.appointment_date) {
      updates.appointment_date = new Date(appointmentForm.appointment_date).toISOString();
    }
    if (appointmentForm.status !== selectedAppointment.status) {
      updates.status = appointmentForm.status;
    }
    if (appointmentForm.priority !== selectedAppointment.priority) {
      updates.priority = appointmentForm.priority;
    }
    if (appointmentForm.provider_notes !== selectedAppointment.provider_notes) {
      updates.provider_notes = appointmentForm.provider_notes;
    }

    await updateAppointment(selectedAppointment.id, updates);
    setShowAppointmentModal(false);
  };

  // Provider selection functions
  const loadAvailableProviders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/appointments/providers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const providers = await handleApiResponse(response, 'Failed to load providers');
      setAvailableProviders(providers);
      setFilteredProviders(providers);
    } catch (err) {
      console.error('Failed to load providers:', err);
      setError('Failed to load available providers');
    }
  };

  // Filter and search providers
  const filterProviders = () => {
    let filtered = availableProviders.filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
                          provider.specialization.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
                          provider.clinic_name.toLowerCase().includes(providerSearchTerm.toLowerCase());
      
      const matchesSpecialization = !specializationFilter || provider.specialization === specializationFilter;
      
      const matchesLocation = !locationFilter || 
                            provider.clinic_address.toLowerCase().includes(locationFilter.toLowerCase()) ||
                            provider.clinic_name.toLowerCase().includes(locationFilter.toLowerCase());
      
      return matchesSearch && matchesSpecialization && matchesLocation;
    });
    
    setFilteredProviders(filtered);
    
    // Clear selected provider if it's not in filtered results
    if (selectedProvider && !filtered.some(p => p.id === selectedProvider.id)) {
      setSelectedProvider(null);
      setShowProviderDropdown(false);
    }
  };

  // Get unique specializations for filter
  const getUniqueSpecializations = () => {
    return [...new Set(availableProviders.map(provider => provider.specialization))];
  };

  // Get unique locations for filter
  const getUniqueLocations = () => {
    return [...new Set(availableProviders.map(provider => provider.clinic_name))];
  };

  const loadProviderTimeSlots = async (providerId: number, date: string) => {
    try {
      setLoadingTimeSlots(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl(`/appointments/providers/${providerId}/slots?date=${date}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const timeSlots = await handleApiResponse(response, 'Failed to load time slots');
      setProviderTimeSlots(timeSlots);
    } catch (err) {
      console.error('Failed to load time slots:', err);
      setError('Failed to load provider time slots');
      setProviderTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleProviderClick = async (provider: ProviderInfo) => {
    setSelectedProvider(provider);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowProviderSlotsModal(true);
    await loadProviderTimeSlots(provider.id, new Date().toISOString().split('T')[0]);
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedProvider) {
      await loadProviderTimeSlots(selectedProvider.id, newDate);
    }
  };

  const handleTimeSlotSelection = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const bookSelectedSlot = async () => {
    if (!selectedProvider || !selectedTimeSlot || !selectedDate) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/appointments'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          appointment_date: `${selectedDate}T${selectedTimeSlot.time}`,
          patient_notes: `Appointment with ${selectedProvider.name} at ${selectedProvider.clinic_name}`
        })
      });

      await handleApiResponse(response, 'Failed to book appointment');
      setSuccessMessage(`Appointment booked successfully with ${selectedProvider.name} on ${selectedDate} at ${selectedTimeSlot.time}`);
      setShowProviderSlotsModal(false);
      setSelectedProvider(null);
      setSelectedTimeSlot(null);
      setProviderTimeSlots([]);
      
      if (activeTab === 'appointments') {
        loadAppointments();
      }
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setError('Failed to book appointment');
    }
  };

  // Load available providers on component mount
  useEffect(() => {
    loadAvailableProviders();
  }, []);

  // Filter providers when search term or filters change
  useEffect(() => {
    filterProviders();
  }, [availableProviders, providerSearchTerm, specializationFilter, locationFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowProviderDropdown(false);
      }
    };

    if (showProviderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProviderDropdown]);

  useEffect(() => {
    // Ensure all filter states are initialized before proceeding
    if (typeof statusFilter === 'undefined' || typeof priorityFilter === 'undefined' || typeof dateFilter === 'undefined') {
      return;
    }
    
    if (activeTab === 'appointments') {
      loadAppointments();
    } else if (activeTab === 'unassigned') {
      loadUnassignedAppointments();
    } else if (activeTab === 'patients') {
      loadPatients();
    } else if (activeTab === 'schedule') {
      loadSchedule();
    } else if (activeTab === 'profile') {
      loadProfile();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'availability') {
      loadAvailability();
    }
  }, [activeTab, loadAppointments, loadUnassignedAppointments, loadPatients, loadSchedule, loadProfile, loadAnalytics, loadAvailability]);

  // Auto-hide messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
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
      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Health Provider Dashboard</h1>
          {stats && (
            <p className="text-muted mb-0">
              {stats.provider_info.specialization} at {stats.provider_info.clinic_name}
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowProfileModal(true)}
          >
            <i className="fas fa-user-edit me-2"></i>
            Profile
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => {
              localStorage.removeItem('access_token');
              router.push('/login');
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {stats && !stats.provider_info.is_verified && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Your health provider account is pending verification. Some features may be limited until verification is complete.
        </div>
      )}

      {/* Navigation */}
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
                <i className="fas fa-chart-line me-1"></i>
                Overview
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
                <i className="fas fa-calendar-check me-1"></i>
                My Appointments
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'unassigned' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('unassigned');
                }}
              >
                <i className="fas fa-calendar-plus me-1"></i>
                Available Appointments
                {unassignedAppointments.length > 0 && (
                  <span className="badge bg-danger ms-2">{unassignedAppointments.length}</span>
                )}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'schedule' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('schedule');
                }}
              >
                <i className="fas fa-calendar me-1"></i>
                Schedule
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('patients');
                }}
              >
                <i className="fas fa-users me-1"></i>
                Patients
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'book-appointment' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('book-appointment');
                }}
              >
                <i className="fas fa-plus-circle me-1"></i>
                Book Appointment
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('profile');
                }}
              >
                <i className="fas fa-user-md me-1"></i>
                Profile
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('analytics');
                }}
              >
                <i className="fas fa-chart-bar me-1"></i>
                Analytics
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'availability' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('availability');
                }}
              >
                <i className="fas fa-clock me-1"></i>
                Availability
              </a>
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
              <div className="card bg-primary text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.appointment_stats.total}</h4>
                      <p className="mb-0">Total Appointments</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-calendar-check"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.appointment_stats.pending}</h4>
                      <p className="mb-0">Pending</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-clock"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.appointment_stats.today}</h4>
                      <p className="mb-0">Today</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-calendar-day"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-danger text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.appointment_stats.urgent}</h4>
                      <p className="mb-0">Urgent</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                  </div>
                </div>
              </div>
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
          {/* Filters */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
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
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>My Appointments</h5>
            </div>
            <div className="card-body">
              {appointments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
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
                        <tr key={appointment.id}>
                          <td>
                            <div>
                              <strong>{appointment.patient_name}</strong>
                              <br />
                              <small>{appointment.patient_phone}</small>
                            </div>
                          </td>
                          <td>{appointment.issue.substring(0, 100)}...</td>
                          <td>
                            {appointment.appointment_date ? 
                              new Date(appointment.appointment_date).toLocaleString() : 
                              'Not scheduled'
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
                          <td>
                            <span className={`badge bg-${
                              appointment.status === 'confirmed' ? 'success' : 
                              appointment.status === 'pending' ? 'warning' : 
                              appointment.status === 'completed' ? 'info' : 'secondary'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => openAppointmentModal(appointment)}
                                title="Edit Appointment"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              {appointment.status === 'pending' && (
                                <button 
                                  className="btn btn-outline-success"
                                  onClick={() => updateAppointment(appointment.id, { status: 'confirmed' })}
                                  title="Confirm"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <button 
                                  className="btn btn-outline-info"
                                  onClick={() => updateAppointment(appointment.id, { status: 'completed' })}
                                  title="Mark Complete"
                                >
                                  <i className="fas fa-check-double"></i>
                                </button>
                              )}
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => showPatientInfo(appointment)}
                                title="Patient Info"
                              >
                                <i className="fas fa-user"></i>
                              </button>
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
                  <p>No appointments found</p>
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
                            <i className="fas fa-phone me-1"></i>{patient.phone_number}
                            <br />
                            <small><i className="fas fa-envelope me-1"></i>{patient.email}</small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info">{patient.total_appointments}</span>
                        </td>
                        <td>
                          {patient.last_appointment ? 
                            new Date(patient.last_appointment).toLocaleDateString() : 
                            <span className="text-muted">No visits</span>
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
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => loadPatientHistory(patient.id)}
                          >
                            <i className="fas fa-eye me-1"></i>
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

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5>Provider Profile</h5>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowProfileModal(true)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Profile
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Full Name:</strong>
                    <p>{profile.name}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Email:</strong>
                    <p>{profile.email}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>License Number:</strong>
                    <p>{profile.license_number}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Specialization:</strong>
                    <p>{profile.specialization}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Clinic Name:</strong>
                    <p>{profile.clinic_name}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong>
                    <p>{profile.phone}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-12">
                    <strong>Clinic Address:</strong>
                    <p>{profile.clinic_address}</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Verification Status:</strong>
                    <p>
                      <span className={`badge bg-${profile.is_verified ? 'success' : 'warning'}`}>
                        {profile.is_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong>Member Since:</strong>
                    <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h6>Quick Stats</h6>
              </div>
              <div className="card-body">
                {stats && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Appointments:</span>
                      <strong>{stats.appointment_stats.total}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Completed:</span>
                      <strong>{stats.appointment_stats.completed}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Success Rate:</span>
                      <strong>
                        {stats.appointment_stats.total > 0 
                          ? Math.round((stats.appointment_stats.completed / stats.appointment_stats.total) * 100)
                          : 0
                        }%
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && availability && (
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5>
                  <i className="fas fa-clock me-2"></i>
                  Weekly Availability Schedule
                </h5>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAvailabilityModal(true)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Availability
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  {Object.entries(availability).map(([day, schedule]) => (
                    <div key={day} className="col-md-6 col-lg-4 mb-3">
                      <div className={`card h-100 ${schedule.is_available ? 'border-success' : 'border-secondary'}`}>
                        <div className={`card-header ${schedule.is_available ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                          <h6 className="mb-0 text-capitalize">
                            <i className={`fas ${schedule.is_available ? 'fa-check-circle' : 'fa-times-circle'} me-2`}></i>
                            {day}
                          </h6>
                        </div>
                        <div className="card-body">
                          {schedule.is_available ? (
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">Start Time:</span>
                                <strong>{schedule.start_time}</strong>
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">End Time:</span>
                                <strong>{schedule.end_time}</strong>
                              </div>
                              <div className="mt-2">
                                <small className="badge bg-success">
                                  <i className="fas fa-business-time me-1"></i>
                                  Available
                                </small>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <i className="fas fa-bed fa-2x text-muted mb-2"></i>
                              <p className="text-muted mb-0">Not Available</p>
                              <small className="badge bg-secondary">Day Off</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>
                          <i className="fas fa-info-circle me-2 text-info"></i>
                          Availability Summary
                        </h6>
                        <div className="row">
                          <div className="col-md-4">
                            <strong>Available Days:</strong>
                            <p className="mb-1">
                              {Object.values(availability).filter(schedule => schedule.is_available).length} days
                            </p>
                          </div>
                          <div className="col-md-4">
                            <strong>Total Weekly Hours:</strong>
                            <p className="mb-1">
                              {Object.values(availability)
                                .filter(schedule => schedule.is_available)
                                .reduce((total, schedule) => {
                                  const start = new Date(`2024-01-01 ${schedule.start_time}`);
                                  const end = new Date(`2024-01-01 ${schedule.end_time}`);
                                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                  return total + hours;
                                }, 0)
                              } hours
                            </p>
                          </div>
                          <div className="col-md-4">
                            <strong>Status:</strong>
                            <p className="mb-1">
                              <span className="badge bg-success">
                                <i className="fas fa-user-md me-1"></i>
                                Ready for Appointments
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Tab */}
      {activeTab === 'book-appointment' && (
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5>
                  <i className="fas fa-plus-circle me-2"></i>
                  Book Appointment with Health Provider
                </h5>
              </div>
              <div className="card-body">
                {/* Search and Filter Section */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Search Provider</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name, specialization, or clinic..."
                        value={providerSearchTerm}
                        onChange={(e) => setProviderSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Filter by Specialization</label>
                    <select
                      className="form-select"
                      value={specializationFilter}
                      onChange={(e) => setSpecializationFilter(e.target.value)}
                    >
                      <option value="">All Specializations</option>
                      {getUniqueSpecializations().map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Filter by Location</label>
                    <select
                      className="form-select"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="">All Locations</option>
                      {getUniqueLocations().map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Provider Selection Dropdown */}
                <div className="row mb-4">
                  <div className="col-md-8">
                    <label className="form-label">Select Health Provider</label>
                    <div className="dropdown provider-dropdown">
                      <button
                        className="btn btn-outline-primary dropdown-toggle w-100 d-flex justify-content-between align-items-center"
                        type="button"
                        onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                        style={{ textAlign: 'left' }}
                      >
                        {selectedProvider ? (
                          <span>
                            <i className="fas fa-user-md me-2"></i>
                            {selectedProvider.name} - {selectedProvider.specialization}
                          </span>
                        ) : (
                          <span>
                            <i className="fas fa-user-md me-2"></i>
                            Choose a provider...
                          </span>
                        )}
                        <i className={`fas fa-chevron-${showProviderDropdown ? 'up' : 'down'}`}></i>
                      </button>
                      {showProviderDropdown && (
                        <div className="dropdown-menu show w-100" style={{ maxHeight: '300px', overflowY: 'auto', position: 'absolute', zIndex: 1000 }}>
                          {filteredProviders.length === 0 ? (
                            <div className="dropdown-item-text text-muted">
                              <i className="fas fa-info-circle me-2"></i>
                              No providers found matching your criteria
                            </div>
                          ) : (
                            filteredProviders.map((provider) => (
                              <button
                                key={provider.id}
                                className="dropdown-item"
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setShowProviderDropdown(false);
                                }}
                              >
                                <div className="d-flex flex-column">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="text-primary">{provider.name}</strong>
                                    <span className="badge bg-primary">{provider.specialization}</span>
                                  </div>
                                  <div className="text-muted small mb-1">
                                    <i className="fas fa-hospital me-1"></i>
                                    {provider.clinic_name}
                                  </div>
                                  <div className="text-muted small">
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {provider.clinic_address}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Search Results</label>
                    <div className="alert alert-info mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Found {filteredProviders.length} of {availableProviders.length} providers
                      {filteredProviders.length !== availableProviders.length && (
                        <div className="small mt-1">
                          <button 
                            className="btn btn-link btn-sm p-0"
                            onClick={() => {
                              setProviderSearchTerm('');
                              setSpecializationFilter('');
                              setLocationFilter('');
                            }}
                          >
                            Clear all filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Provider Info */}
                {selectedProvider && (
                  <div className="card bg-light mb-4">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Selected Provider
                      </h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="provider-info">
                            <h5 className="mb-1">{selectedProvider.name}</h5>
                            <p className="text-muted mb-2">
                              <i className="fas fa-stethoscope me-2"></i>
                              {selectedProvider.specialization}
                            </p>
                            <p className="text-muted mb-2">
                              <i className="fas fa-hospital me-2"></i>
                              {selectedProvider.clinic_name}
                            </p>
                            <p className="text-muted mb-0">
                              <i className="fas fa-map-marker-alt me-2"></i>
                              {selectedProvider.clinic_address}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-end align-items-center h-100">
                            <div className="text-end">
                              <p className="text-muted mb-2">
                                <i className="fas fa-phone me-2"></i>
                                {selectedProvider.phone}
                              </p>
                              <button 
                                className="btn btn-primary"
                                onClick={() => handleProviderClick(selectedProvider)}
                              >
                                <i className="fas fa-calendar-check me-2"></i>
                                View Available Slots
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Selection State */}
                {!selectedProvider && availableProviders.length > 0 && (
                  <div className="text-center py-5">
                    <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Select a Health Provider</h5>
                    <p className="text-muted">Use the dropdown above to choose a provider and view their available appointment slots.</p>
                  </div>
                )}

                {/* Loading State */}
                {availableProviders.length === 0 && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading providers...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading available providers...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Slots Modal */}
      {showProviderSlotsModal && selectedProvider && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-check me-2"></i>
                  Book Appointment with {selectedProvider.name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowProviderSlotsModal(false);
                    setSelectedProvider(null);
                    setSelectedTimeSlot(null);
                    setProviderTimeSlots([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="provider-info mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-8">
                          <h6>{selectedProvider.name}</h6>
                          <p className="text-muted mb-1">
                            <i className="fas fa-stethoscope me-2"></i>
                            {selectedProvider.specialization}
                          </p>
                          <p className="text-muted mb-1">
                            <i className="fas fa-hospital me-2"></i>
                            {selectedProvider.clinic_name}
                          </p>
                          <p className="text-muted mb-0">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            {selectedProvider.clinic_address}
                          </p>
                        </div>
                        <div className="col-md-4 text-end">
                          <p className="text-muted mb-0">
                            <i className="fas fa-phone me-2"></i>
                            {selectedProvider.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="date-selection mb-4">
                  <label className="form-label">Select Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>

                <div className="time-slots">
                  <h6>Available Time Slots for {selectedDate}:</h6>
                  {loadingTimeSlots ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading time slots...</span>
                      </div>
                    </div>
                  ) : providerTimeSlots.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      No available time slots for this date. Please select a different date.
                    </div>
                  ) : (
                    <div className="row">
                      {providerTimeSlots.map((slot, index) => (
                        <div key={index} className="col-md-4 col-sm-6 mb-2">
                          <button
                            className={`btn w-100 ${
                              selectedTimeSlot?.time === slot.time 
                                ? 'btn-primary' 
                                : slot.is_available 
                                  ? 'btn-outline-primary' 
                                  : 'btn-outline-secondary'
                            }`}
                            disabled={!slot.is_available}
                            onClick={() => handleTimeSlotSelection(slot)}
                          >
                            <i className="fas fa-clock me-1"></i>
                            {slot.time}
                            {!slot.is_available && (
                              <small className="d-block text-muted">Booked</small>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowProviderSlotsModal(false);
                    setSelectedProvider(null);
                    setSelectedTimeSlot(null);
                    setProviderTimeSlots([]);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  disabled={!selectedTimeSlot || !selectedTimeSlot.is_available}
                  onClick={bookSelectedSlot}
                >
                  <i className="fas fa-check me-1"></i>
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Edit Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Appointment</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAppointmentModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAppointmentSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Patient:</label>
                    <p className="form-control-plaintext">{selectedAppointment.patient_name}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Issue:</label>
                    <p className="form-control-plaintext">{selectedAppointment.issue}</p>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="appointment_date" className="form-label">Appointment Date & Time:</label>
                    <input 
                      type="datetime-local"
                      className="form-control"
                      id="appointment_date"
                      value={appointmentForm.appointment_date}
                      onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status:</label>
                    <select 
                      className="form-select"
                      id="status"
                      value={appointmentForm.status}
                      onChange={(e) => setAppointmentForm({...appointmentForm, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="priority" className="form-label">Priority:</label>
                    <select 
                      className="form-select"
                      id="priority"
                      value={appointmentForm.priority}
                      onChange={(e) => setAppointmentForm({...appointmentForm, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="provider_notes" className="form-label">Provider Notes:</label>
                    <textarea 
                      className="form-control"
                      id="provider_notes"
                      rows={3}
                      value={appointmentForm.provider_notes}
                      onChange={(e) => setAppointmentForm({...appointmentForm, provider_notes: e.target.value})}
                      placeholder="Add your notes about this appointment..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5>Appointment Status Breakdown</h5>
                <div className="btn-group btn-group-sm">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => loadAnalytics(7)}
                  >
                    7 Days
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => loadAnalytics(30)}
                  >
                    30 Days
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => loadAnalytics(90)}
                  >
                    90 Days
                  </button>
                </div>
              </div>
              <div className="card-body">
                {Object.entries(analytics.status_breakdown).map(([status, count]) => (
                  <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-capitalize">{status}:</span>
                    <span className={`badge bg-${
                      status === 'completed' ? 'success' : 
                      status === 'confirmed' ? 'info' : 
                      status === 'pending' ? 'warning' : 'secondary'
                    }`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5>Priority Distribution</h5>
              </div>
              <div className="card-body">
                {Object.entries(analytics.priority_breakdown).map(([priority, count]) => (
                  <div key={priority} className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-capitalize">{priority}:</span>
                    <span className={`badge bg-${
                      priority === 'urgent' ? 'danger' : 
                      priority === 'high' ? 'warning' : 
                      priority === 'normal' ? 'info' : 'secondary'
                    }`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-md-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5>Performance Metrics</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <div className="text-center">
                      <h3 className="text-primary">{analytics.total_appointments}</h3>
                      <p className="text-muted">Total Appointments</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <h3 className="text-success">{analytics.completion_rate.toFixed(1)}%</h3>
                      <p className="text-muted">Completion Rate</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <h3 className="text-info">{analytics.average_response_time_hours}h</h3>
                      <p className="text-muted">Avg. Response Time</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <h3 className="text-warning">{analytics.period_days}</h3>
                      <p className="text-muted">Days Analyzed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5>Daily Appointment Trends</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {Object.entries(analytics.daily_counts).slice(-7).map(([date, count]) => (
                    <div key={date} className="col text-center">
                      <h6>{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</h6>
                      <div className="badge bg-primary">{count}</div>
                      <small className="d-block text-muted">
                        {new Date(date).getDate()}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {showPatientHistoryModal && patientHistory && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user me-2"></i>
                  {patientHistory.patient.name} - Appointment History
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPatientHistoryModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>Email:</strong>
                    <p>{patientHistory.patient.email}</p>
                  </div>
                  <div className="col-md-4">
                    <strong>Phone:</strong>
                    <p>{patientHistory.patient.phone_number}</p>
                  </div>
                  <div className="col-md-4">
                    <strong>Total Visits:</strong>
                    <p>{patientHistory.total_appointments}</p>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h4>{patientHistory.completed_appointments}</h4>
                        <p className="mb-0">Completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-danger text-white">
                      <div className="card-body text-center">
                        <h4>{patientHistory.cancelled_appointments}</h4>
                        <p className="mb-0">Cancelled</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6>Appointment History</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Issue</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientHistory.appointments.map(appointment => (
                        <tr key={appointment.id}>
                          <td>
                            {appointment.appointment_date ? 
                              new Date(appointment.appointment_date).toLocaleDateString() : 
                              'Not scheduled'
                            }
                          </td>
                          <td>{appointment.issue.substring(0, 50)}...</td>
                          <td>
                            <span className={`badge bg-${
                              appointment.status === 'completed' ? 'success' : 
                              appointment.status === 'confirmed' ? 'info' : 
                              appointment.status === 'pending' ? 'warning' : 'secondary'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${
                              appointment.priority === 'urgent' ? 'danger' : 
                              appointment.priority === 'high' ? 'warning' : 'secondary'
                            }`}>
                              {appointment.priority}
                            </span>
                          </td>
                          <td>
                            {appointment.provider_notes ? 
                              appointment.provider_notes.substring(0, 30) + '...' : 
                              <span className="text-muted">No notes</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPatientHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Info Modal */}
      {showPatientInfoModal && selectedPatient && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user me-2"></i>
                  Patient Information
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPatientInfoModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-user-circle me-2"></i>
                          Personal Information
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <strong>Full Name:</strong>
                          <p className="mb-1">{selectedPatient.name}</p>
                        </div>
                        <div className="mb-3">
                          <strong>Phone Number:</strong>
                          <p className="mb-1">
                            <i className="fas fa-phone me-2 text-primary"></i>
                            <a href={`tel:${selectedPatient.phone_number}`} className="text-decoration-none">
                              {selectedPatient.phone_number}
                            </a>
                          </p>
                        </div>
                        <div className="mb-3">
                          <strong>Email Address:</strong>
                          <p className="mb-1">
                            <i className="fas fa-envelope me-2 text-primary"></i>
                            <a href={`mailto:${selectedPatient.email}`} className="text-decoration-none">
                              {selectedPatient.email}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-chart-line me-2"></i>
                          Appointment Summary
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <strong>Total Appointments:</strong>
                          <p className="mb-1">
                            <span className="badge bg-info fs-6">{selectedPatient.total_appointments}</span>
                          </p>
                        </div>
                        <div className="mb-3">
                          <strong>Last Visit:</strong>
                          <p className="mb-1">
                            {selectedPatient.last_appointment ? 
                              <>
                                <i className="fas fa-calendar-alt me-2 text-info"></i>
                                {new Date(selectedPatient.last_appointment).toLocaleDateString()}
                              </> : 
                              <span className="text-muted">
                                <i className="fas fa-calendar-times me-2"></i>
                                No previous visits
                              </span>
                            }
                          </p>
                        </div>
                        <div className="mb-3">
                          <strong>Last Visit Status:</strong>
                          <p className="mb-1">
                            {selectedPatient.last_appointment_status ? (
                              <span className={`badge bg-${
                                selectedPatient.last_appointment_status === 'completed' ? 'success' : 
                                selectedPatient.last_appointment_status === 'confirmed' ? 'info' :
                                selectedPatient.last_appointment_status === 'pending' ? 'warning' : 'secondary'
                              }`}>
                                {selectedPatient.last_appointment_status}
                              </span>
                            ) : (
                              <span className="text-muted">No status available</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-tools me-2"></i>
                          Quick Actions
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="d-flex gap-2 flex-wrap">
                          {selectedPatient.id > 0 && (
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                setShowPatientInfoModal(false);
                                loadPatientHistory(selectedPatient.id);
                              }}
                            >
                              <i className="fas fa-history me-1"></i>
                              View Full History
                            </button>
                          )}
                          <a 
                            href={`tel:${selectedPatient.phone_number}`}
                            className="btn btn-outline-success btn-sm"
                          >
                            <i className="fas fa-phone me-1"></i>
                            Call Patient
                          </a>
                          <a 
                            href={`mailto:${selectedPatient.email}`}
                            className="btn btn-outline-info btn-sm"
                          >
                            <i className="fas fa-envelope me-1"></i>
                            Send Email
                          </a>
                          <button 
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => {
                              // Create a new appointment for this patient
                              setShowPatientInfoModal(false);
                              alert('New appointment feature coming soon!');
                            }}
                          >
                            <i className="fas fa-plus me-1"></i>
                            Schedule New
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPatientInfoModal(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && availability && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-clock me-2"></i>
                  Set Your Weekly Availability
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAvailabilityModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateAvailability(availability);
                }}>
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Set your weekly schedule:</strong> Toggle availability for each day and set your working hours. 
                    Patients will only be able to book appointments during your available times.
                  </div>
                  
                  <div className="row">
                    {Object.entries(availability).map(([day, schedule]) => (
                      <div key={day} className="col-md-6 mb-4">
                        <div className={`card ${schedule.is_available ? 'border-success' : 'border-secondary'}`}>
                          <div className={`card-header ${schedule.is_available ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 text-capitalize">{day}</h6>
                              <div className="form-check form-switch">
                                <input 
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`${day}-available`}
                                  checked={schedule.is_available}
                                  onChange={(e) => {
                                    setAvailability({
                                      ...availability,
                                      [day]: {
                                        ...schedule,
                                        is_available: e.target.checked
                                      }
                                    });
                                  }}
                                />
                                <label className="form-check-label text-white" htmlFor={`${day}-available`}>
                                  {schedule.is_available ? 'Available' : 'Not Available'}
                                </label>
                              </div>
                            </div>
                          </div>
                          {schedule.is_available && (
                            <div className="card-body">
                              <div className="row">
                                <div className="col-6">
                                  <label htmlFor={`${day}-start`} className="form-label">Start Time</label>
                                  <input 
                                    type="time"
                                    className="form-control"
                                    id={`${day}-start`}
                                    value={schedule.start_time}
                                    onChange={(e) => {
                                      setAvailability({
                                        ...availability,
                                        [day]: {
                                          ...schedule,
                                          start_time: e.target.value
                                        }
                                      });
                                    }}
                                  />
                                </div>
                                <div className="col-6">
                                  <label htmlFor={`${day}-end`} className="form-label">End Time</label>
                                  <input 
                                    type="time"
                                    className="form-control"
                                    id={`${day}-end`}
                                    value={schedule.end_time}
                                    onChange={(e) => {
                                      setAvailability({
                                        ...availability,
                                        [day]: {
                                          ...schedule,
                                          end_time: e.target.value
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <small className="text-muted">
                                  <i className="fas fa-clock me-1"></i>
                                  Duration: {(() => {
                                    const start = new Date(`2024-01-01 ${schedule.start_time}`);
                                    const end = new Date(`2024-01-01 ${schedule.end_time}`);
                                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    return `${hours} hours`;
                                  })()}
                                </small>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6>Quick Actions</h6>
                          <div className="btn-group" role="group">
                            <button 
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              onClick={() => {
                                const workDaySchedule = { start_time: '09:00', end_time: '17:00', is_available: true };
                                setAvailability({
                                  monday: { ...workDaySchedule, day: 'monday' },
                                  tuesday: { ...workDaySchedule, day: 'tuesday' },
                                  wednesday: { ...workDaySchedule, day: 'wednesday' },
                                  thursday: { ...workDaySchedule, day: 'thursday' },
                                  friday: { ...workDaySchedule, day: 'friday' },
                                  saturday: { day: 'saturday', start_time: '09:00', end_time: '17:00', is_available: false },
                                  sunday: { day: 'sunday', start_time: '09:00', end_time: '17:00', is_available: false }
                                });
                              }}
                            >
                              <i className="fas fa-briefcase me-1"></i>
                              Standard Weekdays (9-5)
                            </button>
                            <button 
                              type="button"
                              className="btn btn-outline-info btn-sm"
                              onClick={() => {
                                const allDaySchedule = { start_time: '08:00', end_time: '18:00', is_available: true };
                                setAvailability({
                                  monday: { ...allDaySchedule, day: 'monday' },
                                  tuesday: { ...allDaySchedule, day: 'tuesday' },
                                  wednesday: { ...allDaySchedule, day: 'wednesday' },
                                  thursday: { ...allDaySchedule, day: 'thursday' },
                                  friday: { ...allDaySchedule, day: 'friday' },
                                  saturday: { day: 'saturday', start_time: '09:00', end_time: '12:00', is_available: true },
                                  sunday: { day: 'sunday', start_time: '09:00', end_time: '17:00', is_available: false }
                                });
                              }}
                            >
                              <i className="fas fa-calendar-week me-1"></i>
                              Extended Hours (6 Days)
                            </button>
                            <button 
                              type="button"
                              className="btn btn-outline-warning btn-sm"
                              onClick={() => {
                                Object.keys(availability).forEach(day => {
                                  setAvailability(prev => ({
                                    ...prev!,
                                    [day]: {
                                      ...prev![day as keyof Availability],
                                      is_available: false
                                    }
                                  }));
                                });
                              }}
                            >
                              <i className="fas fa-pause me-1"></i>
                              Mark All Unavailable
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAvailabilityModal(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => updateAvailability(availability)}
                >
                  <i className="fas fa-save me-1"></i>
                  Save Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
