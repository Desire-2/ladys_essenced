'use client';

import type { Appointment } from '../../types/health-provider';
import { formatDateTime, getStatusBadgeClass } from '../../utils/health-provider';

interface ScheduleTabProps {
  schedule: Record<string, Appointment[]>;
}

export default function ScheduleTab({ schedule }: ScheduleTabProps) {
  return (
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
                            <strong>{appointment.patient_name}</strong>
                            <br />
                            <small className="text-muted">
                              {formatDateTime(appointment.appointment_date)}
                            </small>
                            <br />
                            <span className={`badge ${getStatusBadgeClass(appointment.status)} me-1`}>
                              {appointment.status}
                            </span>
                            {appointment.priority === 'urgent' && (
                              <span className="badge bg-danger">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="text-end">
                            <small className="text-muted">
                              {appointment.issue.substring(0, 30)}...
                            </small>
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
        
        {Object.keys(schedule).length === 0 && (
          <div className="text-center py-4">
            <i className="fas fa-calendar fa-3x text-muted mb-3"></i>
            <p>No scheduled appointments for this week</p>
            <small className="text-muted">Your weekly schedule will appear here once appointments are confirmed</small>
          </div>
        )}
      </div>
    </div>
  );
}
