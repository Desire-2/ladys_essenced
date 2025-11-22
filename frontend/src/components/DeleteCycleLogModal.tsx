import React, { useState } from 'react';
import { useCycle } from '@/contexts/CycleContext';

interface DeleteCycleLogModalProps {
  cycleLog: any;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteCycleLogModal: React.FC<DeleteCycleLogModalProps> = ({ 
  cycleLog, 
  onClose, 
  onDeleted 
}) => {
  const { deleteCycleLog } = useCycle();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDuration = () => {
    if (!cycleLog.end_date) return 'Ongoing';
    const start = new Date(cycleLog.start_date);
    const end = new Date(cycleLog.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await deleteCycleLog(cycleLog.id);
      
      if (result.success) {
        onDeleted();
        onClose();
      } else {
        setError(result.error || 'Failed to delete cycle log');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete cycle log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="fas fa-trash-alt me-2"></i>
              Delete Cycle Log
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone!
            </div>

            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0">Cycle Log Details</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-sm-6">
                    <strong>Start Date:</strong><br/>
                    <span className="text-muted">{formatDate(cycleLog.start_date)}</span>
                  </div>
                  <div className="col-sm-6">
                    <strong>Duration:</strong><br/>
                    <span className="text-muted">{getDuration()}</span>
                  </div>
                </div>

                {cycleLog.end_date && (
                  <div className="row mt-2">
                    <div className="col-sm-6">
                      <strong>End Date:</strong><br/>
                      <span className="text-muted">{formatDate(cycleLog.end_date)}</span>
                    </div>
                    <div className="col-sm-6">
                      <strong>Cycle Length:</strong><br/>
                      <span className="text-muted">{cycleLog.cycle_length || 'Not set'} days</span>
                    </div>
                  </div>
                )}

                {cycleLog.symptoms && (
                  <div className="mt-3">
                    <strong>Symptoms:</strong><br/>
                    <span className="text-muted">{cycleLog.symptoms}</span>
                  </div>
                )}

                {cycleLog.notes && (
                  <div className="mt-3">
                    <strong>Notes:</strong><br/>
                    <span className="text-muted">{cycleLog.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <h6 className="text-danger">Data Impact</h6>
              <ul className="list-unstyled">
                <li>
                  <i className="fas fa-times text-danger me-2"></i>
                  This cycle log will be permanently deleted
                </li>
                <li>
                  <i className="fas fa-times text-danger me-2"></i>
                  Related period logs will also be deleted
                </li>
                <li>
                  <i className="fas fa-times text-danger me-2"></i>
                  Cycle statistics and predictions will be recalculated
                </li>
                <li>
                  <i className="fas fa-times text-danger me-2"></i>
                  This may affect your cycle insights and patterns
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <label htmlFor="confirmDelete" className="form-label">
                <strong>Type "delete" to confirm:</strong>
              </label>
              <input
                type="text"
                id="confirmDelete"
                className="form-control"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                disabled={loading}
              />
            </div>

            <div className="alert alert-info">
              <i className="fas fa-lightbulb me-2"></i>
              <strong>Tip:</strong> Instead of deleting, consider editing the log to correct any mistakes.
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading || confirmText.toLowerCase() !== 'delete'}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt me-2"></i>
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Delete Button Component
interface QuickDeleteButtonProps {
  cycleLog: any;
  onDelete: (id: number) => Promise<any>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuickDeleteButton: React.FC<QuickDeleteButtonProps> = ({ 
  cycleLog, 
  onDelete, 
  size = 'sm',
  className = ''
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuickDelete = async () => {
    setLoading(true);
    try {
      await onDelete(cycleLog.id);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="btn-group" role="group">
        <button 
          className={`btn btn-outline-danger btn-${size} ${className}`}
          onClick={handleQuickDelete}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            <>
              <i className="fas fa-check me-1"></i>
              Confirm
            </>
          )}
        </button>
        <button 
          className={`btn btn-outline-secondary btn-${size}`}
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    );
  }

  return (
    <button 
      className={`btn btn-outline-danger btn-${size} ${className}`}
      onClick={() => setShowConfirm(true)}
      title="Delete cycle log"
    >
      <i className="fas fa-trash-alt"></i>
    </button>
  );
};

// Bulk Delete Component
interface BulkDeleteCycleLogsProps {
  selectedLogs: any[];
  onDelete: (ids: number[]) => Promise<any>;
  onClose: () => void;
}

export const BulkDeleteCycleLogs: React.FC<BulkDeleteCycleLogsProps> = ({ 
  selectedLogs, 
  onDelete, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleBulkDelete = async () => {
    if (confirmText !== `delete ${selectedLogs.length} logs`) {
      setError(`Please type "delete ${selectedLogs.length} logs" to confirm`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ids = selectedLogs.map(log => log.id);
      await onDelete(ids);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete cycle logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="fas fa-trash-alt me-2"></i>
              Delete {selectedLogs.length} Cycle Logs
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> You are about to delete {selectedLogs.length} cycle logs. This action cannot be undone!
            </div>

            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0">Selected Logs for Deletion</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Duration</th>
                        <th>Symptoms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.start_date).toLocaleDateString()}</td>
                          <td>{log.end_date ? new Date(log.end_date).toLocaleDateString() : 'Ongoing'}</td>
                          <td>
                            {log.end_date ? 
                              `${Math.ceil((new Date(log.end_date).getTime() - new Date(log.start_date).getTime()) / (1000 * 60 * 60 * 24))} days` :
                              'Ongoing'
                            }
                          </td>
                          <td className="text-truncate" style={{ maxWidth: '150px' }}>
                            {log.symptoms || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="confirmBulkDelete" className="form-label">
                <strong>Type "delete {selectedLogs.length} logs" to confirm:</strong>
              </label>
              <input
                type="text"
                id="confirmBulkDelete"
                className="form-control"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type 'delete ${selectedLogs.length} logs' to confirm`}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={loading || confirmText !== `delete ${selectedLogs.length} logs`}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt me-2"></i>
                  Delete {selectedLogs.length} Logs
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCycleLogModal;