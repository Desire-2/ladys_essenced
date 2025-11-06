import React, { useState } from 'react';

interface AddAppointmentProps {
  childId: number;
  childName: string;
  onSuccess?: () => void;
}

export const AddAppointment: React.FC<AddAppointmentProps> = ({ childId, childName, onSuccess }) => {
  const [formData, setFormData] = useState({
    appointment_for: '',
    appointment_date: '',
    issue: '',
    status: 'pending',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.appointment_for.trim()) {
      setError('Please enter appointment type/reason');
      return;
    }

    if (!formData.appointment_date) {
      setError('Please select appointment date');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const submitData = {
        user_id: childId,
        appointment_for: formData.appointment_for,
        appointment_date: formData.appointment_date,
        issue: formData.issue || null,
        status: formData.status,
        notes: formData.notes || null
      };

      const response = await fetch('http://localhost:5001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add appointment');
      }

      setSuccess(`Appointment scheduled successfully for ${childName}!`);
      setFormData({
        appointment_for: '',
        appointment_date: '',
        issue: '',
        status: 'pending',
        notes: ''
      });

      setTimeout(() => {
        setSuccess('');
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add appointment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
        <h5 className="mb-0 text-white">
          <i className="fas fa-calendar-plus me-2"></i>
          Schedule Appointment for {childName}
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Appointment Type */}
            <div className="col-12 mb-3">
              <label htmlFor="appointmentFor" className="form-label">
                <i className="fas fa-hospital-user me-2 text-primary"></i>
                Appointment Type/Reason *
              </label>
              <input
                type="text"
                id="appointmentFor"
                className="form-control"
                name="appointment_for"
                value={formData.appointment_for}
                onChange={handleChange}
                placeholder="e.g., Gynecology checkup, Health screening"
                required
              />
            </div>

            {/* Appointment Date & Time */}
            <div className="col-md-6 mb-3">
              <label htmlFor="appointmentDate" className="form-label">
                <i className="fas fa-calendar-alt me-2 text-primary"></i>
                Date & Time *
              </label>
              <input
                type="datetime-local"
                id="appointmentDate"
                className="form-control"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Status */}
            <div className="col-md-6 mb-3">
              <label htmlFor="status" className="form-label">
                <i className="fas fa-info-circle me-2 text-primary"></i>
                Status *
              </label>
              <select
                id="status"
                className="form-control"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Issue/Health Concern */}
            <div className="col-12 mb-3">
              <label htmlFor="issue" className="form-label">
                <i className="fas fa-notes-medical me-2 text-primary"></i>
                Health Issue/Concern
              </label>
              <textarea
                id="issue"
                className="form-control"
                name="issue"
                value={formData.issue}
                onChange={handleChange}
                rows={2}
                placeholder="Describe the health concern or reason for visit..."
              />
            </div>

            {/* Notes */}
            <div className="col-12 mb-3">
              <label htmlFor="notes" className="form-label">
                <i className="fas fa-clipboard me-2 text-primary"></i>
                Additional Notes
              </label>
              <textarea
                id="notes"
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Add any additional information or instructions..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Scheduling...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Schedule Appointment
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="alert alert-info mt-3 mb-0 small">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Tip:</strong> Keep track of health appointments to ensure timely medical care.
        </div>
      </div>
    </div>
  );
};
