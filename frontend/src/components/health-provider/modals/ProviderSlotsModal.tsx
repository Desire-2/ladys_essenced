'use client';

import type { HealthProvider, TimeSlot } from '../../../types/health-provider';

interface ProviderSlotsModalProps {
  show: boolean;
  selectedProvider: HealthProvider;
  selectedDate: string;
  selectedTimeSlot: TimeSlot | null;
  providerTimeSlots: TimeSlot[];
  loadingTimeSlots: boolean;
  onClose: () => void;
  onDateChange: (date: string) => void;
  onTimeSlotSelection: (slot: TimeSlot) => void;
  onBookSlot: () => void;
}

export default function ProviderSlotsModal({
  show,
  selectedProvider,
  selectedDate,
  selectedTimeSlot,
  providerTimeSlots,
  loadingTimeSlots,
  onClose,
  onDateChange,
  onTimeSlotSelection,
  onBookSlot
}: ProviderSlotsModalProps) {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-calendar-check me-2"></i>
              Book Appointment with {selectedProvider.name}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="provider-info mb-4">
              <div className="card bg-light">
                <div className="card-body">
                  <h6>{selectedProvider.name}</h6>
                  <p className="text-muted mb-0">{selectedProvider.specialization} at {selectedProvider.clinic_name}</p>
                </div>
              </div>
            </div>

            <div className="date-selection mb-4">
              <label className="form-label">Select Date:</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>

            <div className="time-slots">
              <h6>Available Time Slots for {selectedDate}:</h6>
              {loadingTimeSlots ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading time slots...</span>
                  </div>
                </div>
              ) : providerTimeSlots.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  No available time slots for this date.
                </div>
              ) : (
                <div className="row">
                  {providerTimeSlots.map((slot, index) => (
                    <div key={index} className="col-md-4 col-sm-6 mb-2">
                      <button
                        className={`btn w-100 ${
                          selectedTimeSlot?.time === slot.time 
                            ? 'btn-primary' 
                            : slot.is_available 
                              ? 'btn-outline-primary' 
                              : 'btn-outline-secondary'
                        }`}
                        disabled={!slot.is_available}
                        onClick={() => onTimeSlotSelection(slot)}
                      >
                        {slot.time}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={!selectedTimeSlot || !selectedTimeSlot.is_available}
              onClick={onBookSlot}
            >
              <i className="fas fa-check me-1"></i>
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
