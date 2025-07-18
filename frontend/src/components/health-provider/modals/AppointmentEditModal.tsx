'use client';

import type { Appointment, AppointmentForm } from '../../../types/health-provider';

interface AppointmentEditModalProps {
  show: boolean;
  appointment: Appointment;
  appointmentForm: AppointmentForm;
  onClose: () => void;
  onFormChange: (form: AppointmentForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AppointmentEditModal({
  show,
  appointment,
  appointmentForm,
  onClose,
  onFormChange,
  onSubmit
}: AppointmentEditModalProps) {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Appointment</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Patient:</label>
                <p className="form-control-plaintext">{appointment.patient_name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label">Issue:</label>
                <p className="form-control-plaintext">{appointment.issue}</p>
              </div>
              <div className="mb-3">
                <label htmlFor="appointment_date" className="form-label">Appointment Date & Time:</label>
                <input 
                  type="datetime-local"
                  className="form-control"
                  id="appointment_date"
                  value={appointmentForm.appointment_date}
                  onChange={(e) => onFormChange({...appointmentForm, appointment_date: e.target.value})}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="status" className="form-label">Status:</label>
                <select 
                  className="form-select"
                  id="status"
                  value={appointmentForm.status}
                  onChange={(e) => onFormChange({...appointmentForm, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="priority" className="form-label">Priority:</label>
                <select 
                  className="form-select"
                  id="priority"
                  value={appointmentForm.priority}
                  onChange={(e) => onFormChange({...appointmentForm, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="provider_notes" className="form-label">Provider Notes:</label>
                <textarea 
                  className="form-control"
                  id="provider_notes"
                  rows={3}
                  value={appointmentForm.provider_notes}
                  onChange={(e) => onFormChange({...appointmentForm, provider_notes: e.target.value})}
                  placeholder="Add your notes about this appointment..."
                />
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
              <button type="submit" className="btn btn-primary">
                Update Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
