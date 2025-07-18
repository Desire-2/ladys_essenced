'use client';

import type { ProviderStats } from '../../types/health-provider';
import { formatDate, getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/health-provider';

interface OverviewTabProps {
  stats: ProviderStats;
}

export default function OverviewTab({ stats }: OverviewTabProps) {
  return (
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
                    <span className={`badge ${getPriorityBadgeClass(appointment.priority)} me-2`}>
                      {appointment.priority}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <small>{formatDate(appointment.created_at)}</small>
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
  );
}
