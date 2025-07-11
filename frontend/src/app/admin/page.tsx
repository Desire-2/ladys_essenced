'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  users: {
    total: number;
    new_today: number;
    active: number;
    parents: number;
    adolescents: number;
    content_writers: number;
    health_providers: number;
  };
  content: {
    total: number;
    published: number;
    draft: number;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
  };
  recent_users: Array<{
    id: number;
    name: string;
    user_type: string;
    created_at: string;
  }>;
  recent_content: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
  }>;
  monthly_growth: Array<{
    month: string;
    users: number;
  }>;
}

interface User {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_activity: string | null;
}

interface PendingContent {
  id: number;
  title: string;
  summary: string;
  author: string;
  category: string;
  created_at: string;
}

interface Appointment {
  id: number;
  user_name: string;
  user_phone: string;
  issue: string;
  preferred_date: string | null;
  appointment_date: string | null;
  status: string;
  priority: string;
  provider: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();
  const { user, loading: authLoading, hasRole, getDashboardRoute } = useAuth();

  // Role-based access control
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && !hasRole('admin')) {
      // Redirect to appropriate dashboard based on user type
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }
    
    if (!authLoading && user && hasRole('admin')) {
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

      // Load dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
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
      console.error('Failed to load admin dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadPendingContent = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/admin/content/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load pending content:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/admin/appointments/manage', {
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

  const toggleUserStatus = async (userId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadUsers(); // Reload users
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const approveContent = async (contentId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/admin/content/${contentId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadPendingContent(); // Reload pending content
        loadDashboardData(); // Refresh stats
      }
    } catch (err) {
      console.error('Failed to approve content:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'content') {
      loadPendingContent();
    } else if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab]);

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
        <h1>Admin Dashboard</h1>
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
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('users');
                }}
              >
                User Management
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'content' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('content');
                }}
              >
                Content Review
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
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('analytics');
                }}
              >
                Analytics
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
                      <h4>{stats.users.total}</h4>
                      <p className="mb-0">Total Users</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-users"></i>
                    </div>
                  </div>
                  <small>+{stats.users.new_today} today</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.content.published}</h4>
                      <p className="mb-0">Published Content</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-file-alt"></i>
                    </div>
                  </div>
                  <small>{stats.content.draft} drafts pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.appointments.pending}</h4>
                      <p className="mb-0">Pending Appointments</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-calendar-check"></i>
                    </div>
                  </div>
                  <small>{stats.appointments.total} total</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{stats.users.active}</h4>
                      <p className="mb-0">Active Users</p>
                    </div>
                    <div className="fs-1">
                      <i className="fas fa-user-check"></i>
                    </div>
                  </div>
                  <small>{((stats.users.active / stats.users.total) * 100).toFixed(1)}% active</small>
                </div>
              </div>
            </div>
          </div>

          {/* User Type Breakdown */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>User Type Distribution</h5>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-3">
                      <div className="mb-2">
                        <div className="fs-4 fw-bold text-primary">{stats.users.parents}</div>
                        <small>Parents</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="mb-2">
                        <div className="fs-4 fw-bold text-success">{stats.users.adolescents}</div>
                        <small>Adolescents</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="mb-2">
                        <div className="fs-4 fw-bold text-info">{stats.users.content_writers}</div>
                        <small>Writers</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="mb-2">
                        <div className="fs-4 fw-bold text-warning">{stats.users.health_providers}</div>
                        <small>Providers</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Recent Activity</h5>
                </div>
                <div className="card-body">
                  <h6>Recent Users</h6>
                  {stats.recent_users.map(user => (
                    <div key={user.id} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{user.name}</strong>
                        <br />
                        <small className="text-muted">{user.user_type}</small>
                      </div>
                      <small>{new Date(user.created_at).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h5>User Management</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.phone_number}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td>
                        <span className={`badge bg-${user.user_type === 'admin' ? 'danger' : user.user_type === 'health_provider' ? 'warning' : 'primary'}`}>
                          {user.user_type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${user.is_active ? 'success' : 'secondary'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className={`btn btn-sm ${user.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content Review Tab */}
      {activeTab === 'content' && (
        <div className="card">
          <div className="card-header">
            <h5>Content Pending Review</h5>
          </div>
          <div className="card-body">
            {pendingContent.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Summary</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingContent.map(content => (
                      <tr key={content.id}>
                        <td>{content.title}</td>
                        <td>{content.author}</td>
                        <td>{content.category}</td>
                        <td>{content.summary?.substring(0, 100)}...</td>
                        <td>{new Date(content.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-success me-2"
                            onClick={() => approveContent(content.id)}
                          >
                            Approve
                          </button>
                          <button className="btn btn-sm btn-outline-primary">
                            Review
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
                <p>No content pending review</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <h5>Appointment Management</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Issue</th>
                    <th>Preferred Date</th>
                    <th>Provider</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div>
                          <strong>{appointment.user_name}</strong>
                          <br />
                          <small>{appointment.user_phone}</small>
                        </div>
                      </td>
                      <td>{appointment.issue.substring(0, 50)}...</td>
                      <td>
                        {appointment.preferred_date ? 
                          new Date(appointment.preferred_date).toLocaleDateString() : 
                          'N/A'
                        }
                      </td>
                      <td>{appointment.provider || 'Unassigned'}</td>
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
                          appointment.status === 'pending' ? 'warning' : 'secondary'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>{new Date(appointment.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && stats && (
        <div>
          <div className="card">
            <div className="card-header">
              <h5>User Growth Analytics</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {stats.monthly_growth.map((month, index) => (
                  <div key={index} className="col-md-2 mb-3">
                    <div className="text-center">
                      <div className="fs-4 fw-bold text-primary">{month.users}</div>
                      <small>{month.month}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
