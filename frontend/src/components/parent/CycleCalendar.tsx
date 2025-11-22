import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../utils/apiBase';

interface CycleLog {
  id: number;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  period_length: number | null;
  symptoms: string;
  notes: string;
  created_at: string;
}

interface CycleCalendarProps {
  childId: number;
  childName: string;
}

export const CycleCalendar: React.FC<CycleCalendarProps> = ({ childId, childName }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<{
    nextPeriodStart: string | null;
    nextPeriodEnd: string | null;
    averageCycleLength: number;
    averagePeriodLength: number;
  }>({
    nextPeriodStart: null,
    nextPeriodEnd: null,
    averageCycleLength: 0,
    averagePeriodLength: 0
  });

  useEffect(() => {
    fetchCycleLogs();
  }, [childId]);

  const fetchCycleLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(
            `${API_BASE_URL}/api/parents/children/${childId}/cycle-logs`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const logs = data.items || [];
        setCycleLogs(logs);
        calculatePredictions(logs);
      }
    } catch (err) {
      console.error('Error fetching cycle logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePredictions = (logs: CycleLog[]) => {
    if (logs.length === 0) {
      setPredictions({
        nextPeriodStart: null,
        nextPeriodEnd: null,
        averageCycleLength: 0,
        averagePeriodLength: 0
      });
      return;
    }

    // Calculate average cycle and period lengths
    const cycleLengths = logs
      .filter(log => log.cycle_length)
      .map(log => log.cycle_length as number);
    
    const periodLengths = logs
      .filter(log => log.period_length)
      .map(log => log.period_length as number);

    const avgCycleLength = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28;
    
    const avgPeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

    // Get the most recent cycle
    const mostRecent = logs[0]; // Already sorted by date descending
    if (mostRecent && mostRecent.start_date) {
      const lastPeriodStart = new Date(mostRecent.start_date);
      const nextPeriodStart = new Date(lastPeriodStart);
      nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycleLength);

      const nextPeriodEnd = new Date(nextPeriodStart);
      nextPeriodEnd.setDate(nextPeriodEnd.getDate() + avgPeriodLength - 1);

      setPredictions({
        nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
        nextPeriodEnd: nextPeriodEnd.toISOString().split('T')[0],
        averageCycleLength: avgCycleLength,
        averagePeriodLength: avgPeriodLength
      });
    }
  };

  const getDateType = (date: string): 'period' | 'fertile' | 'safe' | 'none' => {
    const checkDate = new Date(date);
    
    // Check if it's during a logged period
    for (const log of cycleLogs) {
      const startDate = new Date(log.start_date);
      const endDate = log.end_date ? new Date(log.end_date) : new Date(startDate);
      
      if (checkDate >= startDate && checkDate <= endDate) {
        return 'period';
      }
    }

    // Check if it's predicted period
    if (predictions.nextPeriodStart && predictions.nextPeriodEnd) {
      const start = new Date(predictions.nextPeriodStart);
      const end = new Date(predictions.nextPeriodEnd);
      
      if (checkDate >= start && checkDate <= end) {
        return 'period';
      }

      // Fertile window (5 days before ovulation + ovulation day)
      const ovulationDay = new Date(start);
      ovulationDay.setDate(ovulationDay.getDate() - Math.round(predictions.averageCycleLength / 2));
      
      const fertileStart = new Date(ovulationDay);
      fertileStart.setDate(fertileStart.getDate() - 5);
      
      const fertileEnd = new Date(ovulationDay);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      if (checkDate >= fertileStart && checkDate <= fertileEnd) {
        return 'fertile';
      }
    }

    return 'safe';
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (d: number) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    return `${currentDate.getFullYear()}-${month}-${day}`;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthDays = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= monthDays; i++) {
    calendarDays.push(i);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getLogForDate = (date: string) => {
    for (const log of cycleLogs) {
      const startDate = new Date(log.start_date).toISOString().split('T')[0];
      const endDate = log.end_date ? new Date(log.end_date).toISOString().split('T')[0] : null;
      
      if (startDate === date) return { ...log, type: 'start' };
      if (endDate === date) return { ...log, type: 'end' };
    }
    return null;
  };

  const getColorForDate = (date: string) => {
    const type = getDateType(date);
    switch (type) {
      case 'period':
        return '#dc3545'; // Red
      case 'fertile':
        return '#ffc107'; // Yellow
      case 'safe':
        return '#28a745'; // Green
      default:
        return '#e9ecef'; // Light gray
    }
  };

  const selectedDateLog = selectedDate ? getLogForDate(selectedDate) : null;

  return (
    <div className="card h-100 shadow-sm">
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '15px 20px', borderRadius: '8px 8px 0 0' }}>
        <h5 className="mb-0 text-white">
          <i className="fas fa-heart me-2"></i>
          {childName}'s Cycle Calendar
        </h5>
      </div>
      <div className="card-body" style={{ padding: '20px' }}>
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Predictions Summary */}
            <div className="row mb-4 g-2">
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <small className="text-muted d-block">Average Cycle Length</small>
                    <h5 className="mb-0 text-primary">{predictions.averageCycleLength} days</h5>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <small className="text-muted d-block">Average Period Length</small>
                    <h5 className="mb-0 text-danger">{predictions.averagePeriodLength} days</h5>
                  </div>
                </div>
              </div>
            </div>

            {predictions.nextPeriodStart && (
              <div className="alert alert-info mb-3">
                <i className="fas fa-calendar-alt me-2"></i>
                <strong>Next Predicted Period:</strong> {predictions.nextPeriodStart} to {predictions.nextPeriodEnd}
              </div>
            )}

            {/* Month Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px 0' }}>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={previousMonth}
                style={{ borderRadius: '50%', width: '36px', height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <h6 className="mb-0" style={{ fontSize: '18px', fontWeight: '600' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h6>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={nextMonth}
                style={{ borderRadius: '50%', width: '36px', height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid mb-3" style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Weekday Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center fw-bold small py-2" style={{ borderRight: '1px solid #dee2e6' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#dee2e6', padding: '1px' }}>
                {calendarDays.map((day, index) => {
                  const dateStr = day ? formatDate(day) : null;
                  const dayType = dateStr ? getDateType(dateStr) : 'none';
                  const color = dateStr ? getColorForDate(dateStr) : '#ffffff';
                  const dayLog = dateStr ? getLogForDate(dateStr) : null;
                  const isToday =
                    day &&
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={index}
                      style={{
                        minHeight: '100px',
                        backgroundColor: color,
                        border: isToday ? '3px solid #0d6efd' : '1px solid #dee2e6',
                        cursor: day ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        padding: '6px',
                        fontSize: '14px',
                        fontWeight: day ? 'bold' : 'normal',
                        color: day ? '#000' : '#ccc'
                      }}
                      onClick={() => {
                        if (dateStr) setSelectedDate(dateStr);
                      }}
                      onMouseEnter={(e) => {
                        if (day) {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {day && (
                        <>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {day}
                          </span>
                          <div style={{ marginTop: 'auto' }}>
                            {dayLog && (
                              <span style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>
                                {dayLog.type === 'start' ? '●' : '○'}
                              </span>
                            )}
                            <span style={{ fontSize: '18px', display: 'block' }}>
                              {dayType === 'period' && '🩸'}
                              {dayType === 'fertile' && '🔥'}
                              {dayType === 'safe' && '✓'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mb-3 p-3 bg-light rounded" style={{ border: '1px solid #dee2e6' }}>
              <h6 className="mb-2">Legend:</h6>
              <div className="row g-2 small">
                <div className="col-auto d-flex align-items-center">
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#dc3545',
                      borderRadius: '2px',
                      marginRight: '6px'
                    }}
                  ></span>
                  Period (🩸)
                </div>
                <div className="col-auto d-flex align-items-center">
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#ffc107',
                      borderRadius: '2px',
                      marginRight: '6px'
                    }}
                  ></span>
                  Fertile Window (🔥)
                </div>
                <div className="col-auto d-flex align-items-center">
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#28a745',
                      borderRadius: '2px',
                      marginRight: '6px'
                    }}
                  ></span>
                  Safe Days (✓)
                </div>
                <div className="col-auto d-flex align-items-center">
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '3px solid #0d6efd',
                      borderRadius: '2px',
                      marginRight: '6px'
                    }}
                  ></span>
                  Today
                </div>
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="card mt-3 border-primary">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    {selectedDate}
                  </h6>
                </div>
                <div className="card-body">
                  {selectedDateLog ? (
                    <div>
                      <div className="mb-2">
                        <small className="text-muted">
                          {selectedDateLog.type === 'start' ? 'Period Start' : 'Period End'}
                        </small>
                        <p className="mb-0">
                          <strong>{selectedDateLog.notes || 'No additional notes'}</strong>
                        </p>
                      </div>
                      {selectedDateLog.symptoms && (
                        <div>
                          <small className="text-muted">Symptoms:</small>
                          <p className="mb-0 small">{selectedDateLog.symptoms}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <small className="text-muted d-block mb-2">
                        {getDateType(selectedDate) === 'period' && (
                          <>
                            <i className="fas fa-circle text-danger me-2"></i>
                            Period Day - Part of menstrual cycle
                          </>
                        )}
                        {getDateType(selectedDate) === 'fertile' && (
                          <>
                            <i className="fas fa-circle text-warning me-2"></i>
                            Fertile Window - Higher chance of pregnancy
                          </>
                        )}
                        {getDateType(selectedDate) === 'safe' && (
                          <>
                            <i className="fas fa-circle text-success me-2"></i>
                            Safe Days - Lower chance of pregnancy
                          </>
                        )}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Cycles */}
            {cycleLogs.length > 0 && (
              <div className="mt-4">
                <h6 className="mb-3">Recent Cycle History</h6>
                <div className="list-group list-group-sm">
                  {cycleLogs.slice(0, 5).map((log, idx) => (
                    <div
                      key={idx}
                      className="list-group-item"
                      style={{ borderLeft: '4px solid #dc3545' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong className="small">
                            {new Date(log.start_date).toLocaleDateString()} 
                            {log.end_date && ` - ${new Date(log.end_date).toLocaleDateString()}`}
                          </strong>
                          {log.symptoms && (
                            <p className="mb-0 small text-muted">
                              <i className="fas fa-heartbeat me-1"></i>
                              {log.symptoms}
                            </p>
                          )}
                        </div>
                        <div className="text-end">
                          {log.period_length && (
                            <span className="badge bg-light text-dark small">
                              {log.period_length}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cycleLogs.length === 0 && (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                No cycle logs recorded yet. Start logging cycles to see predictions!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
