import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { appointmentAPI, healthProviderAPI } from '../api/index';
import '../styles/enhanced-appointment-booking.css';

interface ProviderAvailability {
  provider_id: number;
  availability_hours: {
    [day: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  break_times: Array<{
    start: string;
    end: string;
    label: string;
  }>;
  slot_duration: number;
  advance_booking_days: number;
  buffer_time: number;
  timezone: string;
  custom_slots?: { [date: string]: Array<{
    start_time: string;
    end_time: string;
    is_available: boolean;
    notes: string;
  }> };
  blocked_slots?: { [date: string]: Array<{
    start_time: string;
    end_time: string;
    reason: string;
    notes: string;
  }> };
}

interface Provider {
  id: number;
  name: string;
  specialization: string;
  is_verified: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface EnhancedAppointmentBookingProps {
  onAppointmentBooked?: () => void;
  selectedChild?: number | null; // This is the user_id of selected child
  children?: Array<{ id: number; name: string; user_id: number; }>;
}

const EnhancedAppointmentBooking: React.FC<EnhancedAppointmentBookingProps> = ({ 
  onAppointmentBooked, 
  selectedChild, 
  children = [] 
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [providerAvailability, setProviderAvailability] = useState<ProviderAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<'provider' | 'datetime' | 'details' | 'confirmation'>('provider');
  
  // Form data
  const [appointmentData, setAppointmentData] = useState<{
    issue: string;
    priority: string;
    notes: string;
    for_user_id: number | 'self' | null;
  }>({
    issue: '',
    priority: 'normal',
    notes: '',
    for_user_id: selectedChild || null // Use selectedChild user_id
  });

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Load available providers
  useEffect(() => {
    loadProviders();
  }, []);

  // Update appointment data when selectedChild changes
  useEffect(() => {
    setAppointmentData(prev => ({
      ...prev,
      for_user_id: selectedChild || null
    }));
  }, [selectedChild]);

  const loadProviders = async () => {
    try {
      const response = await healthProviderAPI.getPublicProviders();
      if (response.data) {
        setProviders(response.data.providers || []);
      }
    } catch (error: any) {
      console.error('Failed to load providers:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load providers';
      toast.error(errorMessage);
    }
  };

  const loadProviderAvailability = async (providerId: number) => {
    try {
      setLoading(true);
      const response = await healthProviderAPI.getPublicProviderAvailability(providerId);
      if (response.data) {
        setProviderAvailability(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load availability:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load provider availability';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = useCallback((date: string) => {
    if (!providerAvailability || !date) return [];

    const selectedDate = new Date(date);
    const dayName = daysOfWeek[selectedDate.getDay()];
    const dayAvailability = providerAvailability.availability_hours[dayName];

    if (!dayAvailability || !dayAvailability.enabled) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const startTime = new Date(`${date}T${dayAvailability.start}`);
    const endTime = new Date(`${date}T${dayAvailability.end}`);
    const slotDuration = providerAvailability.slot_duration;
    const bufferTime = providerAvailability.buffer_time;

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      let isAvailable = true;
      let reason = '';

      // Check break times
      const isBreakTime = providerAvailability.break_times.some(breakTime => {
        const breakStart = new Date(`${date}T${breakTime.start}`);
        const breakEnd = new Date(`${date}T${breakTime.end}`);
        return currentTime >= breakStart && currentTime < breakEnd;
      });

      if (isBreakTime) {
        isAvailable = false;
        reason = 'Break time';
      }

      // Check blocked slots
      const dateKey = date;
      const blockedSlots = providerAvailability.blocked_slots?.[dateKey] || [];
      const isBlocked = blockedSlots.some(blocked => {
        const blockStart = new Date(`${date}T${blocked.start_time}`);
        const blockEnd = new Date(`${date}T${blocked.end_time}`);
        return currentTime >= blockStart && currentTime < blockEnd;
      });

      if (isBlocked) {
        isAvailable = false;
        reason = 'Unavailable';
      }

      // Check custom slots
      const customSlots = providerAvailability.custom_slots?.[dateKey] || [];
      const customSlot = customSlots.find(custom => {
        const customStart = new Date(`${date}T${custom.start_time}`);
        const customEnd = new Date(`${date}T${custom.end_time}`);
        return currentTime >= customStart && currentTime < customEnd;
      });

      if (customSlot) {
        isAvailable = customSlot.is_available;
        reason = customSlot.is_available ? '' : 'Custom unavailable';
      }

      // Check if slot is in the past
      const now = new Date();
      if (currentTime <= now) {
        isAvailable = false;
        reason = 'Past time';
      }

      slots.push({
        time: timeString,
        available: isAvailable,
        reason
      });

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration + bufferTime);
    }

    return slots;
  }, [providerAvailability, daysOfWeek]);

  // Generate slots when date or provider changes
  useEffect(() => {
    if (selectedDate && providerAvailability) {
      const slots = generateAvailableSlots(selectedDate);
      setAvailableSlots(slots);
    }
  }, [selectedDate, providerAvailability, generateAvailableSlots]);

  // Get minimum and maximum booking dates
  const getBookingDateLimits = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1); // Tomorrow

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + (providerAvailability?.advance_booking_days || 30));

    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };

  const handleProviderSelect = async (providerId: number) => {
    setSelectedProvider(providerId);
    await loadProviderAvailability(providerId);
    setBookingStep('datetime');
  };

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }
    setBookingStep('details');
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);
      
      // Validate required fields and handle 'self' option
      let targetUserId = appointmentData.for_user_id;
      if (appointmentData.for_user_id === 'self') {
        // For 'self', don't pass for_user_id (backend will use current user)
        targetUserId = null;
      } else if (!appointmentData.for_user_id) {
        toast.error('Please select who this appointment is for');
        return;
      }
      
      const appointmentPayload = {
        provider_id: selectedProvider,
        appointment_date: `${selectedDate}T${selectedTime}`,
        issue: appointmentData.issue,
        priority: appointmentData.priority,
        notes: appointmentData.notes,
        ...(targetUserId && { for_user_id: targetUserId }), // Only include if not for self
        status: 'pending'
      };

      console.log('🔍 Booking appointment with payload:', appointmentPayload);

      // Use the appointmentAPI for consistent error handling
      const response = await appointmentAPI.createAppointment(appointmentPayload);

      if (response.data) {
        toast.success('Appointment booked successfully!');
        setBookingStep('confirmation');
        if (onAppointmentBooked) {
          onAppointmentBooked();
        }
      }
    } catch (error: any) {
      console.error('Failed to book appointment:', error);
      let errorMessage = 'Failed to book appointment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Provide more helpful error messages for common issues
        if (errorMessage.includes('Child record not found')) {
          errorMessage = 'The selected child account is not properly set up. Please contact support or try creating the appointment for yourself first.';
        } else if (errorMessage.includes('Parent record not found')) {
          errorMessage = 'Your parent account is not properly set up. Please contact support.';
        } else if (errorMessage.includes('No relationship found')) {
          errorMessage = 'You do not have permission to create appointments for this child. Please contact support if this seems incorrect.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setSelectedProvider(null);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setProviderAvailability(null);
    setAppointmentData({
      issue: '',
      priority: 'normal',
      notes: '',
      for_user_id: selectedChild || null // Use selectedChild user_id
    });
    setBookingStep('provider');
  };

  const dateLimit = providerAvailability ? getBookingDateLimits() : { min: '', max: '' };

  return (
    <div className="enhanced-appointment-booking">
      {/* Progress Steps */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <i className="fas fa-calendar-plus text-primary me-2"></i>
              Book Appointment
            </h5>
            <div className="progress" style={{ width: '200px', height: '8px' }}>
              <div 
                className="progress-bar bg-primary" 
                style={{ 
                  width: bookingStep === 'provider' ? '25%' : 
                         bookingStep === 'datetime' ? '50%' : 
                         bookingStep === 'details' ? '75%' : '100%' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between">
            <small className={`${bookingStep === 'provider' ? 'text-primary fw-bold' : 'text-muted'}`}>
              1. Select Provider
            </small>
            <small className={`${bookingStep === 'datetime' ? 'text-primary fw-bold' : 'text-muted'}`}>
              2. Choose Date & Time
            </small>
            <small className={`${bookingStep === 'details' ? 'text-primary fw-bold' : 'text-muted'}`}>
              3. Appointment Details
            </small>
            <small className={`${bookingStep === 'confirmation' ? 'text-primary fw-bold' : 'text-muted'}`}>
              4. Confirmation
            </small>
          </div>
        </div>
      </div>

      {/* Step 1: Provider Selection */}
      {bookingStep === 'provider' && (
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="fas fa-user-md text-primary me-2"></i>
              Select a Health Provider
            </h6>
          </div>
          <div className="card-body">
            {providers.length > 0 ? (
              <div className="row g-3">
                {providers.map(provider => (
                  <div key={provider.id} className="col-md-6">
                    <div 
                      className="card border h-100 cursor-pointer hover-shadow"
                      onClick={() => handleProviderSelect(provider.id)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                          <div className="me-3">
                            <div className="avatar-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                              <i className="fas fa-user-md text-primary"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold">{provider.name}</h6>
                            <p className="mb-1 text-muted small">{provider.specialization}</p>
                            {provider.is_verified && (
                              <span className="badge bg-success">
                                <i className="fas fa-check me-1"></i>
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="btn btn-outline-primary btn-sm w-100">
                          Select Provider
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-user-md text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <h6 className="text-muted">No Providers Available</h6>
                <p className="text-muted small">Please check back later for available providers.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time Selection */}
      {bookingStep === 'datetime' && selectedProvider && (
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-calendar-alt text-primary me-2"></i>
                Choose Date & Time
              </h6>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setBookingStep('provider')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-4">
                  <label className="form-label fw-bold">Select Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    min={dateLimit.min}
                    max={dateLimit.max}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  {providerAvailability && (
                    <div className="form-text">
                      <i className="fas fa-info-circle me-1"></i>
                      You can book up to {providerAvailability.advance_booking_days} days in advance
                    </div>
                  )}
                </div>

                {selectedDate && providerAvailability && (
                  <div className="card border">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="fas fa-clock text-primary me-2"></i>
                        Provider Schedule for {new Date(selectedDate).toLocaleDateString()}
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <small className="text-muted">Appointment Duration:</small>
                        <span className="badge bg-info ms-2">{providerAvailability.slot_duration} minutes</span>
                      </div>
                      {providerAvailability.buffer_time > 0 && (
                        <div className="mb-2">
                          <small className="text-muted">Buffer Time:</small>
                          <span className="badge bg-secondary ms-2">{providerAvailability.buffer_time} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-6">
                {selectedDate && (
                  <div>
                    <label className="form-label fw-bold">Available Time Slots</label>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading available slots...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="time-slots-grid" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="row g-2">
                          {availableSlots.map((slot, index) => (
                            <div key={index} className="col-6 col-sm-4">
                              <button
                                className={`btn w-100 ${
                                  slot.available 
                                    ? selectedTime === slot.time 
                                      ? 'btn-primary' 
                                      : 'btn-outline-primary'
                                    : 'btn-outline-secondary'
                                }`}
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.time)}
                                title={slot.reason || ''}
                              >
                                {slot.time}
                                {!slot.available && (
                                  <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>
                                    {slot.reason}
                                  </small>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-calendar-times text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                        <h6 className="text-muted">No Available Slots</h6>
                        <p className="text-muted small">The provider has no available slots for this date.</p>
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <div className="mt-4">
                        <div className="alert alert-success">
                          <i className="fas fa-check-circle me-2"></i>
                          <strong>Selected:</strong> {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                        </div>
                        <button 
                          className="btn btn-primary w-100"
                          onClick={handleDateTimeSelect}
                        >
                          Continue to Details
                          <i className="fas fa-arrow-right ms-2"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Appointment Details */}
      {bookingStep === 'details' && (
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-edit text-primary me-2"></i>
                Appointment Details
              </h6>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setBookingStep('datetime')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-clipboard-list me-1"></i>
                    Reason for Appointment *
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Please describe the reason for your appointment..."
                    value={appointmentData.issue}
                    onChange={(e) => setAppointmentData({ ...appointmentData, issue: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Priority Level
                  </label>
                  <select
                    className="form-select"
                    value={appointmentData.priority}
                    onChange={(e) => setAppointmentData({ ...appointmentData, priority: e.target.value })}
                  >
                    <option value="low">Low - Routine check-up</option>
                    <option value="normal">Normal - Standard consultation</option>
                    <option value="high">High - Urgent but not emergency</option>
                    <option value="urgent">Urgent - Requires immediate attention</option>
                  </select>
                </div>

                {children.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-user me-1"></i>
                      Appointment For
                    </label>
                    <select
                      className="form-select"
                      value={appointmentData.for_user_id || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAppointmentData({ 
                          ...appointmentData, 
                          for_user_id: value === 'self' ? 'self' : (value ? parseInt(value) : null)
                        });
                      }}
                    >
                      <option value="">Select who this appointment is for</option>
                      <option value="self">Myself</option>
                      {children.map(child => (
                        <option key={child.id} value={child.user_id}>
                          {child.name} {selectedChild === child.user_id ? '(Currently Selected)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedChild && (
                      <small className="text-muted">
                        Currently viewing data for: <strong>{children.find(c => c.user_id === selectedChild)?.name}</strong>
                      </small>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-sticky-note me-1"></i>
                    Additional Notes
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Any additional information that might be helpful..."
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                  />
                </div>

                <button 
                  className="btn btn-success w-100"
                  onClick={handleBookAppointment}
                  disabled={!appointmentData.issue.trim() || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Booking Appointment...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Book Appointment
                    </>
                  )}
                </button>
              </div>

              <div className="col-md-4">
                <div className="card border">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle text-primary me-2"></i>
                      Appointment Summary
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <small className="text-muted">Provider:</small>
                      <div className="fw-bold">
                        {providers.find(p => p.id === selectedProvider)?.name}
                      </div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Date:</small>
                      <div className="fw-bold">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Time:</small>
                      <div className="fw-bold">{selectedTime}</div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Duration:</small>
                      <div className="fw-bold">{providerAvailability?.slot_duration} minutes</div>
                    </div>
                    {appointmentData.for_user_id && (
                      <div className="mb-2">
                        <small className="text-muted">For:</small>
                        <div className="fw-bold">
                          {children.find(c => c.id === appointmentData.for_user_id)?.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <small>
                    <i className="fas fa-info-circle me-1"></i>
                    Your appointment request will be reviewed and you'll receive a confirmation shortly.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {bookingStep === 'confirmation' && (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            <h4 className="text-success mb-3">Appointment Booked Successfully!</h4>
            <p className="text-muted mb-4">
              Your appointment has been submitted and is pending confirmation from the provider.
              You will receive a notification once it's confirmed.
            </p>
            
            <div className="card border d-inline-block text-start" style={{ minWidth: '300px' }}>
              <div className="card-body">
                <h6 className="card-title">Appointment Details:</h6>
                <div className="mb-1">
                  <strong>Provider:</strong> {providers.find(p => p.id === selectedProvider)?.name}
                </div>
                <div className="mb-1">
                  <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}
                </div>
                <div className="mb-1">
                  <strong>Time:</strong> {selectedTime}
                </div>
                <div className="mb-1">
                  <strong>Status:</strong> <span className="badge bg-warning">Pending Confirmation</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button 
                className="btn btn-primary me-2"
                onClick={resetBooking}
              >
                <i className="fas fa-plus me-2"></i>
                Book Another Appointment
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-home me-2"></i>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAppointmentBooking;
