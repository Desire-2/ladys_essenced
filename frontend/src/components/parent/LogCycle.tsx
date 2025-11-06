import React, { useState } from 'react';
import { useParent } from '@/contexts/ParentContext';

interface LogCycleProps {
  childId: number;
  childName: string;
  onSuccess?: () => void;
}

export const LogCycle: React.FC<LogCycleProps> = ({ childId, childName, onSuccess }) => {
  const { selectedChild } = useParent();
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    cycle_length: '',
    period_length: '',
    symptoms: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (!formData.start_date) {
      setError('Please enter start date');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const submitData = {
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        cycle_length: formData.cycle_length ? parseInt(formData.cycle_length) : null,
        period_length: formData.period_length ? parseInt(formData.period_length) : null,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : [],
        notes: formData.notes
      };

      // Use parent endpoint to log cycle for child
      const response = await fetch(`http://localhost:5001/api/parents/children/${childId}/cycle-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to log cycle');
      }

      setSuccess(`Cycle logged successfully for ${childName}!`);
      setFormData({
        start_date: '',
        end_date: '',
        cycle_length: '',
        period_length: '',
        symptoms: '',
        notes: ''
      });

      setTimeout(() => {
        setSuccess('');
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to log cycle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h5 className="mb-0 text-white">
          <i className="fas fa-calendar-check me-2"></i>
          Log Cycle for {childName}
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
            {/* Start Date */}
            <div className="col-md-6 mb-3">
              <label htmlFor="startDate" className="form-label">
                <i className="fas fa-play-circle me-2 text-primary"></i>
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                className="form-control"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* End Date */}
            <div className="col-md-6 mb-3">
              <label htmlFor="endDate" className="form-label">
                <i className="fas fa-stop-circle me-2 text-primary"></i>
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                className="form-control"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>

            {/* Cycle Length */}
            <div className="col-md-6 mb-3">
              <label htmlFor="cycleLength" className="form-label">
                <i className="fas fa-history me-2 text-primary"></i>
                Cycle Length (days)
              </label>
              <input
                type="number"
                id="cycleLength"
                className="form-control"
                name="cycle_length"
                value={formData.cycle_length}
                onChange={handleChange}
                placeholder="e.g., 28"
                min="1"
                max="60"
              />
            </div>

            {/* Period Length */}
            <div className="col-md-6 mb-3">
              <label htmlFor="periodLength" className="form-label">
                <i className="fas fa-calendar-days me-2 text-primary"></i>
                Period Length (days)
              </label>
              <input
                type="number"
                id="periodLength"
                className="form-control"
                name="period_length"
                value={formData.period_length}
                onChange={handleChange}
                placeholder="e.g., 5"
                min="1"
                max="14"
              />
            </div>

            {/* Symptoms */}
            <div className="col-12 mb-3">
              <label htmlFor="symptoms" className="form-label">
                <i className="fas fa-heartbeat me-2 text-primary"></i>
                Symptoms (comma-separated)
              </label>
              <input
                type="text"
                id="symptoms"
                className="form-control"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="e.g., cramps, bloating, fatigue"
              />
              <small className="text-muted d-block mt-1">
                Enter symptoms separated by commas
              </small>
            </div>

            {/* Notes */}
            <div className="col-12 mb-3">
              <label htmlFor="notes" className="form-label">
                <i className="fas fa-sticky-note me-2 text-primary"></i>
                Notes
              </label>
              <textarea
                id="notes"
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Add any additional notes..."
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
                  Logging...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Log Cycle
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="alert alert-info mt-3 mb-0 small">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Tip:</strong> Accurately logging cycles helps track patterns and predict future cycles.
        </div>
      </div>
    </div>
  );
};
