'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildHealthProviderApiUrl } from '../../utils/apiConfig';
import { handleApiResponse } from '../../utils/health-provider';
import type { HealthProvider, TimeSlot } from '../../types/health-provider';

interface AppointmentBookingModalProps {
  provider: HealthProvider | null;
  onClose: () => void;
  onBookingSuccess: (message: string) => void;
  onError: (error: string) => void;
  show: boolean;
}

export default function AppointmentBookingModal({ 
  provider, 
  onClose, 
  onBookingSuccess, 
  onError, 
  show 
}: AppointmentBookingModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState({
    issue: '',
    priority: 'normal',
    notes: ''
  });
  const [booking, setBooking] = useState(false);

  // Load time slots when date or provider changes
  useEffect(() => {
    if (provider && selectedDate && user?.access_token) {
      loadTimeSlots();
    }
  }, [provider, selectedDate, user?.access_token]);

  const loadTimeSlots = async () => {
    if (!provider || !user?.access_token) return;
    
    setLoadingTimeSlots(true);
    setSelectedTimeSlot(null);
    
    try {
      const response = await fetch(
        buildHealthProviderApiUrl(`/providers/${provider.id}/availability?date=${selectedDate}`),
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data.time_slots || []);
      } else {
        throw new Error('Failed to load time slots');
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      onError('Failed to load available time slots');
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelection = (slot: TimeSlot) => {
    if (slot.is_available) {
      setSelectedTimeSlot(slot);
    }
  };

  const handleBookAppointment = async () => {
    if (!provider || !selectedTimeSlot || !user?.access_token) return;
    
    if (!appointmentDetails.issue.trim()) {
      onError('Please describe your health issue or reason for the appointment');
      return;
    }

    setBooking(true);
    
    try {
      const appointmentDateTime = `${selectedDate} ${selectedTimeSlot.time}`;
      
      const response = await fetch(buildHealthProviderApiUrl('/appointments/book'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider_id: provider.id,
          appointment_date: appointmentDateTime,
          issue: appointmentDetails.issue,
          priority: appointmentDetails.priority,
          notes: appointmentDetails.notes
        })
      });

      await handleApiResponse(response, 'Failed to book appointment');
      onBookingSuccess(`Appointment successfully booked with ${provider.name} on ${selectedDate} at ${selectedTimeSlot.time}`);
      onClose();
    } catch (error) {
      console.error('Error booking appointment:', error);
      onError('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const getNextAvailableDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!show || !provider) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-calendar-plus me-2"></i>
              Book Appointment with {provider.name}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Provider Information */}
            <div className="provider-info-card mb-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="provider-avatar me-3">
                      <i className="fas fa-user-md"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">{provider.name}</h6>
                      <p className="mb-1">
                        <i className="fas fa-stethoscope me-2"></i>
                        {provider.specialization}
                      </p>
                      <p className="mb-0">
                        <i className="fas fa-hospital me-2"></i>
                        {provider.clinic_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label">
                  <i className="fas fa-calendar me-2"></i>
                  Select Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  <i className="fas fa-info-circle me-2"></i>
                  Quick Actions
                </label>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                  >
                    Today
                  </button>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleDateChange(getNextAvailableDate())}
                  >
                    Tomorrow
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={loadTimeSlots}
                    disabled={loadingTimeSlots}
                  >
                    <i className={`fas fa-sync-alt ${loadingTimeSlots ? 'fa-spin' : ''}`}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="time-slots-section mb-4">
              <label className="form-label">
                <i className="fas fa-clock me-2"></i>
                Available Time Slots for {new Date(selectedDate).toLocaleDateString()}
              </label>
              
              {loadingTimeSlots ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading time slots...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading available times...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  No available time slots for this date. Please try a different date.
                </div>
              ) : (
                <div className="time-slots-grid">
                  <div className="row g-2">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="col-6 col-md-4 col-lg-3">
                        <button
                          className={`btn w-100 time-slot-btn ${
                            selectedTimeSlot?.time === slot.time 
                              ? 'btn-primary selected' 
                              : slot.is_available 
                                ? 'btn-outline-primary' 
                                : 'btn-outline-secondary disabled'
                          }`}
                          disabled={!slot.is_available}
                          onClick={() => handleTimeSlotSelection(slot)}
                        >
                          <i className="fas fa-clock me-1"></i>
                          {slot.time}
                          {!slot.is_available && (
                            <small className="d-block text-muted">Booked</small>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Details */}
            <div className="appointment-details">
              <h6 className="mb-3">
                <i className="fas fa-file-medical me-2"></i>
                Appointment Details
              </h6>
              
              <div className="row">
                <div className="col-md-8">
                  <div className="mb-3">
                    <label className="form-label">Reason for Visit *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Please describe your health concern or reason for the appointment..."
                      value={appointmentDetails.issue}
                      onChange={(e) => setAppointmentDetails({
                        ...appointmentDetails,
                        issue: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={appointmentDetails.priority}
                      onChange={(e) => setAppointmentDetails({
                        ...appointmentDetails,
                        priority: e.target.value
                      })}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Additional Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Any additional information you'd like the provider to know..."
                  value={appointmentDetails.notes}
                  onChange={(e) => setAppointmentDetails({
                    ...appointmentDetails,
                    notes: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {selectedTimeSlot && (
              <div className="booking-summary">
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Booking Summary
                  </h6>
                  <hr />
                  <div className="row">
                    <div className="col-6">
                      <strong>Provider:</strong> {provider.name}<br />
                      <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}<br />
                      <strong>Time:</strong> {selectedTimeSlot.time}
                    </div>
                    <div className="col-6">
                      <strong>Location:</strong> {provider.clinic_name}<br />
                      <strong>Priority:</strong> <span className="text-capitalize">{appointmentDetails.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={booking}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={!selectedTimeSlot || !appointmentDetails.issue.trim() || booking}
              onClick={handleBookAppointment}
            >
              {booking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Booking...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-1"></i>
                  Book Appointment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .provider-avatar {
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        
        .time-slot-btn {
          transition: all 0.2s ease;
          height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .time-slot-btn:hover:not(.disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .time-slot-btn.selected {
          box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }
        
        .booking-summary {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .time-slots-grid {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .time-slots-grid::-webkit-scrollbar {
          width: 6px;
        }
        
        .time-slots-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .time-slots-grid::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
