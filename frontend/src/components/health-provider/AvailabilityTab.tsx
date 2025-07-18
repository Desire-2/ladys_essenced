'use client';

import type { WeeklyAvailability } from '../../types/health-provider';
import { calculateTotalWeeklyHours, getAvailableDaysCount } from '../../utils/health-provider';

interface AvailabilityTabProps {
  availability: WeeklyAvailability;
  onEditAvailability: () => void;
}

export default function AvailabilityTab({ 
  availability, 
  onEditAvailability 
}: AvailabilityTabProps) {
  const totalHours = calculateTotalWeeklyHours(availability);
  const availableDays = getAvailableDaysCount(availability);

  return (
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
              onClick={onEditAvailability}
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
                          {availableDays} days
                        </p>
                      </div>
                      <div className="col-md-4">
                        <strong>Total Weekly Hours:</strong>
                        <p className="mb-1">
                          {totalHours} hours
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
  );
}
