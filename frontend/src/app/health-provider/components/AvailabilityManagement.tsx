import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface AvailabilityHours {
  [day: string]: {
    start: string;
    end: string;
    enabled: boolean;
  };
}

interface BreakTime {
  start: string;
  end: string;
  label: string;
}

interface CustomSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string;
  created_at: string;
}

interface BlockedSlot {
  start_time: string;
  end_time: string;
  reason: string;
  notes: string;
  created_at: string;
}

interface AvailabilitySettings {
  provider_id: number;
  availability_hours: AvailabilityHours;
  break_times: BreakTime[];
  slot_duration: number;
  advance_booking_days: number;
  buffer_time: number;
  timezone: string;
  custom_slots?: { [date: string]: CustomSlot[] };
  blocked_slots?: { [date: string]: BlockedSlot[] };
}

interface AvailabilityManagementProps {
  providerId: number;
}

// Enhanced Time slot interface for visual calendar
interface TimeSlot {
  time: string;
  available: boolean;
  booked: boolean;
  blocked: boolean;
  custom: boolean;
}

// Calendar view interface
interface CalendarDay {
  date: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  slots: TimeSlot[];
}

const AvailabilityManagement: React.FC<AvailabilityManagementProps> = ({ providerId }) => {
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showPreview, setShowPreview] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [quickTemplates, setQuickTemplates] = useState([
    { name: 'Standard Weekdays', pattern: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false } },
    { name: 'Monday-Saturday', pattern: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false } },
    { name: 'Weekends Only', pattern: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: true, sunday: true } }
  ]);
  
  const [customSlotForm, setCustomSlotForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    is_available: true,
    notes: '',
    recurring: false,
    recurringDays: [] as string[]
  });
  
  const [blockSlotForm, setBlockSlotForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    reason: '',
    notes: '',
    recurring: false,
    recurringDays: [] as string[]
  });

  const [breakTimeForm, setBreakTimeForm] = useState({
    start: '',
    end: '',
    label: '',
    days: [] as string[]
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    // Only load availability settings if we have a valid provider ID
    if (providerId > 0) {
      loadAvailabilitySettings();
    }
  }, [providerId]);

  // Helper functions for enhanced UI
  const generateTimeSlots = useCallback((start: string, end: string, duration: number = 30): string[] => {
    const slots = [];
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    
    let current = new Date(startTime);
    while (current < endTime) {
      slots.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
  }, []);

  const getDayStatus = useCallback((day: string): { enabled: boolean, hours: string, slots: number } => {
    if (!availabilitySettings) return { enabled: false, hours: '', slots: 0 };
    
    const daySettings = availabilitySettings.availability_hours[day];
    if (!daySettings?.enabled) return { enabled: false, hours: 'Closed', slots: 0 };
    
    const hours = `${daySettings.start} - ${daySettings.end}`;
    const slots = generateTimeSlots(daySettings.start, daySettings.end, availabilitySettings.slot_duration).length;
    
    return { enabled: true, hours, slots };
  }, [availabilitySettings, generateTimeSlots]);

  const getWeekSummary = useCallback(() => {
    if (!availabilitySettings) return { totalHours: 0, totalSlots: 0, activeDays: 0 };
    
    let totalMinutes = 0;
    let totalSlots = 0;
    let activeDays = 0;
    
    daysOfWeek.forEach(day => {
      const daySettings = availabilitySettings.availability_hours[day];
      if (daySettings?.enabled) {
        activeDays++;
        const start = new Date(`2000-01-01 ${daySettings.start}`);
        const end = new Date(`2000-01-01 ${daySettings.end}`);
        const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
        totalMinutes += minutes;
        totalSlots += Math.floor(minutes / availabilitySettings.slot_duration);
      }
    });
    
    return {
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      totalSlots,
      activeDays
    };
  }, [availabilitySettings, daysOfWeek]);

  const applyTemplate = useCallback((template: any) => {
    if (!availabilitySettings) return;
    
    const updatedHours = { ...availabilitySettings.availability_hours };
    Object.entries(template.pattern).forEach(([day, enabled]) => {
      if (updatedHours[day]) {
        updatedHours[day].enabled = enabled as boolean;
      }
    });
    
    setAvailabilitySettings({
      ...availabilitySettings,
      availability_hours: updatedHours
    });
    
    toast.success(`Applied ${template.name} template`);
  }, [availabilitySettings]);

  const bulkUpdateDays = useCallback((updates: Partial<{ start: string, end: string, enabled: boolean }>) => {
    if (!availabilitySettings || selectedDays.length === 0) return;
    
    const updatedHours = { ...availabilitySettings.availability_hours };
    selectedDays.forEach(day => {
      if (updatedHours[day]) {
        updatedHours[day] = { ...updatedHours[day], ...updates };
      }
    });
    
    setAvailabilitySettings({
      ...availabilitySettings,
      availability_hours: updatedHours
    });
    
    toast.success(`Updated ${selectedDays.length} days`);
    setSelectedDays([]);
    setBulkEditMode(false);
  }, [availabilitySettings, selectedDays]);

  const validateTimeSlot = useCallback((start: string, end: string): { valid: boolean, message: string } => {
    if (!start || !end) return { valid: false, message: 'Please select both start and end times' };
    
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    
    if (startTime >= endTime) {
      return { valid: false, message: 'End time must be after start time' };
    }
    
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (duration < 15) {
      return { valid: false, message: 'Time slot must be at least 15 minutes' };
    }
    
    return { valid: true, message: '' };
  }, []);

  const addBreakTime = useCallback(() => {
    if (!availabilitySettings) return;
    
    const validation = validateTimeSlot(breakTimeForm.start, breakTimeForm.end);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    const newBreakTime: BreakTime = {
      start: breakTimeForm.start,
      end: breakTimeForm.end,
      label: breakTimeForm.label || 'Break'
    };
    
    setAvailabilitySettings({
      ...availabilitySettings,
      break_times: [...availabilitySettings.break_times, newBreakTime]
    });
    
    setBreakTimeForm({ start: '', end: '', label: '', days: [] });
    toast.success('Break time added');
  }, [availabilitySettings, breakTimeForm, validateTimeSlot]);

  const removeBreakTime = useCallback((index: number) => {
    if (!availabilitySettings) return;
    
    const updatedBreakTimes = availabilitySettings.break_times.filter((_, i) => i !== index);
    setAvailabilitySettings({
      ...availabilitySettings,
      break_times: updatedBreakTimes
    });
    
    toast.success('Break time removed');
  }, [availabilitySettings]);

  const loadAvailabilitySettings = async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping availability settings load - invalid provider ID:', providerId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/health-provider/test/availability?provider_id=${providerId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailabilitySettings(data);
      } else {
        toast.error('Failed to load availability settings');
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const saveAvailabilitySettings = async () => {
    if (!availabilitySettings) return;

    try {
      setSaving(true);
      // TEMPORARY: Use test endpoint for demo/testing
      const response = await fetch('/api/health-provider/test/availability?provider_id=1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(availabilitySettings)
      });

      if (response.ok) {
        toast.success('Availability settings saved successfully');
      } else {
        toast.error('Failed to save availability settings');
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
      toast.error('Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  const updateDayAvailability = (day: string, field: string, value: any) => {
    if (!availabilitySettings) return;

    setAvailabilitySettings(prev => ({
      ...prev!,
      availability_hours: {
        ...prev!.availability_hours,
        [day]: {
          ...prev!.availability_hours[day],
          [field]: value
        }
      }
    }));
  };

  const createCustomSlot = async () => {
    try {
      const response = await fetch(`/api/health-provider/test/availability/slots?provider_id=${providerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customSlotForm)
      });

      if (response.ok) {
        toast.success('Custom slot created successfully');
        setCustomSlotForm({
          date: '',
          start_time: '',
          end_time: '',
          is_available: true,
          notes: '',
          recurring: false,
          recurringDays: []
        });
        loadAvailabilitySettings();
      } else {
        toast.error('Failed to create custom slot');
      }
    } catch (error) {
      console.error('Failed to create custom slot:', error);
      toast.error('Failed to create custom slot');
    }
  };

  const blockTimeSlot = async () => {
    try {
      const response = await fetch(`/api/health-provider/test/availability/block?provider_id=${providerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blockSlotForm)
      });

      if (response.ok) {
        toast.success('Time slot blocked successfully');
        setBlockSlotForm({
          date: '',
          start_time: '',
          end_time: '',
          reason: '',
          notes: '',
          recurring: false,
          recurringDays: []
        });
        loadAvailabilitySettings();
      } else {
        toast.error('Failed to block time slot');
      }
    } catch (error) {
      console.error('Failed to block time slot:', error);
      toast.error('Failed to block time slot');
    }
  };

  const deleteCustomSlots = async (date: string) => {
    try {
      const response = await fetch(`/api/health-provider/test/availability/slots/${date}?provider_id=${providerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Custom slots deleted successfully');
        loadAvailabilitySettings();
      } else {
        toast.error('Failed to delete custom slots');
      }
    } catch (error) {
      console.error('Failed to delete custom slots:', error);
      toast.error('Failed to delete custom slots');
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <div className="d-flex flex-column align-items-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="text-muted mb-0">Loading Availability Settings...</h6>
          </div>
        </div>
      </div>
    );
  }

  if (!availabilitySettings) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <div className="d-flex flex-column align-items-center">
            <i className="fas fa-calendar-times text-muted mb-3" style={{ fontSize: '3rem' }}></i>
            <h6 className="text-muted mb-2">No Availability Settings Found</h6>
            <p className="text-muted small mb-3">Unable to load your availability settings. Please try refreshing the page.</p>
            <button 
              className="btn btn-outline-primary"
              onClick={loadAvailabilitySettings}
            >
              <i className="fas fa-refresh me-2"></i>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weekSummary = getWeekSummary();

  return (
    <div className="availability-management">
      {/* Enhanced Header with Stats */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-gradient-primary text-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="avatar-icon bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                <i className="fas fa-calendar-cog text-white" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <h5 className="mb-1 fw-bold">Availability Management</h5>
                <p className="mb-0 opacity-90 small">Manage your schedule and booking preferences</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {showPreview && (
                <button 
                  className="btn btn-light btn-sm"
                  onClick={() => setShowPreview(false)}
                >
                  <i className="fas fa-eye-slash me-1"></i>
                  Hide Preview
                </button>
              )}
              <button 
                className="btn btn-success"
                onClick={saveAvailabilitySettings}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="card-body border-bottom">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="fas fa-calendar-day text-primary"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold text-dark">{weekSummary.activeDays}/7</div>
                  <div className="text-muted small">Active Days</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-icon bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="fas fa-clock text-success"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold text-dark">{weekSummary.totalHours}h</div>
                  <div className="text-muted small">Weekly Hours</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-icon bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="fas fa-calendar-alt text-info"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold text-dark">{weekSummary.totalSlots}</div>
                  <div className="text-muted small">Available Slots</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-icon bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="fas fa-cog text-warning"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="fw-bold text-dark">{availabilitySettings.slot_duration}min</div>
                  <div className="text-muted small">Slot Duration</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="card-body pt-3 pb-0">
          <ul className="nav nav-pills nav-justified" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
                type="button"
              >
                <i className="fas fa-chart-pie me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
                type="button"
              >
                <i className="fas fa-calendar-week me-2"></i>
                Weekly Schedule
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'breaks' ? 'active' : ''}`}
                onClick={() => setActiveTab('breaks')}
                type="button"
              >
                <i className="fas fa-coffee me-2"></i>
                Break Times
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
                type="button"
              >
                <i className="fas fa-calendar-plus me-2"></i>
                Custom Slots
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'blocked' ? 'active' : ''}`}
                onClick={() => setActiveTab('blocked')}
                type="button"
              >
                <i className="fas fa-ban me-2"></i>
                Blocked Times
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                type="button"
              >
                <i className="fas fa-cogs me-2"></i>
                Settings
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 fw-bold">
                    <i className="fas fa-calendar-week text-primary me-2"></i>
                    Weekly Schedule Overview
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-bold">Day</th>
                          <th className="border-0 fw-bold">Status</th>
                          <th className="border-0 fw-bold">Hours</th>
                          <th className="border-0 fw-bold">Available Slots</th>
                          <th className="border-0 fw-bold">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daysOfWeek.map((day, index) => {
                          const status = getDayStatus(day);
                          return (
                            <tr key={day}>
                              <td className="fw-bold">{dayLabels[index]}</td>
                              <td>
                                <span className={`badge ${status.enabled ? 'bg-success' : 'bg-secondary'}`}>
                                  {status.enabled ? 'Open' : 'Closed'}
                                </span>
                              </td>
                              <td className="text-muted">{status.hours}</td>
                              <td>
                                {status.enabled && (
                                  <span className="badge bg-info">{status.slots} slots</span>
                                )}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => {
                                      updateDayAvailability(day, 'enabled', !status.enabled);
                                    }}
                                  >
                                    <i className={`fas ${status.enabled ? 'fa-times' : 'fa-check'}`}></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                      setActiveTab('weekly');
                                      // Scroll to day if needed
                                    }}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              {/* Quick Templates */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 fw-bold">
                    <i className="fas fa-magic text-primary me-2"></i>
                    Quick Templates
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    {quickTemplates.map((template, index) => (
                      <button
                        key={index}
                        className="btn btn-outline-primary btn-sm text-start"
                        onClick={() => applyTemplate(template)}
                      >
                        <i className="fas fa-magic me-2"></i>
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Break Times Summary */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 fw-bold">
                    <i className="fas fa-coffee text-primary me-2"></i>
                    Break Times
                  </h6>
                </div>
                <div className="card-body">
                  {availabilitySettings.break_times.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {availabilitySettings.break_times.map((breakTime, index) => (
                        <div key={index} className="list-group-item px-0 py-2 border-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-bold small">{breakTime.label}</div>
                              <div className="text-muted small">{breakTime.start} - {breakTime.end}</div>
                            </div>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeBreakTime(index)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <i className="fas fa-coffee mb-2 opacity-50" style={{ fontSize: '2rem' }}></i>
                      <p className="mb-0 small">No break times configured</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => setActiveTab('breaks')}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Manage Breaks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Schedule Tab */}
        {activeTab === 'weekly' && (
          <div>
            <h6 className="mb-3">Weekly Availability</h6>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Enabled</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map((day, index) => (
                    <tr key={day}>
                      <td className="fw-bold">{dayLabels[index]}</td>
                      <td>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={availabilitySettings.availability_hours[day]?.enabled || false}
                            onChange={(e) => updateDayAvailability(day, 'enabled', e.target.checked)}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          value={availabilitySettings.availability_hours[day]?.start || '09:00'}
                          onChange={(e) => updateDayAvailability(day, 'start', e.target.value)}
                          disabled={!availabilitySettings.availability_hours[day]?.enabled}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          value={availabilitySettings.availability_hours[day]?.end || '17:00'}
                          onChange={(e) => updateDayAvailability(day, 'end', e.target.value)}
                          disabled={!availabilitySettings.availability_hours[day]?.enabled}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custom Slots Tab */}
        {activeTab === 'custom' && (
          <div>
            <h6 className="mb-3">Custom Availability Slots</h6>
            
            {/* Add Custom Slot Form */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Add Custom Slot</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={customSlotForm.date}
                      onChange={(e) => setCustomSlotForm({...customSlotForm, date: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={customSlotForm.start_time}
                      onChange={(e) => setCustomSlotForm({...customSlotForm, start_time: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={customSlotForm.end_time}
                      onChange={(e) => setCustomSlotForm({...customSlotForm, end_time: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={customSlotForm.is_available ? 'available' : 'unavailable'}
                      onChange={(e) => setCustomSlotForm({...customSlotForm, is_available: e.target.value === 'available'})}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional notes"
                      value={customSlotForm.notes}
                      onChange={(e) => setCustomSlotForm({...customSlotForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button 
                    className="btn btn-success"
                    onClick={createCustomSlot}
                    disabled={!customSlotForm.date || !customSlotForm.start_time || !customSlotForm.end_time}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Custom Slot
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Custom Slots */}
            {availabilitySettings.custom_slots && Object.keys(availabilitySettings.custom_slots).length > 0 && (
              <div>
                <h6 className="mb-3">Existing Custom Slots</h6>
                {Object.entries(availabilitySettings.custom_slots).map(([date, slots]) => (
                  <div key={date} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{new Date(date).toLocaleDateString()}</h6>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteCustomSlots(date)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <div className="card-body">
                      {slots.map((slot, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span className="fw-bold">{slot.start_time} - {slot.end_time}</span>
                            <span className={`badge ms-2 ${slot.is_available ? 'bg-success' : 'bg-danger'}`}>
                              {slot.is_available ? 'Available' : 'Unavailable'}
                            </span>
                            {slot.notes && <small className="text-muted ms-2">({slot.notes})</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blocked Times Tab */}
        {activeTab === 'blocked' && (
          <div>
            <h6 className="mb-3">Block Time Slots</h6>
            
            {/* Block Time Form */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Block Time Slot</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={blockSlotForm.date}
                      onChange={(e) => setBlockSlotForm({...blockSlotForm, date: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={blockSlotForm.start_time}
                      onChange={(e) => setBlockSlotForm({...blockSlotForm, start_time: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={blockSlotForm.end_time}
                      onChange={(e) => setBlockSlotForm({...blockSlotForm, end_time: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Reason</label>
                    <select
                      className="form-select"
                      value={blockSlotForm.reason}
                      onChange={(e) => setBlockSlotForm({...blockSlotForm, reason: e.target.value})}
                    >
                      <option value="">Select reason</option>
                      <option value="Personal Time">Personal Time</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Break">Break</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional notes"
                      value={blockSlotForm.notes}
                      onChange={(e) => setBlockSlotForm({...blockSlotForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button 
                    className="btn btn-danger"
                    onClick={blockTimeSlot}
                    disabled={!blockSlotForm.date || !blockSlotForm.start_time || !blockSlotForm.end_time || !blockSlotForm.reason}
                  >
                    <i className="fas fa-ban me-2"></i>
                    Block Time Slot
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Blocked Slots */}
            {availabilitySettings.blocked_slots && Object.keys(availabilitySettings.blocked_slots).length > 0 && (
              <div>
                <h6 className="mb-3">Blocked Time Slots</h6>
                {Object.entries(availabilitySettings.blocked_slots).map(([date, slots]) => (
                  <div key={date} className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">{new Date(date).toLocaleDateString()}</h6>
                    </div>
                    <div className="card-body">
                      {slots.map((slot, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span className="fw-bold">{slot.start_time} - {slot.end_time}</span>
                            <span className="badge bg-danger ms-2">{slot.reason}</span>
                            {slot.notes && <small className="text-muted ms-2">({slot.notes})</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Break Times Tab */}
        {activeTab === 'breaks' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-coffee text-primary me-2"></i>
                Manage Break Times
              </h6>
            </div>
            <div className="card-body">
              <div className="card border mb-4">
                <div className="card-header bg-primary bg-opacity-10 border-0">
                  <h6 className="mb-0 text-primary fw-bold">
                    <i className="fas fa-plus me-2"></i>
                    Add New Break Time
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Break Label</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Lunch Break"
                        value={breakTimeForm.label}
                        onChange={(e) => setBreakTimeForm({...breakTimeForm, label: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={breakTimeForm.start}
                        onChange={(e) => setBreakTimeForm({...breakTimeForm, start: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={breakTimeForm.end}
                        onChange={(e) => setBreakTimeForm({...breakTimeForm, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-primary"
                      onClick={addBreakTime}
                      disabled={!breakTimeForm.start || !breakTimeForm.end}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Break Time
                    </button>
                  </div>
                </div>
              </div>

              {availabilitySettings.break_times.length > 0 ? (
                <div className="card border-0">
                  <div className="card-header bg-light border-0">
                    <h6 className="mb-0 fw-bold">Current Break Times</h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                      {availabilitySettings.break_times.map((breakTime, index) => (
                        <div key={index} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                <div className="avatar-icon bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                  <i className="fas fa-coffee text-warning"></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-bold">{breakTime.label}</div>
                                <div className="text-muted small">{breakTime.start} - {breakTime.end}</div>
                              </div>
                            </div>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeBreakTime(index)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-coffee text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <h6 className="text-muted">No Break Times Configured</h6>
                  <p className="text-muted small">Add break times to automatically block slots during your breaks.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Slots Tab */}
        {activeTab === 'custom' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-calendar-plus text-primary me-2"></i>
                Custom Availability Slots
              </h6>
            </div>
            <div className="card-body">
              <div className="card border mb-4">
                <div className="card-header bg-success bg-opacity-10 border-0">
                  <h6 className="mb-0 text-success fw-bold">
                    <i className="fas fa-plus me-2"></i>
                    Add Custom Slot
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={customSlotForm.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCustomSlotForm({...customSlotForm, date: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={customSlotForm.start_time}
                        onChange={(e) => setCustomSlotForm({...customSlotForm, start_time: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={customSlotForm.end_time}
                        onChange={(e) => setCustomSlotForm({...customSlotForm, end_time: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Status</label>
                      <select
                        className="form-select"
                        value={customSlotForm.is_available ? 'available' : 'unavailable'}
                        onChange={(e) => setCustomSlotForm({...customSlotForm, is_available: e.target.value === 'available'})}
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Optional notes"
                        value={customSlotForm.notes}
                        onChange={(e) => setCustomSlotForm({...customSlotForm, notes: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-success"
                      onClick={createCustomSlot}
                      disabled={!customSlotForm.date || !customSlotForm.start_time || !customSlotForm.end_time}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Custom Slot
                    </button>
                  </div>
                </div>
              </div>

              {availabilitySettings.custom_slots && Object.keys(availabilitySettings.custom_slots).length > 0 ? (
                <div className="row g-3">
                  {Object.entries(availabilitySettings.custom_slots).map(([date, slots]) => (
                    <div key={date} className="col-md-6">
                      <div className="card border">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h6>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => deleteCustomSlots(date)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="card-body">
                          {slots.map((slot, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                              <div>
                                <span className="fw-bold">{slot.start_time} - {slot.end_time}</span>
                                <span className={`badge ms-2 ${slot.is_available ? 'bg-success' : 'bg-danger'}`}>
                                  {slot.is_available ? 'Available' : 'Unavailable'}
                                </span>
                                {slot.notes && <div className="text-muted small mt-1">{slot.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-plus text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <h6 className="text-muted">No Custom Slots</h6>
                  <p className="text-muted small">Create custom availability slots for specific dates or special hours.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blocked Times Tab */}
        {activeTab === 'blocked' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-ban text-primary me-2"></i>
                Block Time Slots
              </h6>
            </div>
            <div className="card-body">
              <div className="card border mb-4">
                <div className="card-header bg-danger bg-opacity-10 border-0">
                  <h6 className="mb-0 text-danger fw-bold">
                    <i className="fas fa-ban me-2"></i>
                    Block Time Slot
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={blockSlotForm.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBlockSlotForm({...blockSlotForm, date: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={blockSlotForm.start_time}
                        onChange={(e) => setBlockSlotForm({...blockSlotForm, start_time: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={blockSlotForm.end_time}
                        onChange={(e) => setBlockSlotForm({...blockSlotForm, end_time: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Reason</label>
                      <select
                        className="form-select"
                        value={blockSlotForm.reason}
                        onChange={(e) => setBlockSlotForm({...blockSlotForm, reason: e.target.value})}
                      >
                        <option value="">Select reason</option>
                        <option value="Personal Time">Personal Time</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Training">Training</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Vacation">Vacation</option>
                        <option value="Conference">Conference</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Optional notes"
                        value={blockSlotForm.notes}
                        onChange={(e) => setBlockSlotForm({...blockSlotForm, notes: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-danger"
                      onClick={blockTimeSlot}
                      disabled={!blockSlotForm.date || !blockSlotForm.start_time || !blockSlotForm.end_time || !blockSlotForm.reason}
                    >
                      <i className="fas fa-ban me-2"></i>
                      Block Time Slot
                    </button>
                  </div>
                </div>
              </div>

              {availabilitySettings.blocked_slots && Object.keys(availabilitySettings.blocked_slots).length > 0 ? (
                <div className="row g-3">
                  {Object.entries(availabilitySettings.blocked_slots).map(([date, slots]) => (
                    <div key={date} className="col-md-6">
                      <div className="card border-danger">
                        <div className="card-header bg-danger bg-opacity-10 border-danger">
                          <h6 className="mb-0 fw-bold text-danger">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h6>
                        </div>
                        <div className="card-body">
                          {slots.map((slot, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border border-danger rounded">
                              <div>
                                <span className="fw-bold">{slot.start_time} - {slot.end_time}</span>
                                <span className="badge bg-danger ms-2">{slot.reason}</span>
                                {slot.notes && <div className="text-muted small mt-1">{slot.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-ban text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <h6 className="text-muted">No Blocked Time Slots</h6>
                  <p className="text-muted small">Block specific time slots when you're not available for appointments.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced General Settings Tab */}
        {activeTab === 'settings' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-cogs text-primary me-2"></i>
                General Settings
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card border">
                    <div className="card-header bg-primary bg-opacity-10 border-0">
                      <h6 className="mb-0 text-primary fw-bold">
                        <i className="fas fa-clock me-2"></i>
                        Appointment Settings
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Slot Duration</label>
                        <select
                          className="form-select"
                          value={availabilitySettings.slot_duration}
                          onChange={(e) => setAvailabilitySettings({
                            ...availabilitySettings,
                            slot_duration: parseInt(e.target.value)
                          })}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                          <option value="120">2 hours</option>
                        </select>
                        <div className="form-text">Duration for each appointment slot</div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold">Buffer Time</label>
                        <select
                          className="form-select"
                          value={availabilitySettings.buffer_time}
                          onChange={(e) => setAvailabilitySettings({
                            ...availabilitySettings,
                            buffer_time: parseInt(e.target.value)
                          })}
                        >
                          <option value="0">No buffer</option>
                          <option value="5">5 minutes</option>
                          <option value="10">10 minutes</option>
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                        </select>
                        <div className="form-text">Time between appointments for preparation</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card border">
                    <div className="card-header bg-info bg-opacity-10 border-0">
                      <h6 className="mb-0 text-info fw-bold">
                        <i className="fas fa-calendar-alt me-2"></i>
                        Booking Settings
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Advance Booking</label>
                        <select
                          className="form-select"
                          value={availabilitySettings.advance_booking_days}
                          onChange={(e) => setAvailabilitySettings({
                            ...availabilitySettings,
                            advance_booking_days: parseInt(e.target.value)
                          })}
                        >
                          <option value="1">1 day</option>
                          <option value="3">3 days</option>
                          <option value="7">1 week</option>
                          <option value="14">2 weeks</option>
                          <option value="30">1 month</option>
                          <option value="60">2 months</option>
                          <option value="90">3 months</option>
                        </select>
                        <div className="form-text">How far in advance patients can book</div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold">Timezone</label>
                        <select
                          className="form-select"
                          value={availabilitySettings.timezone}
                          onChange={(e) => setAvailabilitySettings({
                            ...availabilitySettings,
                            timezone: e.target.value
                          })}
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="America/New_York">Eastern Time (EST/EDT)</option>
                          <option value="America/Chicago">Central Time (CST/CDT)</option>
                          <option value="America/Denver">Mountain Time (MST/MDT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                          <option value="Europe/London">London (GMT/BST)</option>
                          <option value="Europe/Paris">Paris (CET/CEST)</option>
                          <option value="Asia/Tokyo">Tokyo (JST)</option>
                        </select>
                        <div className="form-text">Your local timezone for appointments</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Section */}
              <div className="card border mt-4">
                <div className="card-header bg-success bg-opacity-10 border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 text-success fw-bold">
                      <i className="fas fa-eye me-2"></i>
                      Settings Preview
                    </h6>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                  </div>
                </div>
                {showPreview && (
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="text-center p-3 border rounded">
                          <div className="h4 text-primary mb-1">{availabilitySettings.slot_duration}</div>
                          <div className="small text-muted">Minutes per slot</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center p-3 border rounded">
                          <div className="h4 text-info mb-1">{availabilitySettings.buffer_time}</div>
                          <div className="small text-muted">Buffer minutes</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center p-3 border rounded">
                          <div className="h4 text-success mb-1">{availabilitySettings.advance_booking_days}</div>
                          <div className="small text-muted">Days advance booking</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Action Button for Quick Save */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <button
          className="btn btn-primary btn-lg rounded-circle shadow"
          onClick={saveAvailabilitySettings}
          disabled={saving}
          style={{ width: '60px', height: '60px' }}
        >
          {saving ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <i className="fas fa-save"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default AvailabilityManagement;
