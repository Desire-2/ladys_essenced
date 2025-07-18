'use client';

import type { UnassignedAppointment } from '../../types/health-provider';
import { formatDate, getPriorityBadgeClass } from '../../utils/health-provider';

interface UnassignedAppointmentsTabProps {
  unassignedAppointments: UnassignedAppointment[];
  onClaimAppointment: (appointmentId: number) => void;
}

export default function UnassignedAppointmentsTab({ 
  unassignedAppointments, 
  onClaimAppointment 
}: UnassignedAppointmentsTabProps) {
  return (
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
                        formatDate(appointment.preferred_date) : 
                        'Flexible'
                      }
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(appointment.priority)}`}>
                        {appointment.priority}
                      </span>
                    </td>
                    <td>{formatDate(appointment.created_at)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => onClaimAppointment(appointment.id)}
                      >
                        <i className="fas fa-hand-paper me-1"></i>
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
            <small className="text-muted">All appointments have been claimed by providers</small>
          </div>
        )}
      </div>
    </div>
  );
}
