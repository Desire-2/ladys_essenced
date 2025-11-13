import React from 'react';
import { Child, Appointment } from '../../types';
import { formatDate, getAppointmentStatusBadgeClass } from '../../utils';
import EnhancedAppointmentBooking from '../../../../components/EnhancedAppointmentBooking';
import { useAuth } from '../../../../contexts/AuthContext';

interface AppointmentsTabProps {
  selectedChild: number | null;
  children: Child[];
  upcomingAppointments: Appointment[];
  onAppointmentBooked: () => void;
  userType?: string;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  selectedChild,
  children,
  upcomingAppointments,
  onAppointmentBooked,
  userType
}) => {
  const { hasRole } = useAuth();
  
  // Helper to get selected child info
  const selectedChildInfo = selectedChild ? children.find(c => c.user_id === selectedChild) : null;
  const isParentView = userType === 'parent' && selectedChild;
  return (
    <div>
      {/* Child Context Banner - Only for Parent View */}
      {isParentView && selectedChildInfo && (
        <div className="alert alert-info border-0 shadow-sm mb-4" style={{ 
          borderRadius: '15px',
          background: 'linear-gradient(135deg, #6c5ce7 0%, #5f3dc4 100%)',
          color: 'white'
        }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div>
                <strong>{selectedChildInfo.name}'s Health Appointments</strong>
                <div className="small opacity-90">
                  Managing medical appointments and health checkups
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="small opacity-75">Managing for</div>
              <div className="badge bg-white bg-opacity-20">
                <i className="fas fa-stethoscope me-1"></i>
                Your Child
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-8">
          <EnhancedAppointmentBooking 
            onAppointmentBooked={onAppointmentBooked}
            selectedChild={selectedChild}
            children={children}
          />
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-calendar-check text-primary me-2"></i>
                {isParentView ? `${selectedChildInfo?.name}'s` : 'Your'} Upcoming Appointments
              </h6>
            </div>
            <div className="card-body">
              {upcomingAppointments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-calendar text-primary me-2"></i>
                            <strong className="small">{formatDate(appointment.date || appointment.appointment_date)}</strong>
                          </div>
                          <p className="mb-1 small">{appointment.issue}</p>
                          {appointment.for_user && (
                            <small className="text-muted">
                              <i className="fas fa-user me-1"></i>
                              For: {appointment.for_user}
                            </small>
                          )}
                        </div>
                        <span className={`badge ${getAppointmentStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-plus text-muted mb-3" style={{ fontSize: '2.5rem' }}></i>
                  <h6 className="text-muted">No Upcoming Appointments</h6>
                  <p className="text-muted small mb-0">Book your first appointment using the form on the left.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick appointment tips */}
          <div className="card mt-3">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Appointment Tips
              </h6>
            </div>
            <div className="card-body">
              <div className="small">
                <div className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Book in advance for better availability
                </div>
                <div className="mb-2">
                  <i className="fas fa-clock text-info me-2"></i>
                  Arrive 10 minutes early
                </div>
                <div className="mb-2">
                  <i className="fas fa-notes-medical text-warning me-2"></i>
                  Prepare a list of symptoms or questions
                </div>
                <div className="mb-0">
                  <i className="fas fa-id-card text-primary me-2"></i>
                  Bring your ID and insurance card
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};