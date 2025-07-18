'use client';

import { useState } from 'react';
import type { Appointment } from '../../types/health-provider';
import { formatDateTime, getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/health-provider';

interface AppointmentsTabProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
}

export default function AppointmentsTab({ 
  appointments, 
  onEditAppointment 
}: AppointmentsTabProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filter appointments based on selected filters
  const filteredAppointments = appointments.filter(appointment => {
    const statusMatch = !statusFilter || appointment.status === statusFilter;
    const priorityMatch = !priorityFilter || appointment.priority === priorityFilter;
    
    let dateMatch = true;
    if (dateFilter) {
      const appointmentDate = new Date(appointment.appointment_date || appointment.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          dateMatch = appointmentDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          dateMatch = appointmentDate >= weekStart && appointmentDate <= weekEnd;
          break;
        case 'month':
          dateMatch = appointmentDate.getMonth() === today.getMonth() && 
                     appointmentDate.getFullYear() === today.getFullYear();
          break;
        default:
          dateMatch = true;
      }
    }
    
    return statusMatch && priorityMatch && dateMatch;
  });

  return (
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
            <div className="col-md-3">
              <div className="text-muted small">
                Showing {filteredAppointments.length} of {appointments.length} appointments
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5>My Appointments</h5>
        </div>
        <div className="card-body">
          {filteredAppointments.length > 0 ? (
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
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div>
                          <strong>{appointment.patient_name}</strong>
                          <br />
                          <small className="text-muted">
                            <i className="fas fa-phone me-1"></i>{appointment.patient_phone}
                          </small>
                        </div>
                      </td>
                      <td>{appointment.issue.substring(0, 100)}...</td>
                      <td>
                        {formatDateTime(appointment.appointment_date)}
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(appointment.priority)}`}>
                          {appointment.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => onEditAppointment(appointment)}
                          >
                            <i className="fas fa-edit me-1"></i>
                            Edit
                          </button>
                          {appointment.patient_phone && (
                            <a 
                              href={`tel:${appointment.patient_phone}`}
                              className="btn btn-outline-success"
                            >
                              <i className="fas fa-phone"></i>
                            </a>
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
              <p>No appointments found matching your criteria</p>
              {(statusFilter || priorityFilter || dateFilter) && (
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setDateFilter('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
