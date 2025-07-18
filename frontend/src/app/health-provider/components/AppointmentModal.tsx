import React from 'react';
import type { Appointment } from '../page';

interface AppointmentModalProps {
  appointment: Appointment;
  show: boolean;
  onClose: () => void;
  onSaveNotes: (notes: string) => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ appointment, show, onClose, onSaveNotes }) => {
  const [notes, setNotes] = React.useState(appointment.provider_notes || '');

  React.useEffect(() => {
    setNotes(appointment.provider_notes || '');
  }, [appointment]);

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Appointment Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Patient Information</h6>
                <p><strong>Name:</strong> {appointment.patient_name}</p>
                <p><strong>Phone:</strong> {appointment.patient_phone}</p>
                <p><strong>Email:</strong> {appointment.patient_email}</p>
              </div>
              <div className="col-md-6">
                <h6>Appointment Details</h6>
                <p><strong>Status:</strong> {appointment.status}</p>
                <p><strong>Priority:</strong> {appointment.priority}</p>
                <p><strong>Scheduled:</strong> {appointment.appointment_date}</p>
                {appointment.preferred_date && (
                  <p><strong>Preferred Date:</strong> {appointment.preferred_date}</p>
                )}
              </div>
            </div>
            <div className="mt-3">
              <h6>Patient's Issue</h6>
              <div className="border rounded p-3 bg-light">
                {appointment.issue}
              </div>
            </div>
            {appointment.notes && (
              <div className="mt-3">
                <h6>Patient Notes</h6>
                <div className="border rounded p-3 bg-light">
                  {appointment.notes}
                </div>
              </div>
            )}
            <div className="mt-3">
              <h6>Provider Notes</h6>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Add your notes here..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={() => onSaveNotes(notes)}>Save Notes</button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default AppointmentModal;
