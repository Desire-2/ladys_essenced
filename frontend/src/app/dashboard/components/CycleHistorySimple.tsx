import React, { useState, useEffect } from 'react';
import { useCycle } from '../../../contexts/CycleContext';
import { useAuth } from '../../../contexts/AuthContext';

interface CycleLog {
  id: number;
  start_date: string;
  end_date?: string;
  user_id: number;
  flow_intensity?: string;
  mood?: string;
}

interface CycleHistorySimpleProps {
  onClose?: () => void;
  selectedChild?: number | null;
  children?: any[];
}

export const CycleHistorySimple: React.FC<CycleHistorySimpleProps> = ({ 
  onClose, 
  selectedChild,
  children = []
}) => {
  const { cycleLogs, loading, error, fetchCycleLogs, updateCycleLog, deleteCycleLog } = useCycle();
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCycleLogs();
    }
  }, [user, selectedChild]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        <h5>Error Loading Cycle Data</h5>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={() => fetchCycleLogs()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-primary">
            <i className="fas fa-calendar-alt me-2"></i>
            Cycle History & Management
          </h2>
          <p className="text-muted">
            Manage and track your menstrual cycle history
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <div className="card-title h6">Total Cycles</div>
                  <div className="h4">{cycleLogs?.length || 0}</div>
                </div>
                <i className="fas fa-calendar-check fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <div className="card-title h6">This Month</div>
                  <div className="h4">
                    {cycleLogs?.filter((log: CycleLog) => {
                      const logDate = new Date(log.start_date);
                      const now = new Date();
                      return logDate.getMonth() === now.getMonth() && 
                             logDate.getFullYear() === now.getFullYear();
                    }).length || 0}
                  </div>
                </div>
                <i className="fas fa-calendar-day fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <div className="card-title h6">Completed</div>
                  <div className="h4">{cycleLogs?.filter((log: CycleLog) => log.end_date).length || 0}</div>
                </div>
                <i className="fas fa-check-circle fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <div className="card-title h6">Ongoing</div>
                  <div className="h4">{cycleLogs?.filter((log: CycleLog) => !log.end_date).length || 0}</div>
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Logs Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Recent Cycle Logs</h5>
        </div>
        <div className="card-body">
          {cycleLogs && cycleLogs.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration</th>
                    <th>Flow Intensity</th>
                    <th>Mood</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleLogs.slice(0, 10).map((log: CycleLog) => (
                    <tr key={log.id}>
                      <td>
                        {new Date(log.start_date).toLocaleDateString()}
                      </td>
                      <td>
                        {log.end_date 
                          ? new Date(log.end_date).toLocaleDateString()
                          : <span className="badge bg-warning">Ongoing</span>
                        }
                      </td>
                      <td>
                        {log.end_date 
                          ? `${Math.ceil((new Date(log.end_date).getTime() - new Date(log.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                          : '-'
                        }
                      </td>
                      <td>
                        {log.flow_intensity && (
                          <span className={`badge ${
                            log.flow_intensity === 'light' ? 'bg-info' :
                            log.flow_intensity === 'medium' ? 'bg-warning' :
                            log.flow_intensity === 'heavy' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {log.flow_intensity}
                          </span>
                        )}
                      </td>
                      <td>
                        {log.mood && (
                          <span className="text-capitalize">{log.mood}</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            title="View Details"
                            onClick={() => {
                              console.log('View button clicked for log:', log.id);
                              setSelectedLog(log);
                              setShowViewModal(true);
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-outline-warning" 
                            title="Edit"
                            onClick={() => {
                              console.log('Edit button clicked for log:', log.id);
                              setSelectedLog(log);
                              setShowEditModal(true);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            title="Delete"
                            onClick={() => {
                              console.log('Delete button clicked for log:', log.id);
                              setSelectedLog(log);
                              setShowDeleteModal(true);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Cycle Logs Found</h5>
              <p className="text-muted">Start tracking your cycles to see them here.</p>
              <button className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                Add First Cycle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row mt-4">
        <div className="col-12 text-end">
          <button className="btn btn-secondary me-2" onClick={onClose}>
            <i className="fas fa-times me-2"></i>
            Close
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>
            Add New Cycle
          </button>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedLog && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye me-2 text-primary"></i>
                  Cycle Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Basic Information</h6>
                      </div>
                      <div className="card-body">
                        <p><strong>Start Date:</strong> {new Date(selectedLog.start_date).toLocaleDateString()}</p>
                        <p><strong>End Date:</strong> {selectedLog.end_date ? new Date(selectedLog.end_date).toLocaleDateString() : 'Ongoing'}</p>
                        <p><strong>Duration:</strong> {selectedLog.end_date 
                          ? `${Math.ceil((new Date(selectedLog.end_date).getTime() - new Date(selectedLog.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                          : 'In progress'
                        }</p>
                        <p><strong>Flow Intensity:</strong> 
                          {selectedLog.flow_intensity ? (
                            <span className={`badge ms-2 ${
                              selectedLog.flow_intensity === 'light' ? 'bg-info' :
                              selectedLog.flow_intensity === 'medium' ? 'bg-warning' :
                              selectedLog.flow_intensity === 'heavy' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {selectedLog.flow_intensity}
                            </span>
                          ) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Additional Details</h6>
                      </div>
                      <div className="card-body">
                        <p><strong>Mood:</strong> {selectedLog.mood ? <span className="text-capitalize">{selectedLog.mood}</span> : 'Not specified'}</p>
                        <p><strong>Symptoms:</strong> {selectedLog.symptoms || 'None recorded'}</p>
                        <p><strong>Notes:</strong> {selectedLog.notes || 'No notes'}</p>
                        <p><strong>Energy Level:</strong> {selectedLog.energy_level || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLog && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-edit me-2 text-warning"></i>
                  Edit Cycle Log
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const updatedLog = {
                    flow_intensity: formData.get('flow_intensity'),
                    mood: formData.get('mood'),
                    symptoms: formData.get('symptoms'),
                    notes: formData.get('notes')
                  };
                  
                  updateCycleLog(selectedLog.id, updatedLog).then(() => {
                    setShowEditModal(false);
                    fetchCycleLogs();
                  });
                }}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Flow Intensity</label>
                        <select className="form-select" name="flow_intensity" defaultValue={selectedLog.flow_intensity || ''}>
                          <option value="">Select intensity</option>
                          <option value="light">Light</option>
                          <option value="medium">Medium</option>
                          <option value="heavy">Heavy</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Mood</label>
                        <select className="form-select" name="mood" defaultValue={selectedLog.mood || ''}>
                          <option value="">Select mood</option>
                          <option value="very_good">Very Good</option>
                          <option value="good">Good</option>
                          <option value="neutral">Neutral</option>
                          <option value="low">Low</option>
                          <option value="very_low">Very Low</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Symptoms</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="symptoms"
                      defaultValue={selectedLog.symptoms || ''}
                      placeholder="e.g., cramps, bloating, headache"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea 
                      className="form-control" 
                      name="notes"
                      rows={3}
                      defaultValue={selectedLog.notes || ''}
                      placeholder="Additional notes..."
                    ></textarea>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-warning">
                      <i className="fas fa-save me-2"></i>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLog && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                  Delete Cycle Log
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>Warning:</strong> This action cannot be undone.
                </div>
                <p>Are you sure you want to delete this cycle log?</p>
                <div className="bg-light p-3 rounded">
                  <p className="mb-1"><strong>Start Date:</strong> {new Date(selectedLog.start_date).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>End Date:</strong> {selectedLog.end_date ? new Date(selectedLog.end_date).toLocaleDateString() : 'Ongoing'}</p>
                  <p className="mb-0"><strong>Flow:</strong> {selectedLog.flow_intensity || 'Not specified'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => {
                    deleteCycleLog(selectedLog.id).then(() => {
                      setShowDeleteModal(false);
                      fetchCycleLogs();
                    });
                  }}
                >
                  <i className="fas fa-trash me-2"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleHistorySimple;