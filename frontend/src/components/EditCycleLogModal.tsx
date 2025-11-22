import React, { useState, useEffect } from 'react';
import { useCycle } from '@/contexts/CycleContext';

interface EditCycleLogModalProps {
  cycleLog: any;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditCycleLogModal: React.FC<EditCycleLogModalProps> = ({ 
  cycleLog, 
  onClose, 
  onUpdated 
}) => {
  const { updateCycleLog } = useCycle();
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    cycle_length: '',
    period_length: '',
    flow_intensity: '',
    symptoms: '',
    mood: '',
    energy_level: '',
    sleep_quality: '',
    stress_level: '',
    exercise_activities: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (cycleLog) {
      setFormData({
        start_date: cycleLog.start_date ? cycleLog.start_date.split('T')[0] : '',
        end_date: cycleLog.end_date ? cycleLog.end_date.split('T')[0] : '',
        cycle_length: cycleLog.cycle_length || '',
        period_length: cycleLog.period_length || '',
        flow_intensity: cycleLog.flow_intensity || '',
        symptoms: cycleLog.symptoms || '',
        mood: cycleLog.mood || '',
        energy_level: cycleLog.energy_level || '',
        sleep_quality: cycleLog.sleep_quality || '',
        stress_level: cycleLog.stress_level || '',
        exercise_activities: cycleLog.exercise_activities || '',
        notes: cycleLog.notes || ''
      });
    }
  }, [cycleLog]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission
      const updateData = { ...formData };
      
      // Convert empty strings to null for optional fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          updateData[key] = null;
        }
      });

      // Convert numeric fields
      if (updateData.cycle_length) {
        (updateData as any).cycle_length = parseInt(updateData.cycle_length as string);
      }
      if (updateData.period_length) {
        (updateData as any).period_length = parseInt(updateData.period_length as string);
      }

      const result = await updateCycleLog(cycleLog.id, updateData);
      
      if (result.success) {
        setSuccess('Cycle log updated successfully!');
        setTimeout(() => {
          onUpdated();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update cycle log');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update cycle log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-edit me-2"></i>
              Edit Cycle Log
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </div>
              )}

              {/* Basic Information */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-calendar me-2"></i>
                    Basic Information
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="startDate" className="form-label">
                        <i className="fas fa-play-circle me-1 text-success"></i>
                        Start Date *
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="start_date"
                        className="form-control"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="endDate" className="form-label">
                        <i className="fas fa-stop-circle me-1 text-danger"></i>
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="end_date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={handleChange}
                      />
                      <div className="form-text">Leave empty if period is ongoing</div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="cycleLength" className="form-label">
                        <i className="fas fa-history me-1 text-primary"></i>
                        Cycle Length (days)
                      </label>
                      <input
                        type="number"
                        id="cycleLength"
                        name="cycle_length"
                        className="form-control"
                        value={formData.cycle_length}
                        onChange={handleChange}
                        min="20"
                        max="45"
                        placeholder="e.g., 28"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="periodLength" className="form-label">
                        <i className="fas fa-clock me-1 text-info"></i>
                        Period Length (days)
                      </label>
                      <input
                        type="number"
                        id="periodLength"
                        name="period_length"
                        className="form-control"
                        value={formData.period_length}
                        onChange={handleChange}
                        min="2"
                        max="10"
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Flow and Symptoms */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-tint me-2"></i>
                    Flow & Symptoms
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="flowIntensity" className="form-label">
                        <i className="fas fa-chart-line me-1"></i>
                        Flow Intensity
                      </label>
                      <select
                        id="flowIntensity"
                        name="flow_intensity"
                        className="form-select"
                        value={formData.flow_intensity}
                        onChange={handleChange}
                      >
                        <option value="">Select intensity</option>
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                        <option value="very_heavy">Very Heavy</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="symptoms" className="form-label">
                        <i className="fas fa-heartbeat me-1"></i>
                        Symptoms
                      </label>
                      <input
                        type="text"
                        id="symptoms"
                        name="symptoms"
                        className="form-control"
                        value={formData.symptoms}
                        onChange={handleChange}
                        placeholder="e.g., cramps, headache, bloating"
                      />
                      <div className="form-text">Separate multiple symptoms with commas</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wellness Tracking */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-spa me-2"></i>
                    Wellness Tracking
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="mood" className="form-label">
                        <i className="fas fa-smile me-1 text-warning"></i>
                        Mood
                      </label>
                      <select
                        id="mood"
                        name="mood"
                        className="form-select"
                        value={formData.mood}
                        onChange={handleChange}
                      >
                        <option value="">Select mood</option>
                        <option value="very_good">😄 Very Good</option>
                        <option value="good">🙂 Good</option>
                        <option value="neutral">😐 Neutral</option>
                        <option value="low">😔 Low</option>
                        <option value="very_low">😢 Very Low</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="energyLevel" className="form-label">
                        <i className="fas fa-bolt me-1 text-warning"></i>
                        Energy Level
                      </label>
                      <select
                        id="energyLevel"
                        name="energy_level"
                        className="form-select"
                        value={formData.energy_level}
                        onChange={handleChange}
                      >
                        <option value="">Select energy level</option>
                        <option value="very_high">⚡ Very High</option>
                        <option value="high">🔋 High</option>
                        <option value="moderate">🔋 Moderate</option>
                        <option value="low">🪫 Low</option>
                        <option value="very_low">🔋 Very Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="sleepQuality" className="form-label">
                        <i className="fas fa-moon me-1 text-primary"></i>
                        Sleep Quality
                      </label>
                      <select
                        id="sleepQuality"
                        name="sleep_quality"
                        className="form-select"
                        value={formData.sleep_quality}
                        onChange={handleChange}
                      >
                        <option value="">Select sleep quality</option>
                        <option value="excellent">😴 Excellent</option>
                        <option value="good">😊 Good</option>
                        <option value="fair">😐 Fair</option>
                        <option value="poor">😵 Poor</option>
                        <option value="very_poor">😫 Very Poor</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="stressLevel" className="form-label">
                        <i className="fas fa-brain me-1 text-danger"></i>
                        Stress Level
                      </label>
                      <select
                        id="stressLevel"
                        name="stress_level"
                        className="form-select"
                        value={formData.stress_level}
                        onChange={handleChange}
                      >
                        <option value="">Select stress level</option>
                        <option value="very_low">😌 Very Low</option>
                        <option value="low">🙂 Low</option>
                        <option value="moderate">😐 Moderate</option>
                        <option value="high">😰 High</option>
                        <option value="very_high">😫 Very High</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="exerciseActivities" className="form-label">
                      <i className="fas fa-running me-1 text-success"></i>
                      Exercise Activities
                    </label>
                    <input
                      type="text"
                      id="exerciseActivities"
                      name="exercise_activities"
                      className="form-control"
                      value={formData.exercise_activities}
                      onChange={handleChange}
                      placeholder="e.g., walking 30 min, yoga, swimming"
                    />
                    <div className="form-text">Activities and duration during this cycle</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-sticky-note me-2"></i>
                    Notes & Observations
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional observations, treatments tried, or other notes..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Update Cycle Log
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Simplified Edit Form for Quick Updates
interface QuickEditCycleProps {
  cycleLog: any;
  onUpdate: (id: number, data: any) => Promise<any>;
  onCancel: () => void;
}

export const QuickEditCycle: React.FC<QuickEditCycleProps> = ({ 
  cycleLog, 
  onUpdate, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    end_date: cycleLog.end_date ? cycleLog.end_date.split('T')[0] : '',
    symptoms: cycleLog.symptoms || '',
    notes: cycleLog.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = { ...formData };
      if (updateData.end_date === '') updateData.end_date = null;
      
      await onUpdate(cycleLog.id, updateData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-primary">
      <div className="card-header bg-primary text-white">
        <h6 className="mb-0">
          <i className="fas fa-edit me-2"></i>
          Quick Edit - {new Date(cycleLog.start_date).toLocaleDateString()}
        </h6>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Symptoms</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.symptoms}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="cramps, headache..."
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Quick Notes</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Brief notes..."
              />
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <i className="fas fa-save me-1"></i>
              )}
              Save
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-sm"
              onClick={onCancel}
            >
              <i className="fas fa-times me-1"></i>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCycleLogModal;