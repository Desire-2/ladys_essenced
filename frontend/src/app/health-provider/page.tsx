'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { buildHealthProviderApiUrl } from '../../utils/apiConfig';

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

export default function HealthProviderDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unassignedAppointments, setUnassignedAppointments] = useState<UnassignedAppointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

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

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      setError('');
    } catch (err: any) {
      console.error('Failed to load health provider dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (dateFilter) params.append('date_filter', dateFilter);

      const response = await fetch(`/api/health-provider/appointments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  const loadUnassignedAppointments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildHealthProviderApiUrl('/appointments/unassigned'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnassignedAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Failed to load unassigned appointments:', err);
    }
  };

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/health-provider/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const loadSchedule = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const response = await fetch(`/api/health-provider/schedule?start_date=${today.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
  };

  const claimAppointment = async (appointmentId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/health-provider/appointments/${appointmentId}/claim`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadUnassignedAppointments();
        loadAppointments();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to claim appointment:', err);
    }
  };

  const updateAppointment = async (appointmentId: number, updates: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/health-provider/appointments/${appointmentId}/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        loadAppointments();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to update appointment:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    } else if (activeTab === 'unassigned') {
      loadUnassignedAppointments();
    } else if (activeTab === 'patients') {
      loadPatients();
    } else if (activeTab === 'schedule') {
      loadSchedule();
    }
  }, [activeTab, statusFilter, priorityFilter, dateFilter]);

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Health Provider Dashboard</h1>
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
                Patients
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
                              {appointment.status === 'pending' && (
                                <button 
                                  className="btn btn-outline-success"
                                  onClick={() => updateAppointment(appointment.id, { status: 'confirmed' })}
                                >
                                  Confirm
                                </button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <button 
                                  className="btn btn-outline-info"
                                  onClick={() => updateAppointment(appointment.id, { status: 'completed' })}
                                >
                                  Complete
                                </button>
                              )}
                              <button className="btn btn-outline-primary">
                                Details
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
    </div>
  );
}
