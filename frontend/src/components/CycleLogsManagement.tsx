import React, { useState, useEffect } from 'react';
import { useCycle } from '@/contexts/CycleContext';
import { EditCycleLogModal, QuickEditCycle } from './EditCycleLogModal';
import { DeleteCycleLogModal, QuickDeleteButton, BulkDeleteCycleLogs } from './DeleteCycleLogModal';

interface CycleLog {
  id: number;
  start_date: string;
  end_date?: string;
  [key: string]: any;
}

export const CycleLogsManagement = () => {
  const {
    cycleLogs,
    loading,
    error,
    pagination,
    fetchCycleLogs,
    updateCycleLog,
    deleteCycleLog
  } = useCycle();

  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [deletingLog, setDeletingLog] = useState<any>(null);
  const [quickEditLog, setQuickEditLog] = useState<any>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchCycleLogs();
  }, []);

  const handleSelectLog = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === cycleLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(cycleLogs.map((log: CycleLog) => log.id));
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    // Delete logs one by one (since backend doesn't have bulk delete)
    for (const id of ids) {
      await deleteCycleLog(id);
    }
    setSelectedLogs([]);
    await fetchCycleLogs();
  };

  const handleQuickEdit = async (id: number, data: any) => {
    const result = await updateCycleLog(id, data);
    if (result.success) {
      setQuickEditLog(null);
      await fetchCycleLogs();
    }
    return result;
  };

  const handleQuickDelete = async (id: number) => {
    const result = await deleteCycleLog(id);
    if (result.success) {
      await fetchCycleLogs();
    }
    return result;
  };

  const getFilteredLogs = () => {
    let filtered = [...cycleLogs];

    // Apply filters
    switch (filterBy) {
      case 'ongoing':
        filtered = filtered.filter(log => !log.end_date);
        break;
      case 'completed':
        filtered = filtered.filter(log => log.end_date);
        break;
      case 'this_month':
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        filtered = filtered.filter(log => {
          const logDate = new Date(log.start_date);
          return logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear;
        });
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        break;
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        break;
      case 'duration':
        filtered.sort((a, b) => {
          const aDuration = a.end_date ? (new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) : 0;
          const bDuration = b.end_date ? (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) : 0;
          return bDuration - aDuration;
        });
        break;
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'Ongoing';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      'very_good': '😄',
      'good': '🙂',
      'neutral': '😐',
      'low': '😔',
      'very_low': '😢'
    };
    return moodMap[mood] || '';
  };

  if (loading && !cycleLogs.length) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your cycle logs...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-6">
          <h2 className="mb-0">
            <i className="fas fa-calendar-alt me-2 text-primary"></i>
            Cycle Logs Management
          </h2>
          <p className="text-muted">View, edit, and manage your menstrual cycle records</p>
        </div>
        <div className="col-md-6 text-end">
          <div className="btn-group" role="group">
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('table')}
            >
              <i className="fas fa-table me-1"></i>
              Table
            </button>
            <button
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('cards')}
            >
              <i className="fas fa-th-large me-1"></i>
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="row g-2">
            <div className="col-auto">
              <select 
                className="form-select"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Cycles</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
            <div className="col-auto">
              <select 
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="duration">By Duration</option>
              </select>
            </div>
            <div className="col-auto">
              <span className="badge bg-secondary fs-6 py-2 px-3">
                {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-end">
          {selectedLogs.length > 0 && (
            <div className="btn-group">
              <button
                className="btn btn-outline-danger"
                onClick={() => setShowBulkDelete(true)}
              >
                <i className="fas fa-trash-alt me-1"></i>
                Delete Selected ({selectedLogs.length})
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSelectedLogs([])}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-calendar-times fa-4x text-muted mb-3"></i>
          <h4 className="text-muted">No Cycle Logs Found</h4>
          <p className="text-muted">
            {cycleLogs.length === 0 
              ? "You haven't logged any cycles yet. Start tracking to see your data here."
              : "No logs match your current filters. Try adjusting the filter settings."
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Duration</th>
                        <th>Cycle Length</th>
                        <th>Flow</th>
                        <th>Mood</th>
                        <th>Symptoms</th>
                        <th style={{ width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <React.Fragment key={log.id}>
                          {quickEditLog?.id === log.id ? (
                            <tr>
                              <td colSpan={9} className="p-0">
                                <QuickEditCycle
                                  cycleLog={log}
                                  onUpdate={handleQuickEdit}
                                  onCancel={() => setQuickEditLog(null)}
                                />
                              </td>
                            </tr>
                          ) : (
                            <tr className={selectedLogs.includes(log.id) ? 'table-primary' : ''}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedLogs.includes(log.id)}
                                  onChange={() => handleSelectLog(log.id)}
                                />
                              </td>
                              <td>
                                <strong>{formatDate(log.start_date)}</strong>
                              </td>
                              <td>
                                {log.end_date ? (
                                  formatDate(log.end_date)
                                ) : (
                                  <span className="badge bg-success">Ongoing</span>
                                )}
                              </td>
                              <td>{getDuration(log.start_date, log.end_date)}</td>
                              <td>
                                {log.cycle_length ? `${log.cycle_length} days` : '—'}
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
                                <span className="me-1">{getMoodEmoji(log.mood)}</span>
                                {log.mood && log.mood.replace('_', ' ')}
                              </td>
                              <td>
                                <small className="text-truncate d-block" style={{ maxWidth: '150px' }}>
                                  {log.symptoms || '—'}
                                </small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => setQuickEditLog(log)}
                                    title="Quick edit"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => setEditingLog(log)}
                                    title="Full edit"
                                  >
                                    <i className="fas fa-cog"></i>
                                  </button>
                                  <QuickDeleteButton
                                    cycleLog={log}
                                    onDelete={handleQuickDelete}
                                    size="sm"
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredLogs.map((log) => (
                <div key={log.id} className="col-md-6 col-lg-4 mb-4">
                  <div className={`card h-100 ${selectedLogs.includes(log.id) ? 'border-primary' : ''}`}>
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                        />
                        <strong>{formatDate(log.start_date)}</strong>
                      </div>
                      {!log.end_date && (
                        <span className="badge bg-success">Ongoing</span>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <small className="text-muted">Duration</small>
                          <div>{getDuration(log.start_date, log.end_date)}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Cycle Length</small>
                          <div>{log.cycle_length ? `${log.cycle_length} days` : '—'}</div>
                        </div>
                      </div>

                      {log.flow_intensity && (
                        <div className="mb-2">
                          <small className="text-muted">Flow: </small>
                          <span className={`badge ${
                            log.flow_intensity === 'light' ? 'bg-info' :
                            log.flow_intensity === 'medium' ? 'bg-warning' :
                            log.flow_intensity === 'heavy' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {log.flow_intensity}
                          </span>
                        </div>
                      )}

                      {log.mood && (
                        <div className="mb-2">
                          <small className="text-muted">Mood: </small>
                          <span>{getMoodEmoji(log.mood)} {log.mood.replace('_', ' ')}</span>
                        </div>
                      )}

                      {log.symptoms && (
                        <div className="mb-2">
                          <small className="text-muted">Symptoms: </small>
                          <small className="text-truncate d-block">{log.symptoms}</small>
                        </div>
                      )}

                      {log.notes && (
                        <div className="mb-2">
                          <small className="text-muted">Notes: </small>
                          <small className="text-truncate d-block">{log.notes}</small>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <div className="btn-group w-100">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setEditingLog(log)}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setQuickEditLog(log)}
                        >
                          <i className="fas fa-bolt me-1"></i>
                          Quick
                        </button>
                        <QuickDeleteButton
                          cycleLog={log}
                          onDelete={handleQuickDelete}
                          size="sm"
                          className="flex-grow-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <li key={i + 1} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => fetchCycleLogs(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editingLog && (
        <EditCycleLogModal
          cycleLog={editingLog}
          onClose={() => setEditingLog(null)}
          onUpdated={() => {
            setEditingLog(null);
            fetchCycleLogs();
          }}
        />
      )}

      {deletingLog && (
        <DeleteCycleLogModal
          cycleLog={deletingLog}
          onClose={() => setDeletingLog(null)}
          onDeleted={() => {
            setDeletingLog(null);
            fetchCycleLogs();
          }}
        />
      )}

      {showBulkDelete && selectedLogs.length > 0 && (
        <BulkDeleteCycleLogs
          selectedLogs={cycleLogs.filter(log => selectedLogs.includes(log.id))}
          onDelete={handleBulkDelete}
          onClose={() => setShowBulkDelete(false)}
        />
      )}
    </div>
  );
};

export default CycleLogsManagement;