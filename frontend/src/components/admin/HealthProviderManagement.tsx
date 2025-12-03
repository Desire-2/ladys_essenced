'use client';

import { useState, useEffect } from 'react';
import { apiCall, apiPost } from '../../config/api';

interface HealthProvider {
  id: number;
  user_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  specialization: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string | null;
  appointments: {
    total: number;
    pending: number;
    completed: number;
  };
}

interface HealthProviderStatistics {
  total_providers: number;
  verified_providers: number;
  unverified_providers: number;
  active_providers: number;
  by_specialization: Array<{ specialization: string; count: number }>;
  recent_providers: Array<{
    id: number;
    name: string;
    specialization: string | null;
    is_verified: boolean;
    created_at: string | null;
  }>;
}

interface HealthProviderFormData {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  specialization: string;
  license_number: string;
  clinic_name: string;
  clinic_address: string;
  is_verified: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function HealthProviderManagement() {
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [statistics, setStatistics] = useState<HealthProviderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProviders, setTotalProviders] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);
  const [providerDetails, setProviderDetails] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState<HealthProviderFormData>({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    specialization: '',
    license_number: '',
    clinic_name: '',
    clinic_address: '',
    is_verified: false
  });

  useEffect(() => {
    fetchProviders();
    fetchStatistics();
  }, [currentPage, searchTerm, filterVerified, filterSpecialization]);

  const showToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterVerified) params.append('is_verified', filterVerified);
      if (filterSpecialization) params.append('specialization', filterSpecialization);
      
      const data = await apiCall(`/api/admin/health-providers?${params.toString()}`);
      
      setProviders(data.providers || []);
      setTotalPages(data.pages || 1);
      setTotalProviders(data.total || 0);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      showToast('error', 'Failed to load health providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await apiCall('/api/admin/health-providers/statistics');
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchProviderDetails = async (providerId: number) => {
    try {
      setActionLoading({ [`details-${providerId}`]: true });
      const data = await apiCall(`/api/admin/health-providers/${providerId}`);
      setProviderDetails(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching provider details:', error);
      showToast('error', 'Failed to load provider details');
    } finally {
      setActionLoading({ [`details-${providerId}`]: false });
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setActionLoading({ create: true });
      const data = await apiPost('/api/admin/health-providers', formData);
      showToast('success', data.message || 'Health provider created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchProviders();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error creating provider:', error);
      showToast('error', error.message || 'Failed to create health provider');
    } finally {
      setActionLoading({ create: false });
    }
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider) return;
    
    try {
      setActionLoading({ [`update-${selectedProvider.id}`]: true });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/health-providers/${selectedProvider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast('success', data.message || 'Health provider updated successfully');
        setShowEditModal(false);
        setSelectedProvider(null);
        resetForm();
        fetchProviders();
      } else {
        const error = await response.json();
        showToast('error', error.error || 'Failed to update health provider');
      }
    } catch (error: any) {
      console.error('Error updating provider:', error);
      showToast('error', 'Failed to update health provider');
    } finally {
      setActionLoading({ [`update-${selectedProvider.id}`]: false });
    }
  };

  const handleVerifyProvider = async (providerId: number, verify: boolean) => {
    try {
      setActionLoading({ [`verify-${providerId}`]: true });
      const data = await apiPost(`/api/admin/health-providers/${providerId}/verify`, { verify });
      showToast('success', data.message || `Provider ${verify ? 'verified' : 'unverified'} successfully`);
      fetchProviders();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error verifying provider:', error);
      showToast('error', error.message || 'Failed to update verification status');
    } finally {
      setActionLoading({ [`verify-${providerId}`]: false });
    }
  };

  const handleDeleteProvider = async (providerId: number) => {
    if (!confirm('Are you sure you want to delete this health provider? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading({ [`delete-${providerId}`]: true });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/health-providers/${providerId}?delete_user=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast('success', data.message || 'Health provider deleted successfully');
        fetchProviders();
        fetchStatistics();
      } else {
        const error = await response.json();
        showToast('error', error.error || 'Failed to delete health provider');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      showToast('error', 'Failed to delete health provider');
    } finally {
      setActionLoading({ [`delete-${providerId}`]: false });
    }
  };

  const openEditModal = (provider: HealthProvider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      email: provider.email || '',
      phone_number: provider.phone || '',
      password: '', // Don't populate password
      specialization: provider.specialization || '',
      license_number: provider.license_number || '',
      clinic_name: provider.clinic_name || '',
      clinic_address: provider.clinic_address || '',
      is_verified: provider.is_verified
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      password: '',
      specialization: '',
      license_number: '',
      clinic_name: '',
      clinic_address: '',
      is_verified: false
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Toast Notifications */}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast show align-items-center text-white bg-${
            toast.type === 'success' ? 'success' : 
            toast.type === 'error' ? 'danger' : 
            toast.type === 'warning' ? 'warning' : 'info'
          } border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <i className={`fas fa-${
                  toast.type === 'success' ? 'check-circle' : 
                  toast.type === 'error' ? 'exclamation-circle' : 
                  toast.type === 'warning' ? 'exclamation-triangle' : 'info-circle'
                } me-2`}></i>
                {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => removeToast(toast.id)}></button>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <h6 className="text-uppercase mb-2" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Providers</h6>
                <h2 className="mb-0">{statistics.total_providers}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              <div className="card-body text-white">
                <h6 className="text-uppercase mb-2" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Verified</h6>
                <h2 className="mb-0">{statistics.verified_providers}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div className="card-body text-white">
                <h6 className="text-uppercase mb-2" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Unverified</h6>
                <h2 className="mb-0">{statistics.unverified_providers}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <div className="card-body text-white">
                <h6 className="text-uppercase mb-2" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Active (30d)</h6>
                <h2 className="mb-0">{statistics.active_providers}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small text-muted mb-1">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Verification Status</label>
              <select
                className="form-select"
                value={filterVerified}
                onChange={(e) => {
                  setFilterVerified(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted mb-1">Specialization</label>
              <input
                type="text"
                className="form-control"
                placeholder="Filter by specialization..."
                value={filterSpecialization}
                onChange={(e) => {
                  setFilterSpecialization(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add Health Provider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Health Providers ({totalProviders})</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchProviders()}>
              <i className="fas fa-sync-alt me-1"></i> Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-user-md fa-3x mb-3 opacity-50"></i>
              <p>No health providers found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Clinic</th>
                      <th>License #</th>
                      <th>Status</th>
                      <th>Appointments</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map(provider => (
                      <tr key={provider.id}>
                        <td>
                          <div>
                            <strong>{provider.name}</strong>
                            <br />
                            <small className="text-muted">{provider.email}</small>
                          </div>
                        </td>
                        <td>{provider.specialization || 'N/A'}</td>
                        <td>{provider.clinic_name || 'N/A'}</td>
                        <td>{provider.license_number || 'N/A'}</td>
                        <td>
                          <div>
                            {provider.is_verified ? (
                              <span className="badge bg-success">
                                <i className="fas fa-check-circle me-1"></i>
                                Verified
                              </span>
                            ) : (
                              <span className="badge bg-warning">
                                <i className="fas fa-clock me-1"></i>
                                Unverified
                              </span>
                            )}
                            <br />
                            {provider.is_active ? (
                              <span className="badge bg-info mt-1">Active</span>
                            ) : (
                              <span className="badge bg-secondary mt-1">Inactive</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <small>
                            <strong>{provider.appointments.total}</strong> total
                            <br />
                            {provider.appointments.pending} pending
                          </small>
                        </td>
                        <td>{formatDate(provider.created_at)}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => fetchProviderDetails(provider.id)}
                              disabled={actionLoading[`details-${provider.id}`]}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => openEditModal(provider)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`btn btn-outline-${provider.is_verified ? 'warning' : 'success'}`}
                              onClick={() => handleVerifyProvider(provider.id, !provider.is_verified)}
                              disabled={actionLoading[`verify-${provider.id}`]}
                              title={provider.is_verified ? 'Unverify' : 'Verify'}
                            >
                              <i className={`fas fa-${provider.is_verified ? 'times' : 'check'}-circle`}></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteProvider(provider.id)}
                              disabled={actionLoading[`delete-${provider.id}`]}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Provider Modal */}
      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Health Provider</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateProvider}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Specialization *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g., Gynecology, General Practice"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.license_number}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Clinic Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Clinic Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.clinic_address}
                        onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="createVerified"
                          checked={formData.is_verified}
                          onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="createVerified">
                          Verify provider immediately
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading.create}>
                    {actionLoading.create ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                    ) : (
                      'Create Provider'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showEditModal && selectedProvider && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Health Provider</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateProvider}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Specialization</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.license_number}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Clinic Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Clinic Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.clinic_address}
                        onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="editVerified"
                          checked={formData.is_verified}
                          onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="editVerified">
                          Verified provider
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading[`update-${selectedProvider.id}`]}>
                    {actionLoading[`update-${selectedProvider.id}`] ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                    ) : (
                      'Update Provider'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && providerDetails && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Provider Details: {providerDetails.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Personal Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th style={{ width: '40%' }}>Name:</th>
                          <td>{providerDetails.name}</td>
                        </tr>
                        <tr>
                          <th>Email:</th>
                          <td>{providerDetails.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Phone:</th>
                          <td>{providerDetails.phone || providerDetails.phone_number || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Specialization:</th>
                          <td>{providerDetails.specialization || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>License Number:</th>
                          <td>{providerDetails.license_number || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Clinic Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th style={{ width: '40%' }}>Clinic Name:</th>
                          <td>{providerDetails.clinic_name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Clinic Address:</th>
                          <td>{providerDetails.clinic_address || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Verified:</th>
                          <td>
                            {providerDetails.is_verified ? (
                              <span className="badge bg-success">Yes</span>
                            ) : (
                              <span className="badge bg-warning">No</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Active:</th>
                          <td>
                            {providerDetails.is_active ? (
                              <span className="badge bg-info">Yes</span>
                            ) : (
                              <span className="badge bg-secondary">No</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Joined:</th>
                          <td>{formatDate(providerDetails.created_at)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-12">
                    <h6 className="text-muted mb-3">Appointment Statistics</h6>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{providerDetails.statistics?.total_appointments || 0}</h3>
                            <small className="text-muted">Total Appointments</small>
                          </div>
                        </div>
                      </div>
                      {Object.entries(providerDetails.statistics?.by_status || {}).map(([status, count]: [string, any]) => (
                        <div key={status} className="col-md-3">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h3 className="mb-0">{count}</h3>
                              <small className="text-muted text-capitalize">{status}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {providerDetails.recent_appointments && providerDetails.recent_appointments.length > 0 && (
                    <div className="col-12">
                      <h6 className="text-muted mb-3">Recent Appointments</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead>
                            <tr>
                              <th>Patient</th>
                              <th>Issue</th>
                              <th>Status</th>
                              <th>Priority</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {providerDetails.recent_appointments.map((appt: any) => (
                              <tr key={appt.id}>
                                <td>{appt.patient_name}</td>
                                <td>{appt.issue}</td>
                                <td>
                                  <span className={`badge bg-${
                                    appt.status === 'completed' ? 'success' : 
                                    appt.status === 'confirmed' ? 'info' : 
                                    appt.status === 'pending' ? 'warning' : 'secondary'
                                  }`}>
                                    {appt.status}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge bg-${
                                    appt.priority === 'urgent' ? 'danger' : 
                                    appt.priority === 'high' ? 'warning' : 'secondary'
                                  }`}>
                                    {appt.priority}
                                  </span>
                                </td>
                                <td>{formatDate(appt.appointment_date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
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
