'use client';

import { useState, useMemo } from 'react';
import type { Appointment } from '../../types/health-provider';
import { formatDateTime, getStatusBadgeClass } from '../../utils/health-provider';

interface EnhancedAppointmentsTabProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
  onRefresh: () => void;
  loading?: boolean;
}

type SortField = 'appointment_date' | 'patient_name' | 'status' | 'priority' | 'created_at';
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type FilterPriority = 'all' | 'low' | 'normal' | 'high' | 'urgent';

export default function EnhancedAppointmentsTab({ 
  appointments, 
  onEditAppointment, 
  onRefresh,
  loading = false 
}: EnhancedAppointmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [sortField, setSortField] = useState<SortField>('appointment_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedAppointments, setSelectedAppointments] = useState<Set<number>>(new Set());

  // Filter and sort appointments
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments.filter(appointment => {
      const matchesSearch = !searchTerm || 
        appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.issue.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || appointment.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort appointments
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'appointment_date' || sortField === 'created_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [appointments, searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedAppointments.length;
    const pending = filteredAndSortedAppointments.filter(a => a.status === 'pending').length;
    const confirmed = filteredAndSortedAppointments.filter(a => a.status === 'confirmed').length;
    const completed = filteredAndSortedAppointments.filter(a => a.status === 'completed').length;
    const urgent = filteredAndSortedAppointments.filter(a => a.priority === 'urgent').length;
    
    return { total, pending, confirmed, completed, urgent };
  }, [filteredAndSortedAppointments]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAppointment = (id: number) => {
    const newSelected = new Set(selectedAppointments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAppointments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAppointments.size === filteredAndSortedAppointments.length) {
      setSelectedAppointments(new Set());
    } else {
      setSelectedAppointments(new Set(filteredAndSortedAppointments.map(a => a.id)));
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'fas fa-exclamation-triangle text-danger';
      case 'high': return 'fas fa-arrow-up text-warning';
      case 'normal': return 'fas fa-minus text-info';
      case 'low': return 'fas fa-arrow-down text-muted';
      default: return 'fas fa-minus text-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="enhanced-appointments-tab">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="fas fa-calendar-alt me-2 text-primary"></i>
            Appointments Management
          </h4>
          <p className="text-muted mb-0">Manage and track all your appointments</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className={`btn btn-outline-secondary ${loading ? 'disabled' : ''}`}
            onClick={onRefresh}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt me-1 ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
          <div className="btn-group" role="group">
            <button 
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('table')}
            >
              <i className="fas fa-table me-1"></i>
              Table
            </button>
            <button 
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('cards')}
            >
              <i className="fas fa-th-large me-1"></i>
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="row mb-4">
        <div className="col">
          <div className="card border-0 bg-light">
            <div className="card-body py-3">
              <div className="row text-center">
                <div className="col">
                  <h5 className="mb-1 text-primary">{stats.total}</h5>
                  <small className="text-muted">Total</small>
                </div>
                <div className="col">
                  <h5 className="mb-1 text-warning">{stats.pending}</h5>
                  <small className="text-muted">Pending</small>
                </div>
                <div className="col">
                  <h5 className="mb-1 text-success">{stats.confirmed}</h5>
                  <small className="text-muted">Confirmed</small>
                </div>
                <div className="col">
                  <h5 className="mb-1 text-info">{stats.completed}</h5>
                  <small className="text-muted">Completed</small>
                </div>
                <div className="col">
                  <h5 className="mb-1 text-danger">{stats.urgent}</h5>
                  <small className="text-muted">Urgent</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search Appointments</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by patient name or issue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Filter by Status</label>
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Filter by Priority</label>
              <select 
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="col-md-2">
              <label className="form-label">Actions</label>
              <div className="d-flex gap-1">
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  title="Clear all filters"
                >
                  <i className="fas fa-times"></i>
                </button>
                {selectedAppointments.size > 0 && (
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    title={`${selectedAppointments.size} selected`}
                  >
                    <i className="fas fa-check"></i> {selectedAppointments.size}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {viewMode === 'table' ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedAppointments.size === filteredAndSortedAppointments.length && filteredAndSortedAppointments.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('patient_name')}
                    >
                      Patient
                      <i className={`fas fa-sort${sortField === 'patient_name' ? (sortDirection === 'asc' ? '-up' : '-down') : ''} ms-1`}></i>
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('appointment_date')}
                    >
                      Date & Time
                      <i className={`fas fa-sort${sortField === 'appointment_date' ? (sortDirection === 'asc' ? '-up' : '-down') : ''} ms-1`}></i>
                    </th>
                    <th>Issue</th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <i className={`fas fa-sort${sortField === 'status' ? (sortDirection === 'asc' ? '-up' : '-down') : ''} ms-1`}></i>
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('priority')}
                    >
                      Priority
                      <i className={`fas fa-sort${sortField === 'priority' ? (sortDirection === 'asc' ? '-up' : '-down') : ''} ms-1`}></i>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                        <h6 className="text-muted">No appointments found</h6>
                        <p className="text-muted">Try adjusting your filters or search criteria</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedAppointments.has(appointment.id)}
                            onChange={() => handleSelectAppointment(appointment.id)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm bg-primary-light rounded-circle me-3">
                              <i className="fas fa-user text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-bold">{appointment.patient_name}</div>
                              <small className="text-muted">ID: {appointment.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">
                              {appointment.appointment_date ? formatDateTime(appointment.appointment_date) : 'Not scheduled'}
                            </div>
                            <small className="text-muted">
                              Created: {formatDateTime(appointment.created_at)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '200px' }} title={appointment.issue}>
                            {appointment.issue}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${getPriorityColor(appointment.priority)}`}>
                            <i className={getPriorityIcon(appointment.priority)} style={{ fontSize: '10px' }}></i>
                            <span className="ms-1">{appointment.priority}</span>
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => onEditAppointment(appointment)}
                              title="Edit appointment"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-outline-info"
                              title="View details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Cards View
        <div className="row">
          {filteredAndSortedAppointments.length === 0 ? (
            <div className="col-12">
              <div className="text-center py-5">
                <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">No appointments found</h6>
                <p className="text-muted">Try adjusting your filters or search criteria</p>
              </div>
            </div>
          ) : (
            filteredAndSortedAppointments.map((appointment) => (
              <div key={appointment.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card border-0 shadow-sm h-100 appointment-card">
                  <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={selectedAppointments.has(appointment.id)}
                        onChange={() => handleSelectAppointment(appointment.id)}
                      />
                      <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <span className={`badge bg-${getPriorityColor(appointment.priority)}`}>
                      <i className={getPriorityIcon(appointment.priority)} style={{ fontSize: '10px' }}></i>
                      <span className="ms-1">{appointment.priority}</span>
                    </span>
                  </div>
                  <div className="card-body">
                    <h6 className="card-title d-flex align-items-center">
                      <i className="fas fa-user me-2 text-primary"></i>
                      {appointment.patient_name}
                    </h6>
                    <p className="card-text text-muted mb-3">{appointment.issue}</p>
                    
                    <div className="mb-3">
                      <small className="text-muted d-flex align-items-center">
                        <i className="fas fa-calendar me-2"></i>
                        {appointment.appointment_date ? formatDateTime(appointment.appointment_date) : 'Not scheduled'}
                      </small>
                      <small className="text-muted d-flex align-items-center mt-1">
                        <i className="fas fa-clock me-2"></i>
                        Created: {formatDateTime(appointment.created_at)}
                      </small>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent">
                    <div className="btn-group w-100">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onEditAppointment(appointment)}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Edit
                      </button>
                      <button className="btn btn-outline-info btn-sm">
                        <i className="fas fa-eye me-1"></i>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }
        
        .sortable:hover {
          background-color: rgba(0,0,0,0.05);
        }
        
        .appointment-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .appointment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        
        .avatar-sm {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bg-primary-light {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .fw-medium {
          font-weight: 500;
        }
        
        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
