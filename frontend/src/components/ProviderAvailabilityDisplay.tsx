import React, { useState, useEffect } from 'react';
import { useEnhancedAvailability } from '../hooks/useEnhancedAvailability';

interface ProviderAvailabilityDisplayProps {
  providerId: number;
  providerName: string;
  showDetailedView?: boolean;
  onSlotSelect?: (slot: any) => void;
  className?: string;
}

export const ProviderAvailabilityDisplay: React.FC<ProviderAvailabilityDisplayProps> = ({
  providerId,
  providerName,
  showDetailedView = false,
  onSlotSelect,
  className = ''
}) => {
  const {
    nextAvailableSlot,
    availabilitySummary,
    loading,
    error,
    getNextAvailableSlot,
    getAvailabilitySummary,
    formatAvailabilityDisplay,
    getAvailabilityStatusColor
  } = useEnhancedAvailability();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showWeeklyPattern, setShowWeeklyPattern] = useState(false);

  useEffect(() => {
    // Load next available slot when component mounts
    getNextAvailableSlot(providerId);
    
    if (showDetailedView) {
      getAvailabilitySummary(providerId);
    }
  }, [providerId, showDetailedView, getNextAvailableSlot, getAvailabilitySummary]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (onSlotSelect) {
      // You could implement slot selection logic here
    }
  };

  const getDayAvailabilityIcon = (isAvailable: boolean, availableSlots: number, totalSlots: number) => {
    if (!isAvailable) return '❌';
    if (availableSlots === totalSlots) return '✅';
    if (availableSlots > totalSlots * 0.7) return '🟢';
    if (availableSlots > totalSlots * 0.3) return '🟡';
    return '🔴';
  };

  if (loading) {
    return (
      <div className={`availability-display ${className}`}>
        <div className="text-center">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading availability...</span>
          </div>
          <small className="d-block mt-1 text-muted">Loading availability...</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`availability-display ${className}`}>
        <div className="text-danger small">
          <i className="fas fa-exclamation-triangle me-1"></i>
          Error loading availability
        </div>
      </div>
    );
  }

  return (
    <div className={`availability-display ${className}`}>
      {/* Next Available Slot */}
      <div className="next-available-slot mb-2">
        <strong className={`${getAvailabilityStatusColor(formatAvailabilityDisplay(nextAvailableSlot))}`}>
          <i className="fas fa-clock me-1"></i>
          {formatAvailabilityDisplay(nextAvailableSlot)}
        </strong>
      </div>

      {/* Detailed View */}
      {showDetailedView && availabilitySummary && (
        <div className="detailed-availability">
          {/* Quick Summary */}
          <div className="availability-quick-summary mb-3">
            <div className="row text-center">
              <div className="col-4">
                <div className="availability-stat">
                  <div className="stat-value text-success">
                    {availabilitySummary.availability_summary.filter(day => day.is_available && day.available_slots > 0).length}
                  </div>
                  <div className="stat-label small text-muted">Days Available</div>
                </div>
              </div>
              <div className="col-4">
                <div className="availability-stat">
                  <div className="stat-value text-info">
                    {Math.round(availabilitySummary.availability_summary.reduce((acc, day) => acc + day.availability_percentage, 0) / availabilitySummary.availability_summary.length)}%
                  </div>
                  <div className="stat-label small text-muted">Avg. Available</div>
                </div>
              </div>
              <div className="col-4">
                <div className="availability-stat">
                  <div className="stat-value text-primary">
                    {availabilitySummary.availability_summary.reduce((acc, day) => acc + day.available_slots, 0)}
                  </div>
                  <div className="stat-label small text-muted">Total Slots</div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Pattern Toggle */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => setShowWeeklyPattern(!showWeeklyPattern)}
            >
              <i className={`fas fa-calendar-week me-1`}></i>
              {showWeeklyPattern ? 'Hide' : 'Show'} Weekly Schedule
            </button>
          </div>

          {/* Weekly Pattern */}
          {showWeeklyPattern && (
            <div className="weekly-pattern mb-3">
              <h6 className="text-muted mb-2">
                <i className="fas fa-calendar-week me-1"></i>
                Weekly Schedule
              </h6>
              <div className="row">
                {Object.entries(availabilitySummary.weekly_pattern).map(([day, pattern]) => (
                  <div key={day} className="col-12 mb-1">
                    <div className={`d-flex justify-content-between align-items-center p-2 rounded ${pattern.available ? 'bg-light-success' : 'bg-light-secondary'}`}>
                      <span className="fw-medium">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      {pattern.available ? (
                        <span className="text-success small">
                          {pattern.start_time} - {pattern.end_time}
                        </span>
                      ) : (
                        <span className="text-muted small">Not available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next 7 Days Availability */}
          <div className="upcoming-availability">
            <h6 className="text-muted mb-2">
              <i className="fas fa-calendar-day me-1"></i>
              Next {availabilitySummary.summary_period_days} Days
            </h6>
            <div className="availability-calendar">
              {availabilitySummary.availability_summary.map((day, index) => (
                <div
                  key={day.date}
                  className={`availability-day-card p-2 mb-2 border rounded cursor-pointer ${selectedDate === day.date ? 'border-primary bg-light' : ''} ${day.is_available ? 'border-success' : 'border-secondary'}`}
                  onClick={() => handleDateSelect(day.date)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-medium">
                        {getDayAvailabilityIcon(day.is_available, day.available_slots, day.total_slots)}
                        {' '}
                        {day.day_name}
                      </div>
                      <small className="text-muted">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </small>
                    </div>
                    <div className="text-end">
                      {day.is_available ? (
                        <>
                          <div className="text-success fw-bold">
                            {day.available_slots}/{day.total_slots}
                          </div>
                          <small className="text-muted">
                            {day.availability_percentage}% free
                          </small>
                        </>
                      ) : (
                        <small className="text-muted">Unavailable</small>
                      )}
                    </div>
                  </div>
                  
                  {day.is_available && (
                    <div className="mt-1">
                      <small className="text-muted">
                        {day.start_time} - {day.end_time}
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderAvailabilityDisplay;
