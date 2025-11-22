import React, { useState, useEffect, useCallback } from 'react';
import { parentAPI } from '../../api';
import { API_BASE_URL } from '../../config/api';
import '../../styles/child-appointment-booking.css';

interface User {
  id: number;
  name: string;
  email: string;
  user_type: string;
  access_token?: string;
}

interface Child {
  id: number;
  user_id: number;
  name: string;
  date_of_birth?: string;
  relationship_type: string;
}

interface HealthProvider {
  id: number;
  name: string;
  specialization: string;
  clinic_name?: string;
  is_verified: boolean;
}

interface TimeSlot {
  time: string;
  datetime: string;
  is_available: boolean;
}

interface ChildAppointmentBookingProps {
  user: User | null;
  onBookingSuccess?: (appointmentId: number, childName: string) => void;
  onError?: (message: string) => void;
}

export default function ChildAppointmentBooking({
  user,
  onBookingSuccess,
  onError
}: ChildAppointmentBookingProps) {
  // State management
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Form state
  const [appointmentDetails, setAppointmentDetails] = useState({
    issue: '',
    notes: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_telemedicine: false
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step tracking
  const [activeStep, setActiveStep] = useState(1);

  // Fetch parent's children on mount
  const fetchChildren = useCallback(async () => {
    if (!user?.access_token) return;

    setChildrenLoading(true);
    try {
      const response = await parentAPI.getChildren();
      setChildren(response.data.children || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching children:', err);
      setError(err.response?.data?.message || 'Failed to load your children. Please try again.');
    } finally {
      setChildrenLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    if (user?.access_token) {
      fetchChildren();
    }
  }, [user?.access_token, fetchChildren]);

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setSelectedProvider(null);
    setProviders([]);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTimeSlot(null);
    setActiveStep(2);
    setError('');
    setSuccessMessage('');
  };

  const handleProviderSelect = async (provider: HealthProvider) => {
    setSelectedProvider(provider);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTimeSlot(null);
    setActiveStep(3);
    
    // Fetch available dates for this provider
    await fetchAvailableDates(provider.id);
  };

  const fetchAvailableDates = async (providerId: number) => {
    if (!user?.access_token) return;

    setDatesLoading(true);
    try {
      // Generate dates for next 30 days
      const dates: string[] = [];
      const today = new Date();
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(dates);
    } catch (err) {
      console.error('Error generating available dates:', err);
      setError('Failed to load available dates');
    } finally {
      setDatesLoading(false);
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setSlotsLoading(true);

    if (!user?.access_token || !selectedProvider) return;

    try {
      // Generate time slots for the selected date
      const slots: TimeSlot[] = [];
      const startHour = 9;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of [0, 30]) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            time,
            datetime: `${date}T${time}:00`,
            is_available: true
          });
        }
      }
      setTimeSlots(slots);
    } catch (err) {
      console.error('Error generating time slots:', err);
      setError('Failed to load available times');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.is_available) {
      setSelectedTimeSlot(slot);
      setActiveStep(4);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setAppointmentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBookAppointment = async () => {
    if (!selectedChild || !selectedProvider || !selectedTimeSlot || !user?.access_token) {
      setError('Please complete all required fields');
      return;
    }

    if (!appointmentDetails.issue.trim()) {
      setError('Please describe the health issue or reason for appointment');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const appointmentDateTime = `${selectedDate} ${selectedTimeSlot.time}:00`;

      const response = await fetch(`${API_BASE_URL}/api/parent/book-appointment-for-child`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          child_id: selectedChild.id,
          appointment_date: appointmentDateTime,
          issue: appointmentDetails.issue,
          notes: appointmentDetails.notes,
          priority: appointmentDetails.priority,
          is_telemedicine: appointmentDetails.is_telemedicine,
          appointment_type_id: 1 // Default appointment type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to book appointment');
      }

      const data = await response.json();
      
      setSuccessMessage(`✓ Appointment booked successfully for ${selectedChild.name}!`);
      
      // Reset form
      setTimeout(() => {
        setSelectedChild(null);
        setSelectedProvider(null);
        setSelectedDate('');
        setSelectedTimeSlot(null);
        setAppointmentDetails({
          issue: '',
          notes: '',
          priority: 'normal',
          is_telemedicine: false
        });
        setActiveStep(1);
        
        if (onBookingSuccess) {
          onBookingSuccess(data.appointment.id, selectedChild.name);
        }
      }, 2000);

    } catch (err: any) {
      console.error('Error booking appointment:', err);
      const errorMessage = err.message || 'Failed to book appointment. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setBooking(false);
    }
  };

  // Step 1: Select Child
  if (!selectedChild) {
    return (
      <div className="child-appointment-booking">
        <div className="booking-header">
          <h3>
            <i className="fas fa-calendar-plus me-2"></i>
            Book Appointment for Child
          </h3>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show">
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
          </div>
        )}

        <div className="booking-step">
          <h5 className="step-title">Step 1: Select Your Child</h5>
          
          {childrenLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2">Loading your children...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              No children found. Please add a child to your profile first.
            </div>
          ) : (
            <div className="children-list">
              {children.map(child => (
                <div
                  key={child.id}
                  className="child-card"
                  onClick={() => handleChildSelect(child)}
                >
                  <div className="child-avatar">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="child-info">
                    <h6>{child.name}</h6>
                    <small className="text-muted">{child.relationship_type}</small>
                  </div>
                  <div className="child-action">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Select Provider
  if (!selectedProvider) {
    return (
      <div className="child-appointment-booking">
        <div className="booking-header">
          <button
            className="btn btn-link btn-sm"
            onClick={() => setSelectedChild(null)}
          >
            <i className="fas fa-arrow-left me-1"></i> Back
          </button>
          <h3>Booking for <strong>{selectedChild.name}</strong></h3>
        </div>

        <div className="booking-step">
          <h5 className="step-title">Step 2: Select Health Provider</h5>
          
          <div className="provider-search">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, specialization..."
              />
            </div>
          </div>

          {providersLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="providers-list mt-3">
              {/* Provider list would be populated from API */}
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Providers will be loaded here
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3 & 4: Date/Time and Confirmation
  return (
    <div className="child-appointment-booking">
      <div className="booking-header">
        <button
          className="btn btn-link btn-sm"
          onClick={() => setSelectedProvider(null)}
        >
          <i className="fas fa-arrow-left me-1"></i> Change Provider
        </button>
        <h3>
          {selectedChild.name} → {selectedProvider.name}
        </h3>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row">
        {/* Date & Time Selection */}
        <div className="col-md-6">
          <div className="booking-step">
            <h5 className="step-title">Step 3: Select Date & Time</h5>

            {datesLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status"></div>
              </div>
            ) : (
              <div className="dates-list">
                {availableDates.map(date => (
                  <button
                    key={date}
                    className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                    onClick={() => handleDateSelect(date)}
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </button>
                ))}
              </div>
            )}

            {selectedDate && (
              <div className="mt-3">
                <h6>Available Times</h6>
                {slotsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                  </div>
                ) : (
                  <div className="time-slots">
                    {timeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        className={`time-slot ${
                          slot.is_available ? '' : 'disabled'
                        } ${selectedTimeSlot === slot ? 'active' : ''}`}
                        onClick={() => handleTimeSlotSelect(slot)}
                        disabled={!slot.is_available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="col-md-6">
          <div className="booking-step">
            <h5 className="step-title">Step 4: Appointment Details</h5>

            <div className="mb-3">
              <label className="form-label">Health Issue or Concern *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Describe the health issue or reason for appointment..."
                value={appointmentDetails.issue}
                onChange={(e) => handleFormChange('issue', e.target.value)}
              ></textarea>
            </div>

            <div className="mb-3">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={appointmentDetails.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Any additional information for the provider..."
                value={appointmentDetails.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
              ></textarea>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="telemedicine"
                checked={appointmentDetails.is_telemedicine}
                onChange={(e) => handleFormChange('is_telemedicine', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="telemedicine">
                Online Consultation (if available)
              </label>
            </div>

            {selectedTimeSlot && (
              <div className="alert alert-info">
                <strong>Appointment Summary:</strong>
                <ul className="mb-0 mt-2">
                  <li>Child: {selectedChild.name}</li>
                  <li>Provider: {selectedProvider.name}</li>
                  <li>Date: {new Date(selectedDate).toLocaleDateString()}</li>
                  <li>Time: {selectedTimeSlot.time}</li>
                </ul>
              </div>
            )}

            <button
              className="btn btn-primary w-100"
              onClick={handleBookAppointment}
              disabled={!selectedTimeSlot || !appointmentDetails.issue.trim() || booking}
            >
              {booking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Booking...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
