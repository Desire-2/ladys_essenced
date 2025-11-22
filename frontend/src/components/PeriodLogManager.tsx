import React, { useState, useEffect } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';

export const PeriodLogManager = () => {
  const {
    periodLogs,
    currentPeriod,
    analytics,
    insights,
    loading,
    error,
    pagination,
    fetchPeriodLogs,
    fetchCurrentPeriod,
    fetchAnalytics,
    fetchInsights,
    createPeriodLog,
    updatePeriodLog,
    endCurrentPeriod,
    startNewPeriod
  } = usePeriod();

  const [activeTab, setActiveTab] = useState('overview');
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showEndPeriodModal, setShowEndPeriodModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPeriodLogs(),
          fetchCurrentPeriod(),
          fetchAnalytics(),
          fetchInsights()
        ]);
      } catch (error) {
        console.error('Error loading period data:', error);
      }
    };
    
    loadData();
  }, []);

  const handleStartPeriod = async () => {
    try {
      const result = await startNewPeriod();
      if (result.success) {
        setShowNewPeriodModal(false);
      }
    } catch (error) {
      console.error('Error starting period:', error);
    }
  };

  const handleEndPeriod = async (endData) => {
    try {
      const result = await endCurrentPeriod(endData);
      if (result.success) {
        setShowEndPeriodModal(false);
      }
    } catch (error) {
      console.error('Error ending period:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleDateString();
  };

  const getDuration = (startDate, endDate) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPainLevelColor = (level) => {
    if (!level) return 'text-muted';
    if (level <= 3) return 'text-success';
    if (level <= 6) return 'text-warning';
    return 'text-danger';
  };

  if (loading && !periodLogs.length) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your period data...</p>
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

      {/* Header with Current Period Status */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient-primary text-white">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h3 className="mb-2">
                    <i className="fas fa-calendar-heart me-2"></i>
                    Period Tracking Dashboard
                  </h3>
                  {currentPeriod ? (
                    <div className="d-flex align-items-center">
                      <span className="badge bg-success bg-opacity-25 border border-success text-success me-3">
                        <i className="fas fa-circle me-1"></i>
                        Active Period - Day {getDuration(currentPeriod.start_date, null)}
                      </span>
                      <small>Started {formatDate(currentPeriod.start_date)}</small>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center">
                      <span className="badge bg-light bg-opacity-25 border border-light text-light me-3">
                        <i className="fas fa-pause-circle me-1"></i>
                        No Active Period
                      </span>
                      <small>Ready to track your next period</small>
                    </div>
                  )}
                </div>
                <div className="col-md-4 text-end">
                  {currentPeriod ? (
                    <button 
                      className="btn btn-outline-light"
                      onClick={() => setShowEndPeriodModal(true)}
                    >
                      <i className="fas fa-stop-circle me-2"></i>
                      End Current Period
                    </button>
                  ) : (
                    <button 
                      className="btn btn-light"
                      onClick={() => setShowNewPeriodModal(true)}
                    >
                      <i className="fas fa-plus-circle me-2"></i>
                      Start New Period
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body text-center">
                <div className="display-6 text-primary mb-2">
                  {analytics.total_periods_tracked}
                </div>
                <h6 className="card-title text-muted mb-0">Periods Tracked</h6>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body text-center">
                <div className="display-6 text-success mb-2">
                  {analytics.patterns?.average_duration || 'N/A'}
                </div>
                <h6 className="card-title text-muted mb-0">Avg Duration (days)</h6>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body text-center">
                <div className="display-6 text-warning mb-2">
                  {analytics.patterns?.average_pain_level || 'N/A'}
                </div>
                <h6 className="card-title text-muted mb-0">Avg Pain Level</h6>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body text-center">
                <div className="display-6 text-info mb-2">
                  {analytics.tracking_duration_months ? `${analytics.tracking_duration_months}m` : 'New'}
                </div>
                <h6 className="card-title text-muted mb-0">Tracking Duration</h6>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-chart-line me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <i className="fas fa-list me-2"></i>
                Period History
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                <i className="fas fa-lightbulb me-2"></i>
                Insights
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <i className="fas fa-chart-bar me-2"></i>
                Analytics
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="row">
        <div className="col-12">
          {activeTab === 'overview' && (
            <OverviewTab 
              currentPeriod={currentPeriod}
              analytics={analytics}
              recentLogs={periodLogs.slice(0, 3)}
              insights={insights.slice(0, 3)}
            />
          )}

          {activeTab === 'logs' && (
            <PeriodHistoryTab 
              periodLogs={periodLogs}
              pagination={pagination}
              onEditPeriod={setSelectedPeriod}
              onLoadMore={fetchPeriodLogs}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsTab insights={insights} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab analytics={analytics} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewPeriodModal && (
        <NewPeriodModal 
          onClose={() => setShowNewPeriodModal(false)}
          onStartPeriod={handleStartPeriod}
        />
      )}

      {showEndPeriodModal && currentPeriod && (
        <EndPeriodModal 
          period={currentPeriod}
          onClose={() => setShowEndPeriodModal(false)}
          onEndPeriod={handleEndPeriod}
        />
      )}

      {selectedPeriod && (
        <EditPeriodModal 
          period={selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          onUpdatePeriod={updatePeriodLog}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ currentPeriod, analytics, recentLogs, insights }) => (
  <div className="row">
    <div className="col-md-6 mb-4">
      <div className="card h-100">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-history me-2"></i>
            Recent Periods
          </h5>
        </div>
        <div className="card-body">
          {recentLogs.length > 0 ? (
            <div className="list-group list-group-flush">
              {recentLogs.map((log) => (
                <div key={log.id} className="list-group-item d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">
                      {new Date(log.start_date).toLocaleDateString()} - {log.end_date ? new Date(log.end_date).toLocaleDateString() : 'Ongoing'}
                    </h6>
                    <p className="mb-1 small text-muted">
                      Duration: {log.end_date ? Math.ceil((new Date(log.end_date).getTime() - new Date(log.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 'Ongoing'} days
                    </p>
                    {log.pain_level && (
                      <small className={`badge ${log.pain_level <= 3 ? 'bg-success' : log.pain_level <= 6 ? 'bg-warning' : 'bg-danger'}`}>
                        Pain: {log.pain_level}/10
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-3">No period logs yet. Start tracking to see your history!</p>
          )}
        </div>
      </div>
    </div>

    <div className="col-md-6 mb-4">
      <div className="card h-100">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-lightbulb me-2"></i>
            Latest Insights
          </h5>
        </div>
        <div className="card-body">
          {insights.length > 0 ? (
            <div className="list-group list-group-flush">
              {insights.map((insight, index) => (
                <div key={index} className="list-group-item">
                  <div className="d-flex align-items-start">
                    <i className={`fas fa-${insight.type === 'warning' ? 'exclamation-triangle text-warning' : insight.type === 'success' ? 'check-circle text-success' : 'info-circle text-info'} me-2 mt-1`}></i>
                    <div>
                      <h6 className="mb-1">{insight.title}</h6>
                      <p className="mb-0 small">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-3">Keep tracking to get personalized insights!</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Period History Tab Component
const PeriodHistoryTab = ({ periodLogs, pagination, onEditPeriod, onLoadMore }) => (
  <div className="card">
    <div className="card-header">
      <h5 className="mb-0">
        <i className="fas fa-calendar-alt me-2"></i>
        Period History
      </h5>
    </div>
    <div className="card-body">
      {periodLogs.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Pain Level</th>
                  <th>Flow Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {periodLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.start_date).toLocaleDateString()}</td>
                    <td>{log.end_date ? new Date(log.end_date).toLocaleDateString() : <span className="badge bg-primary">Ongoing</span>}</td>
                    <td>{log.duration_days || (log.end_date ? Math.ceil((new Date(log.end_date).getTime() - new Date(log.start_date).getTime()) / (1000 * 60 * 60 * 24)) : '—')} days</td>
                    <td>
                      {log.pain_level ? (
                        <span className={`badge ${log.pain_level <= 3 ? 'bg-success' : log.pain_level <= 6 ? 'bg-warning' : 'bg-danger'}`}>
                          {log.pain_level}/10
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {log.daily_flow?.length > 0 ? (
                        <small className="text-muted">{log.daily_flow.length} days tracked</small>
                      ) : '—'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEditPeriod(log)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <nav className="mt-3">
              <ul className="pagination justify-content-center">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <li key={i + 1} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => onLoadMore(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No Period Logs Yet</h5>
          <p className="text-muted">Start tracking your periods to see your history and patterns.</p>
        </div>
      )}
    </div>
  </div>
);

// Insights Tab Component
const InsightsTab = ({ insights }) => (
  <div className="row">
    {insights.length > 0 ? insights.map((insight, index) => (
      <div key={index} className="col-md-6 mb-4">
        <div className={`card h-100 border-${insight.type === 'warning' ? 'warning' : insight.type === 'success' ? 'success' : 'info'}`}>
          <div className="card-header">
            <h6 className="mb-0">
              <i className={`fas fa-${insight.type === 'warning' ? 'exclamation-triangle' : insight.type === 'success' ? 'check-circle' : 'info-circle'} me-2`}></i>
              {insight.title}
            </h6>
          </div>
          <div className="card-body">
            <p className="card-text">{insight.message}</p>
            {insight.recommendations && (
              <div>
                <h6 className="text-muted">Recommendations:</h6>
                <ul className="list-unstyled">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="mb-1">
                      <i className="fas fa-chevron-right text-primary me-2"></i>
                      <small>{rec}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )) : (
      <div className="col-12">
        <div className="text-center py-5">
          <i className="fas fa-lightbulb fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No Insights Available</h5>
          <p className="text-muted">Track more periods to get personalized insights and recommendations.</p>
        </div>
      </div>
    )}
  </div>
);

// Analytics Tab Component
const AnalyticsTab = ({ analytics }) => (
  <div className="row">
    {analytics ? (
      <>
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Period Patterns</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6 text-center border-end">
                  <div className="display-6 text-primary">{analytics.patterns?.average_duration || 'N/A'}</div>
                  <small className="text-muted">Avg Duration (days)</small>
                </div>
                <div className="col-6 text-center">
                  <div className="display-6 text-warning">{analytics.patterns?.average_pain_level || 'N/A'}</div>
                  <small className="text-muted">Avg Pain Level</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Flow Patterns</h5>
            </div>
            <div className="card-body">
              {analytics.patterns?.flow_patterns ? (
                Object.entries(analytics.patterns.flow_patterns).map(([intensity, count]) => (
                  <div key={intensity} className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-capitalize">{intensity}</span>
                    <span className="badge bg-secondary">{String(count)} days</span>
                  </div>
                ))
              ) : (
                <p className="text-muted">No flow data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Common Symptoms</h5>
            </div>
            <div className="card-body">
              {analytics.patterns?.most_common_symptoms?.length > 0 ? (
                <div className="row">
                  {analytics.patterns.most_common_symptoms.map(([symptom, count]) => (
                    <div key={symptom} className="col-md-4 mb-2">
                      <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <span className="text-capitalize">{symptom.replace('_', ' ')}</span>
                        <span className="badge bg-primary">{count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No symptom data available</p>
              )}
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="col-12">
        <div className="text-center py-5">
          <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No Analytics Available</h5>
          <p className="text-muted">Track periods to see comprehensive analytics and patterns.</p>
        </div>
      </div>
    )}
  </div>
);

// Modal Components
const NewPeriodModal = ({ onClose, onStartPeriod }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Start New Period</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Start Date</label>
              <input 
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              You can add detailed tracking information after starting your period.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={onStartPeriod}>
              <i className="fas fa-play-circle me-2"></i>
              Start Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EndPeriodModal = ({ period, onClose, onEndPeriod }) => {
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [overallSeverity, setOverallSeverity] = useState(5);
  const [satisfaction, setSatisfaction] = useState(3);
  const [finalNotes, setFinalNotes] = useState('');

  const handleSubmit = () => {
    onEndPeriod({
      end_date: endDate,
      overall_severity: overallSeverity,
      period_satisfaction: satisfaction,
      final_notes: finalNotes
    });
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">End Current Period</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">End Date</label>
              <input 
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Overall Severity (1-10)</label>
              <input 
                type="range"
                className="form-range"
                min="1"
                max="10"
                value={overallSeverity}
                onChange={(e) => setOverallSeverity(parseInt(e.target.value))}
              />
              <div className="d-flex justify-content-between text-small">
                <span>Mild</span>
                <span className="fw-bold">{overallSeverity}</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Period Management Satisfaction (1-5)</label>
              <input 
                type="range"
                className="form-range"
                min="1"
                max="5"
                value={satisfaction}
                onChange={(e) => setSatisfaction(parseInt(e.target.value))}
              />
              <div className="d-flex justify-content-between text-small">
                <span>Poor</span>
                <span className="fw-bold">{satisfaction}</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Final Notes</label>
              <textarea 
                className="form-control"
                rows={3}
                placeholder="What worked well? What would you change next time?"
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              <i className="fas fa-stop-circle me-2"></i>
              End Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditPeriodModal = ({ period, onClose, onUpdatePeriod }) => {
  const [formData, setFormData] = useState({
    pain_level: period.pain_level || '',
    overall_severity: period.overall_severity || '',
    period_satisfaction: period.period_satisfaction || '',
    notes: period.notes || '',
    observations: period.observations || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const result = await onUpdatePeriod(period.id, formData);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Period Log</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Pain Level (1-10)</label>
                <input 
                  type="number"
                  className="form-control"
                  name="pain_level"
                  min="1"
                  max="10"
                  value={formData.pain_level}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Overall Severity (1-10)</label>
                <input 
                  type="number"
                  className="form-control"
                  name="overall_severity"
                  min="1"
                  max="10"
                  value={formData.overall_severity}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Period Satisfaction (1-5)</label>
              <input 
                type="number"
                className="form-control"
                name="period_satisfaction"
                min="1"
                max="5"
                value={formData.period_satisfaction}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-control"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="mb-3">
              <label className="form-label">Observations</label>
              <textarea 
                className="form-control"
                rows={3}
                name="observations"
                placeholder="What you learned, what worked, what didn't..."
                value={formData.observations}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              <i className="fas fa-save me-2"></i>
              Update Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodLogManager;