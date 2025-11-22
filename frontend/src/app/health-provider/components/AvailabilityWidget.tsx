import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface AvailabilitySlot {
  time: string;
  datetime: string;
  is_available: boolean;
  appointment?: {
    id: number;
    patient_name: string;
    status: string;
    priority: string;
  };
}

interface AvailabilitySummary {
  date: string;
  day_of_week: string;
  total_slots: number;
  booked_slots: number;
  available_slots: number;
  availability_percentage: number;
}

interface AvailabilityWidgetProps {
  providerId: number;
}

const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({ providerId }) => {
  const [availabilitySummary, setAvailabilitySummary] = useState<AvailabilitySummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<AvailabilitySlot[]>([]);
  const [nextAvailableSlot, setNextAvailableSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load availability if we have a valid provider ID
    if (providerId > 0) {
      loadAvailabilityData();
      loadNextAvailableSlot();
    }
  }, [providerId]);

  const loadAvailabilityData = async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping availability load - invalid provider ID:', providerId);
      setLoading(false);
      return;
    }

    try {
      // Use test endpoint for demo purposes
      const response = await fetch(`/api/health-provider/test/appointments/provider-availability-summary?provider_id=${providerId}&days_ahead=7`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailabilitySummary(data.availability_summary || []);
      }
    } catch (error) {
      console.error('Failed to load availability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextAvailableSlot = async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping next available slot load - invalid provider ID:', providerId);
      return;
    }

    try {
      // Use test endpoint for demo purposes
      const response = await fetch(`/api/health-provider/test/appointments/next-available-slot?provider_id=${providerId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNextAvailableSlot(data.next_available_slot);
      }
    } catch (error) {
      console.error('Failed to load next available slot:', error);
    }
  };

  const loadTimeSlots = async (date: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/health-provider/appointments/provider-time-slots?provider_id=${providerId}&date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data.time_slots || []);
        setSelectedDate(date);
      }
    } catch (error) {
      console.error('Failed to load time slots:', error);
      toast.error('Failed to load time slots');
    }
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'warning';
    if (percentage >= 25) return 'orange';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-calendar-alt me-2"></i>
          Availability Overview
        </h5>
      </div>
      <div className="card-body">
        {/* Next Available Slot */}
        {nextAvailableSlot && (
          <div className="alert alert-info mb-3">
            <div className="d-flex align-items-center">
              <i className="fas fa-clock me-2"></i>
              <div>
                <strong>Next Available:</strong> {new Date(nextAvailableSlot.datetime).toLocaleDateString()} at {nextAvailableSlot.time}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Availability Summary */}
        <h6 className="mb-3">Weekly Overview</h6>
        <div className="row g-2 mb-4">
          {availabilitySummary.map((day, index) => (
            <div key={index} className="col">
              <div 
                className={`card border-${getAvailabilityColor(day.availability_percentage)} cursor-pointer`}
                onClick={() => loadTimeSlots(day.date)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body p-2 text-center">
                  <div className="small text-muted">{day.day_of_week.substring(0, 3)}</div>
                  <div className="small fw-bold">{new Date(day.date).getDate()}</div>
                  <div className={`small text-${getAvailabilityColor(day.availability_percentage)}`}>
                    {day.available_slots}/{day.total_slots}
                  </div>
                  <div className="progress mt-1" style={{ height: '4px' }}>
                    <div 
                      className={`progress-bar bg-${getAvailabilityColor(day.availability_percentage)}`}
                      style={{ width: `${day.availability_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Time Slots */}
        {selectedDate && timeSlots.length > 0 && (
          <div>
            <h6 className="mb-3">
              Time Slots for {new Date(selectedDate).toLocaleDateString()}
              <button 
                className="btn btn-sm btn-outline-secondary ms-2"
                onClick={() => setSelectedDate('')}
              >
                <i className="fas fa-times"></i>
              </button>
            </h6>
            <div className="row g-2">
              {timeSlots.map((slot, index) => (
                <div key={index} className="col-6 col-md-3 col-lg-2">
                  <div className={`card ${slot.is_available ? 'border-success' : 'border-danger'} text-center`}>
                    <div className="card-body p-2">
                      <div className="small fw-bold">{slot.time}</div>
                      {slot.is_available ? (
                        <small className="text-success">
                          <i className="fas fa-check-circle"></i> Available
                        </small>
                      ) : (
                        <small className="text-danger">
                          <i className="fas fa-times-circle"></i> Booked
                          {slot.appointment && (
                            <div className="mt-1">
                              <div className="small text-truncate">{slot.appointment.patient_name}</div>
                              <span className={`badge badge-sm bg-${
                                slot.appointment.status === 'confirmed' ? 'success' : 'warning'
                              }`}>
                                {slot.appointment.status}
                              </span>
                            </div>
                          )}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 pt-3 border-top">
          <small className="text-muted">
            <div className="d-flex flex-wrap gap-3">
              <span><i className="fas fa-circle text-success me-1"></i>High Availability (75%+)</span>
              <span><i className="fas fa-circle text-warning me-1"></i>Medium Availability (50-74%)</span>
              <span><i className="fas fa-circle text-danger me-1"></i>Low Availability (&lt;25%)</span>
            </div>
          </small>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityWidget;
