import React, { useState, useEffect } from 'react';
import { usePeriod } from '@/contexts/PeriodContext';

export const PeriodLogsManagement = () => {
  const {
    periodLogs,
    insights,
    loading,
    error,
    fetchPeriodLogs,
    fetchInsights,
    createPeriodLog,
    updatePeriodLog,
    deletePeriodLog
  } = usePeriod();

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    flow_level: 'medium',
    pain_level: 3,
    mood: 'neutral',
    symptoms: '',
    notes: '',
    tampon_count: 0,
    pad_count: 0,
    cup_emptied: 0,
    sleep_quality: 'good',
    exercise_intensity: 'none',
    water_intake: 8,
    stress_level: 3,
    medication_taken: '',
    food_cravings: '',
    energy_level: 'normal',
    body_temperature: null,
    cervical_mucus: '',
    breast_tenderness: false,
    bloating_severity: 1,
    headache_severity: 0,
    back_pain_severity: 0
  });

  useEffect(() => {
    fetchPeriodLogs();
    fetchInsights();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createPeriodLog(newLog);
    if (result.success) {
      setShowAddForm(false);
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        flow_level: 'medium',
        pain_level: 3,
        mood: 'neutral',
        symptoms: '',
        notes: '',
        tampon_count: 0,
        pad_count: 0,
        cup_emptied: 0,
        sleep_quality: 'good',
        exercise_intensity: 'none',
        water_intake: 8,
        stress_level: 3,
        medication_taken: '',
        food_cravings: '',
        energy_level: 'normal',
        body_temperature: null,
        cervical_mucus: '',
        breast_tenderness: false,
        bloating_severity: 1,
        headache_severity: 0,
        back_pain_severity: 0
      });
      await fetchPeriodLogs();
      await fetchInsights();
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    const result = await updatePeriodLog(id, data);
    if (result.success) {
      setSelectedLog(null);
      await fetchPeriodLogs();
      await fetchInsights();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this period log?')) {
      const result = await deletePeriodLog(id);
      if (result.success) {
        setSelectedLog(null);
        await fetchPeriodLogs();
        await fetchInsights();
      }
    }
  };

  const getFlowColor = (flow: string) => {
    switch (flow) {
      case 'spotting': return 'text-info';
      case 'light': return 'text-success';
      case 'medium': return 'text-warning';
      case 'heavy': return 'text-danger';
      case 'very_heavy': return 'text-dark';
      default: return 'text-muted';
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      'very_good': '😄',
      'good': '🙂',
      'neutral': '😐',
      'low': '😔',
      'very_low': '😢',
      'irritable': '😤',
      'anxious': '😰',
      'emotional': '🥺'
    };
    return moodMap[mood] || '😐';
  };

  const getPainIndicator = (level: number) => {
    if (level === 0) return <span className="text-success">●</span>;
    if (level <= 3) return <span className="text-warning">●</span>;
    if (level <= 6) return <span className="text-danger">●</span>;
    return <span className="text-dark">●</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFilteredLogs = () => {
    if (!filterMonth) return periodLogs;
    return periodLogs.filter(log => 
      log.date.startsWith(filterMonth)
    );
  };

  const generateCalendarDays = () => {
    const [year, month] = filterMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0 || days.length < 35) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length >= 42) break; // Max 6 weeks
    }
    
    return days;
  };

  const getLogForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return periodLogs.find(log => log.date === dateStr);
  };

  if (loading && !periodLogs.length) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your period logs...</p>
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
            <i className="fas fa-heart me-2 text-danger"></i>
            Period Tracking
          </h2>
          <p className="text-muted">Detailed daily period tracking and insights</p>
        </div>
        <div className="col-md-6 text-end">
          <div className="btn-group me-2">
            <button
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('calendar')}
            >
              <i className="fas fa-calendar me-1"></i>
              Calendar
            </button>
            <button
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list me-1"></i>
              List
            </button>
          </div>
          <button
            className="btn btn-success"
            onClick={() => setShowAddForm(true)}
          >
            <i className="fas fa-plus me-1"></i>
            Add Period Log
          </button>
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-check fa-2x text-primary mb-2"></i>
                <h6 className="card-title">Average Cycle</h6>
                <h4 className="text-primary">{insights.average_cycle_length || 28} days</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-tint fa-2x text-danger mb-2"></i>
                <h6 className="card-title">Average Period</h6>
                <h4 className="text-danger">{insights.average_period_length || 5} days</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-chart-line fa-2x text-success mb-2"></i>
                <h6 className="card-title">Regularity</h6>
                <h4 className="text-success">{insights.cycle_regularity || 'Regular'}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-plus fa-2x text-info mb-2"></i>
                <h6 className="card-title">Next Period</h6>
                <h4 className="text-info">
                  {insights.next_period_prediction ? 
                    formatDate(insights.next_period_prediction) : 
                    'Calculating...'
                  }
                </h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month Filter */}
      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="month"
            className="form-control"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
        <div className="col-md-8 text-end">
          <span className="badge bg-secondary fs-6 py-2 px-3">
            {getFilteredLogs().length} log{getFilteredLogs().length !== 1 ? 's' : ''} this month
          </span>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <div className="card">
          <div className="card-body">
            <div className="calendar-grid">
              <div className="row text-center mb-2">
                <div className="col fw-bold text-muted">Sun</div>
                <div className="col fw-bold text-muted">Mon</div>
                <div className="col fw-bold text-muted">Tue</div>
                <div className="col fw-bold text-muted">Wed</div>
                <div className="col fw-bold text-muted">Thu</div>
                <div className="col fw-bold text-muted">Fri</div>
                <div className="col fw-bold text-muted">Sat</div>
              </div>
              
              {generateCalendarDays().reduce((weeks: Date[][], day, index) => {
                if (index % 7 === 0) weeks.push([]);
                weeks[weeks.length - 1].push(day);
                return weeks;
              }, []).map((week, weekIndex) => (
                <div key={weekIndex} className="row mb-2">
                  {week.map((day, dayIndex) => {
                    const log = getLogForDate(day);
                    const isCurrentMonth = day.getMonth() === new Date(filterMonth + '-01').getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={dayIndex} className="col p-1">
                        <div
                          className={`calendar-day p-2 rounded cursor-pointer ${
                            !isCurrentMonth ? 'text-muted bg-light' : 
                            isToday ? 'bg-primary text-white' :
                            log ? 'bg-danger-subtle border border-danger' : 'bg-white border'
                          }`}
                          style={{ minHeight: '80px', cursor: 'pointer' }}
                          onClick={() => log && setSelectedLog(log)}
                        >
                          <div className="d-flex justify-content-between">
                            <small className="fw-bold">{day.getDate()}</small>
                            {log && (
                              <div className="d-flex align-items-center">
                                <span className={`fas fa-circle ${getFlowColor(log.flow_level)} me-1`} style={{ fontSize: '8px' }}></span>
                                {getPainIndicator(log.pain_level)}
                              </div>
                            )}
                          </div>
                          {log && (
                            <div className="mt-1">
                              <div className="d-flex align-items-center justify-content-center">
                                <span style={{ fontSize: '16px' }}>{getMoodEmoji(log.mood)}</span>
                              </div>
                              <small className={`d-block text-center ${getFlowColor(log.flow_level)}`}>
                                {log.flow_level}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Flow</th>
                    <th>Pain</th>
                    <th>Mood</th>
                    <th>Products Used</th>
                    <th>Symptoms</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredLogs().map((log) => (
                    <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }}>
                      <td><strong>{formatDate(log.date)}</strong></td>
                      <td>
                        <span className={`badge ${
                          log.flow_level === 'spotting' ? 'bg-info' :
                          log.flow_level === 'light' ? 'bg-success' :
                          log.flow_level === 'medium' ? 'bg-warning' :
                          log.flow_level === 'heavy' ? 'bg-danger' :
                          'bg-dark'
                        }`}>
                          {log.flow_level}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {getPainIndicator(log.pain_level)}
                          <span className="ms-1">{log.pain_level}/10</span>
                        </div>
                      </td>
                      <td>
                        <span className="me-1">{getMoodEmoji(log.mood)}</span>
                        {log.mood.replace('_', ' ')}
                      </td>
                      <td>
                        <small>
                          {log.tampon_count > 0 && `${log.tampon_count} tampons `}
                          {log.pad_count > 0 && `${log.pad_count} pads `}
                          {log.cup_emptied > 0 && `${log.cup_emptied} cup`}
                        </small>
                      </td>
                      <td>
                        <small className="text-truncate d-block" style={{ maxWidth: '200px' }}>
                          {log.symptoms || '—'}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(log.id);
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
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Period Log</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddForm(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Date */}
                    <div className="col-md-6">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newLog.date}
                        onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                        required
                      />
                    </div>

                    {/* Flow Level */}
                    <div className="col-md-6">
                      <label className="form-label">Flow Level *</label>
                      <select
                        className="form-select"
                        value={newLog.flow_level}
                        onChange={(e) => setNewLog({ ...newLog, flow_level: e.target.value })}
                        required
                      >
                        <option value="spotting">Spotting</option>
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                        <option value="very_heavy">Very Heavy</option>
                      </select>
                    </div>

                    {/* Pain Level */}
                    <div className="col-md-6">
                      <label className="form-label">Pain Level (0-10)</label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="10"
                        value={newLog.pain_level}
                        onChange={(e) => setNewLog({ ...newLog, pain_level: parseInt(e.target.value) })}
                      />
                      <div className="d-flex justify-content-between">
                        <small>0 (No pain)</small>
                        <small className="fw-bold">{newLog.pain_level}</small>
                        <small>10 (Severe)</small>
                      </div>
                    </div>

                    {/* Mood */}
                    <div className="col-md-6">
                      <label className="form-label">Mood</label>
                      <select
                        className="form-select"
                        value={newLog.mood}
                        onChange={(e) => setNewLog({ ...newLog, mood: e.target.value })}
                      >
                        <option value="very_good">Very Good 😄</option>
                        <option value="good">Good 🙂</option>
                        <option value="neutral">Neutral 😐</option>
                        <option value="low">Low 😔</option>
                        <option value="very_low">Very Low 😢</option>
                        <option value="irritable">Irritable 😤</option>
                        <option value="anxious">Anxious 😰</option>
                        <option value="emotional">Emotional 🥺</option>
                      </select>
                    </div>

                    {/* Product Usage */}
                    <div className="col-12">
                      <h6>Product Usage</h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">Tampons Used</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={newLog.tampon_count}
                            onChange={(e) => setNewLog({ ...newLog, tampon_count: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Pads Used</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={newLog.pad_count}
                            onChange={(e) => setNewLog({ ...newLog, pad_count: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Cup Emptied</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={newLog.cup_emptied}
                            onChange={(e) => setNewLog({ ...newLog, cup_emptied: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Wellness Metrics */}
                    <div className="col-12">
                      <h6>Wellness Tracking</h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">Sleep Quality</label>
                          <select
                            className="form-select"
                            value={newLog.sleep_quality}
                            onChange={(e) => setNewLog({ ...newLog, sleep_quality: e.target.value })}
                          >
                            <option value="poor">Poor</option>
                            <option value="fair">Fair</option>
                            <option value="good">Good</option>
                            <option value="excellent">Excellent</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Energy Level</label>
                          <select
                            className="form-select"
                            value={newLog.energy_level}
                            onChange={(e) => setNewLog({ ...newLog, energy_level: e.target.value })}
                          >
                            <option value="very_low">Very Low</option>
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="very_high">Very High</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Water Intake (glasses)</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={newLog.water_intake}
                            onChange={(e) => setNewLog({ ...newLog, water_intake: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="col-12">
                      <label className="form-label">Symptoms</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={newLog.symptoms}
                        onChange={(e) => setNewLog({ ...newLog, symptoms: e.target.value })}
                        placeholder="Describe any symptoms you're experiencing..."
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={newLog.notes}
                        onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Period Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && !showAddForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Period Log - {formatDate(selectedLog.date)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedLog(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body text-center">
                        <h6 className="card-title">Flow Level</h6>
                        <span className={`badge fs-6 ${
                          selectedLog.flow_level === 'spotting' ? 'bg-info' :
                          selectedLog.flow_level === 'light' ? 'bg-success' :
                          selectedLog.flow_level === 'medium' ? 'bg-warning' :
                          selectedLog.flow_level === 'heavy' ? 'bg-danger' :
                          'bg-dark'
                        }`}>
                          {selectedLog.flow_level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body text-center">
                        <h6 className="card-title">Pain Level</h6>
                        <div className="d-flex align-items-center justify-content-center">
                          {getPainIndicator(selectedLog.pain_level)}
                          <span className="ms-2 fs-5">{selectedLog.pain_level}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body text-center">
                        <h6 className="card-title">Mood</h6>
                        <div>
                          <span style={{ fontSize: '24px' }}>{getMoodEmoji(selectedLog.mood)}</span>
                          <div>{selectedLog.mood.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body text-center">
                        <h6 className="card-title">Products Used</h6>
                        <small>
                          {selectedLog.tampon_count > 0 && (
                            <div><i className="fas fa-circle text-primary me-1"></i>{selectedLog.tampon_count} tampons</div>
                          )}
                          {selectedLog.pad_count > 0 && (
                            <div><i className="fas fa-square text-success me-1"></i>{selectedLog.pad_count} pads</div>
                          )}
                          {selectedLog.cup_emptied > 0 && (
                            <div><i className="fas fa-wine-glass text-info me-1"></i>{selectedLog.cup_emptied} cup</div>
                          )}
                          {!selectedLog.tampon_count && !selectedLog.pad_count && !selectedLog.cup_emptied && (
                            <span className="text-muted">None recorded</span>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  {selectedLog.symptoms && (
                    <div className="col-12">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">Symptoms</h6>
                          <p className="card-text">{selectedLog.symptoms}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedLog.notes && (
                    <div className="col-12">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">Notes</h6>
                          <p className="card-text">{selectedLog.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(selectedLog.id)}
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodLogsManagement;