import React, { useState, useEffect } from 'react';
import { useCycle } from '../../../contexts/CycleContext';
import { useAuth } from '../../../contexts/AuthContext';
import { EditCycleLogModal } from '../../../components/EditCycleLogModal';
import { DeleteCycleLogModal } from '../../../components/DeleteCycleLogModal';
import { formatDate } from '../utils';

// Interface for cycle log data
interface CycleLog {
  id: number;
  start_date: string;
  end_date?: string;
  cycle_length?: number;
  period_length?: number;
  flow_intensity?: string;
  mood?: string;
  symptoms?: string;
  energy_level?: string;
  sleep_quality?: string;
  stress_level?: string;
  exercise_activities?: string;
  notes?: string;
}

// Quick action components
const QuickEditCycle = ({ cycleLog, onUpdate, onCancel }: any) => (
  <div className="p-3 bg-light border rounded">
    <h6>Quick Edit - Cycle {cycleLog.id}</h6>
    <div className="row g-2">
      <div className="col-6">
        <label className="form-label">Flow Intensity</label>
        <select className="form-select form-select-sm">
          <option value="light">Light</option>
          <option value="medium" selected={cycleLog.flow_intensity === 'medium'}>Medium</option>
          <option value="heavy" selected={cycleLog.flow_intensity === 'heavy'}>Heavy</option>
        </select>
      </div>
      <div className="col-6">
        <label className="form-label">Mood</label>
        <select className="form-select form-select-sm">
          <option value="happy">Happy</option>
          <option value="good" selected={cycleLog.mood === 'good'}>Good</option>
          <option value="neutral">Neutral</option>
          <option value="low" selected={cycleLog.mood === 'low'}>Low</option>
          <option value="irritable">Irritable</option>
        </select>
      </div>
    </div>
    <div className="mt-3">
      <button className="btn btn-sm btn-primary me-2" onClick={() => onUpdate(cycleLog.id, {})}>
        <i className="fas fa-check"></i> Save
      </button>
      <button className="btn btn-sm btn-secondary" onClick={onCancel}>
        <i className="fas fa-times"></i> Cancel
      </button>
    </div>
  </div>
);

const QuickDeleteButton = ({ cycleLog, onDelete, size = 'sm', className = '' }: any) => (
  <button
    className={`btn btn-outline-danger ${size ? `btn-${size}` : ''} ${className}`}
    onClick={() => onDelete(cycleLog.id)}
    title="Delete Cycle Log"
  >
    <i className="fas fa-trash"></i>
  </button>
);

const BulkDeleteCycleLogs = ({ selectedLogs, onDelete, onClose }: any) => (
  <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
            Bulk Delete Confirmation
          </h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-warning">
            <strong>Warning:</strong> This action cannot be undone.
          </div>
          <p>Are you sure you want to delete <strong>{selectedLogs.length}</strong> cycle logs?</p>
          <div className="bg-light p-3 rounded">
            <h6>Selected logs:</h6>
            <ul className="mb-0">
              {selectedLogs.slice(0, 5).map((log: any) => (
                <li key={log.id}>
                  {formatDate(log.start_date)} 
                  {log.end_date && ` - ${formatDate(log.end_date)}`}
                </li>
              ))}
              {selectedLogs.length > 5 && (
                <li>... and {selectedLogs.length - 5} more</li>
              )}
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={() => onDelete(selectedLogs.map((log: any) => log.id))}
          >
            <i className="fas fa-trash me-2"></i>
            Delete {selectedLogs.length} Logs
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

interface CycleHistoryManagementProps {
  onClose?: () => void;
  selectedChild?: number | null;
  children?: any[];
}

export const CycleHistoryManagement: React.FC<CycleHistoryManagementProps> = ({ 
  onClose, 
  selectedChild,
  children = []
}) => {
  const {
    cycleLogs,
    loading,
    error,
    pagination,
    fetchCycleLogs,
    updateCycleLog,
    deleteCycleLog,
    createCycleLog
  } = useCycle();

  const { user, hasRole } = useAuth();
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [deletingLog, setDeletingLog] = useState<any>(null);
  const [quickEditLog, setQuickEditLog] = useState<any>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalCycles: 0,
    avgCycleLength: 0,
    avgPeriodLength: 0,
    lastPeriod: null as any,
    nextPredicted: null as any,
    regularity: 'Unknown'
  });

  // Get selected child info for parent view
  const selectedChildInfo = selectedChild ? children.find(c => c.user_id === selectedChild) : null;
  const isParentView = hasRole('parent') && selectedChild;

  useEffect(() => {
    loadCycleData();
    calculateStats();
  }, [selectedChild]);

  const calculateStats = () => {
    if (!cycleLogs.length) return;

    const completedCycles = cycleLogs.filter((log: CycleLog) => log.end_date);
    const cycleLengths = completedCycles.map((log: CycleLog) => {
      const start = new Date(log.start_date);
      const end = new Date(log.end_date!);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

    const avgCycle = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a: number, b: number) => a + b, 0) / cycleLengths.length)
      : 0;

    const avgPeriod = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a: number, b: number) => a + b, 0) / cycleLengths.length)
      : 0;

    const sortedLogs = [...cycleLogs].sort((a: CycleLog, b: CycleLog) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    setStats({
      totalCycles: cycleLogs.length,
      avgCycleLength: avgCycle,
      avgPeriodLength: avgPeriod,
      lastPeriod: sortedLogs[0] || null,
      nextPredicted: null,
      regularity: cycleLengths.length > 3 ? 'Regular' : 'Tracking'
    });
  };

  const loadCycleData = async () => {
    try {
      await fetchCycleLogs();
    } catch (error) {
      console.error('Failed to load cycle data:', error);
    }
  };

  const handleSelectLog = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === getFilteredLogs().length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(getFilteredLogs().map(log => log.id));
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    for (const id of ids) {
      await deleteCycleLog(id);
    }
    setSelectedLogs([]);
    await loadCycleData();
    calculateStats();
  };

  const handleQuickEdit = async (id: number, data: any) => {
    const result = await updateCycleLog(id, data);
    if (result.success) {
      setQuickEditLog(null);
      await loadCycleData();
      calculateStats();
    }
    return result;
  };

  const handleQuickDelete = async (id: number) => {
    const result = await deleteCycleLog(id);
    if (result.success) {
      await loadCycleData();
      calculateStats();
    }
    return result;
  };

  const getFilteredLogs = () => {
    let filtered = [...cycleLogs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.mood?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(log => 
        new Date(log.start_date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(log => 
        new Date(log.start_date) <= new Date(dateRange.end)
      );
    }

    // Apply status filters
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
      case 'last_3_months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = filtered.filter(log => 
          new Date(log.start_date) >= threeMonthsAgo
        );
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
      case 'flow_intensity':
        const flowOrder = { 'light': 1, 'medium': 2, 'heavy': 3 };
        filtered.sort((a, b) => (flowOrder[b.flow_intensity as keyof typeof flowOrder] || 0) - (flowOrder[a.flow_intensity as keyof typeof flowOrder] || 0));
        break;
    }

    return filtered;
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

  const getFlowColor = (flow: string) => {
    switch (flow) {
      case 'light': return 'text-info';
      case 'medium': return 'text-warning';
      case 'heavy': return 'text-danger';
      default: return 'text-muted';
    }
  };

  const exportData = () => {
    const data = getFilteredLogs().map(log => ({
      'Start Date': formatDate(log.start_date),
      'End Date': log.end_date ? formatDate(log.end_date) : 'Ongoing',
      'Duration': getDuration(log.start_date, log.end_date),
      'Flow Intensity': log.flow_intensity || 'Not specified',
      'Cycle Length': log.cycle_length ? `${log.cycle_length} days` : 'Not calculated',
      'Mood': log.mood || 'Not specified',
      'Symptoms': log.symptoms || 'None',
      'Notes': log.notes || 'None'
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cycle-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading && !cycleLogs.length) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your cycle history...</p>
      </div>
    );
  }

  return (
    <div className="cycle-history-management">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="d-flex align-items-center mb-2">
            {onClose && (
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={onClose}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back
              </button>
            )}
            <div>
              <h2 className="mb-0">
                <i className="fas fa-history me-2 text-primary"></i>
                Cycle History Management
              </h2>
              <p className="text-muted mb-0">
                {isParentView && selectedChildInfo 
                  ? `Managing ${selectedChildInfo.name}'s cycle history`
                  : "Comprehensive cycle tracking and management"
                }
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-end">
          <div className="btn-group me-2">
            <button
              className="btn btn-success"
              onClick={() => setShowAddForm(true)}
            >
              <i className="fas fa-plus me-1"></i>
              Add Cycle
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={exportData}
              disabled={getFilteredLogs().length === 0}
            >
              <i className="fas fa-download me-1"></i>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-primary h-100">
            <div className="card-body text-center">
              <i className="fas fa-calendar-alt fa-2x text-primary mb-2"></i>
              <h6 className="card-title text-muted">Total Cycles</h6>
              <h3 className="text-primary mb-0">{stats.totalCycles}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-info h-100">
            <div className="card-body text-center">
              <i className="fas fa-chart-line fa-2x text-info mb-2"></i>
              <h6 className="card-title text-muted">Avg Cycle Length</h6>
              <h3 className="text-info mb-0">{stats.avgCycleLength} days</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-warning h-100">
            <div className="card-body text-center">
              <i className="fas fa-calendar-check fa-2x text-warning mb-2"></i>
              <h6 className="card-title text-muted">Last Period</h6>
              <h5 className="text-warning mb-0">
                {stats.lastPeriod ? formatDate(stats.lastPeriod.start_date) : 'No data'}
              </h5>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-success h-100">
            <div className="card-body text-center">
              <i className="fas fa-heartbeat fa-2x text-success mb-2"></i>
              <h6 className="card-title text-muted">Regularity</h6>
              <h5 className="text-success mb-0">{stats.regularity}</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search symptoms, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="col-md-2">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            {/* Filters */}
            <div className="col-md-2">
              <label className="form-label">Filter By</label>
              <select 
                className="form-select"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Cycles</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="this_month">This Month</option>
                <option value="last_3_months">Last 3 Months</option>
              </select>
            </div>

            {/* Sort */}
            <div className="col-md-2">
              <label className="form-label">Sort By</label>
              <select 
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="duration">By Duration</option>
                <option value="flow_intensity">By Flow Intensity</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="col-md-1">
              <label className="form-label">View</label>
              <div className="btn-group d-flex">
                <button
                  className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <i className="fas fa-table"></i>
                </button>
                <button
                  className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => setViewMode('cards')}
                  title="Card View"
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button
                  className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => setViewMode('timeline')}
                  title="Timeline View"
                >
                  <i className="fas fa-stream"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || dateRange.start || dateRange.end || filterBy !== 'all') && (
            <div className="mt-3">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setDateRange({ start: '', end: '' });
                  setFilterBy('all');
                }}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </button>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedLogs.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">
                  {selectedLogs.length} cycle{selectedLogs.length !== 1 ? 's' : ''} selected
                </span>
                <div className="btn-group">
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setShowBulkDelete(true)}
                  >
                    <i className="fas fa-trash-alt me-1"></i>
                    Delete Selected
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSelectedLogs([])}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-3">
        <span className="badge bg-secondary fs-6 py-2 px-3">
          {getFilteredLogs().length} cycle{getFilteredLogs().length !== 1 ? 's' : ''} found
          {getFilteredLogs().length !== cycleLogs.length && ` (filtered from ${cycleLogs.length} total)`}
        </span>
      </div>

      {/* Content Area */}
      {getFilteredLogs().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-calendar-times fa-4x text-muted mb-3"></i>
          <h4 className="text-muted">No Cycles Found</h4>
          <p className="text-muted">
            {cycleLogs.length === 0 
              ? "You haven't logged any cycles yet. Start tracking to see your data here."
              : "No cycles match your current filters. Try adjusting the filter settings."
            }
          </p>
          {cycleLogs.length === 0 && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <i className="fas fa-plus me-1"></i>
              Add Your First Cycle
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
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
                            checked={selectedLogs.length === getFilteredLogs().length && getFilteredLogs().length > 0}
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
                      {getFilteredLogs().map((log) => (
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
          )}

          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="row">
              {getFilteredLogs().map((log) => (
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

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="timeline">
              {getFilteredLogs().map((log, index) => (
                <div key={log.id} className="timeline-item mb-4">
                  <div className="row">
                    <div className="col-auto">
                      <div className="timeline-marker">
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center text-white ${
                            log.flow_intensity === 'light' ? 'bg-info' :
                            log.flow_intensity === 'medium' ? 'bg-warning' :
                            log.flow_intensity === 'heavy' ? 'bg-danger' : 'bg-secondary'
                          }`}
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className="fas fa-tint"></i>
                        </div>
                        {index < getFilteredLogs().length - 1 && (
                          <div className="timeline-line bg-light" style={{ width: '2px', height: '60px', marginLeft: '19px' }}></div>
                        )}
                      </div>
                    </div>
                    <div className="col">
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title mb-0">
                              {formatDate(log.start_date)} 
                              {log.end_date && ` - ${formatDate(log.end_date)}`}
                            </h6>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => setEditingLog(log)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <QuickDeleteButton
                                cycleLog={log}
                                onDelete={handleQuickDelete}
                                size="sm"
                              />
                            </div>
                          </div>
                          
                          <div className="row g-2 mb-2">
                            <div className="col-auto">
                              <span className="badge bg-light text-dark">
                                {getDuration(log.start_date, log.end_date)}
                              </span>
                            </div>
                            {log.flow_intensity && (
                              <div className="col-auto">
                                <span className={`badge ${
                                  log.flow_intensity === 'light' ? 'bg-info' :
                                  log.flow_intensity === 'medium' ? 'bg-warning' :
                                  log.flow_intensity === 'heavy' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {log.flow_intensity} flow
                                </span>
                              </div>
                            )}
                            {log.mood && (
                              <div className="col-auto">
                                <span className="badge bg-light text-dark">
                                  {getMoodEmoji(log.mood)} {log.mood.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {log.symptoms && (
                            <p className="card-text small mb-1">
                              <strong>Symptoms:</strong> {log.symptoms}
                            </p>
                          )}
                          
                          {log.notes && (
                            <p className="card-text small text-muted mb-0">
                              <strong>Notes:</strong> {log.notes}
                            </p>
                          )}
                        </div>
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
            loadCycleData();
            calculateStats();
          }}
        />
      )}

      {deletingLog && (
        <DeleteCycleLogModal
          cycleLog={deletingLog}
          onClose={() => setDeletingLog(null)}
          onDeleted={() => {
            setDeletingLog(null);
            loadCycleData();
            calculateStats();
          }}
        />
      )}

      {showBulkDelete && selectedLogs.length > 0 && (
        <BulkDeleteCycleLogs
          selectedLogs={cycleLogs.filter((log: CycleLog) => selectedLogs.includes(log.id))}
          onDelete={handleBulkDelete}
          onClose={() => setShowBulkDelete(false)}
        />
      )}
    </div>
  );
};

export default CycleHistoryManagement;