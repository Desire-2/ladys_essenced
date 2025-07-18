'use client';

import { useState, useEffect } from 'react';
import type { ProviderStats } from '../../types/health-provider';

interface EnhancedOverviewTabProps {
  stats: ProviderStats;
  onRefresh: () => void;
}

export default function EnhancedOverviewTab({ stats, onRefresh }: EnhancedOverviewTabProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState(stats);

  useEffect(() => {
    setRealtimeStats(stats);
  }, [stats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate performance metrics
  const completionRate = realtimeStats.appointment_stats.total > 0 
    ? Math.round((realtimeStats.appointment_stats.completed / realtimeStats.appointment_stats.total) * 100)
    : 0;

  const urgentPercentage = realtimeStats.appointment_stats.pending > 0
    ? Math.round((realtimeStats.appointment_stats.urgent / realtimeStats.appointment_stats.pending) * 100)
    : 0;

  return (
    <div className="enhanced-overview-tab">
      {/* Header with Refresh */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Dashboard Overview
          </h4>
          <p className="text-muted mb-0">Real-time insights into your practice</p>
        </div>
        <button 
          className={`btn btn-outline-primary ${refreshing ? 'disabled' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <i className={`fas fa-sync-alt me-1 ${refreshing ? 'fa-spin' : ''}`}></i>
          Refresh Data
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 kpi-card">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="avatar avatar-md bg-primary-light rounded-circle">
                  <i className="fas fa-calendar-check text-primary"></i>
                </div>
              </div>
              <h3 className="mb-1 text-primary">{realtimeStats.appointment_stats.total}</h3>
              <p className="text-muted mb-2">Total Appointments</p>
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-primary" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 kpi-card">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="avatar avatar-md bg-success-light rounded-circle">
                  <i className="fas fa-check-circle text-success"></i>
                </div>
              </div>
              <h3 className="mb-1 text-success">{completionRate}%</h3>
              <p className="text-muted mb-2">Completion Rate</p>
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 kpi-card">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="avatar avatar-md bg-warning-light rounded-circle">
                  <i className="fas fa-clock text-warning"></i>
                </div>
              </div>
              <h3 className="mb-1 text-warning">{realtimeStats.appointment_stats.pending}</h3>
              <p className="text-muted mb-2">Pending</p>
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{ width: realtimeStats.appointment_stats.total > 0 ? `${(realtimeStats.appointment_stats.pending / realtimeStats.appointment_stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100 kpi-card">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="avatar avatar-md bg-danger-light rounded-circle">
                  <i className="fas fa-exclamation-triangle text-danger"></i>
                </div>
              </div>
              <h3 className="mb-1 text-danger">{realtimeStats.appointment_stats.urgent}</h3>
              <p className="text-muted mb-2">Urgent Cases</p>
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-danger" 
                  style={{ width: urgentPercentage > 0 ? `${urgentPercentage}%` : '10%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Recent Activity */}
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-day me-2"></i>
                  Today's Schedule
                </h5>
                <span className="badge bg-primary-light text-primary">
                  {realtimeStats.appointment_stats.today} appointments
                </span>
              </div>
            </div>
            <div className="card-body">
              {realtimeStats.recent_appointments && realtimeStats.recent_appointments.length > 0 ? (
                <div className="timeline">
                  {realtimeStats.recent_appointments.slice(0, 5).map((appointment, index) => (
                    <div key={appointment.id} className="timeline-item">
                      <div className="timeline-marker">
                        <div className={`timeline-marker-dot ${
                          appointment.priority === 'urgent' ? 'bg-danger' :
                          appointment.priority === 'high' ? 'bg-warning' : 'bg-primary'
                        }`}></div>
                      </div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{appointment.patient_name}</h6>
                            <p className="text-muted mb-1">{appointment.issue.substring(0, 50)}...</p>
                            <small className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleTimeString() : 'Time TBD'}
                            </small>
                          </div>
                          <span className={`badge ${
                            appointment.status === 'confirmed' ? 'bg-success' :
                            appointment.status === 'pending' ? 'bg-warning' :
                            appointment.status === 'completed' ? 'bg-primary' : 'bg-secondary'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No appointments scheduled for today</h6>
                  <p className="text-muted">Your schedule is clear!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Quick Stats
              </h5>
            </div>
            <div className="card-body">
              <div className="quick-stat-item mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="icon-circle bg-success-light me-3">
                      <i className="fas fa-check text-success"></i>
                    </div>
                    <div>
                      <p className="mb-0 font-weight-medium">Completed</p>
                      <small className="text-muted">This week</small>
                    </div>
                  </div>
                  <h5 className="mb-0 text-success">{realtimeStats.appointment_stats.completed}</h5>
                </div>
              </div>

              <div className="quick-stat-item mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="icon-circle bg-primary-light me-3">
                      <i className="fas fa-calendar-week text-primary"></i>
                    </div>
                    <div>
                      <p className="mb-0 font-weight-medium">This Week</p>
                      <small className="text-muted">Total appointments</small>
                    </div>
                  </div>
                  <h5 className="mb-0 text-primary">{realtimeStats.appointment_stats.this_week}</h5>
                </div>
              </div>

              <div className="quick-stat-item mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="icon-circle bg-info-light me-3">
                      <i className="fas fa-user-clock text-info"></i>
                    </div>
                    <div>
                      <p className="mb-0 font-weight-medium">Confirmed</p>
                      <small className="text-muted">Ready to go</small>
                    </div>
                  </div>
                  <h5 className="mb-0 text-info">{realtimeStats.appointment_stats.confirmed}</h5>
                </div>
              </div>

              <hr className="my-3" />
              
              <div className="text-center">
                <h6 className="text-muted mb-2">Performance Score</h6>
                <div className="position-relative">
                  <div className="progress-circle mx-auto" style={{ width: '80px', height: '80px' }}>
                    <svg className="progress-ring" width="80" height="80">
                      <circle
                        className="progress-ring-circle"
                        stroke="#e9ecef"
                        strokeWidth="6"
                        fill="transparent"
                        r="34"
                        cx="40"
                        cy="40"
                      />
                      <circle
                        className="progress-ring-circle"
                        stroke="#28a745"
                        strokeWidth="6"
                        fill="transparent"
                        r="34"
                        cx="40"
                        cy="40"
                        strokeDasharray={`${completionRate * 2.14} 214`}
                        strokeDashoffset="0"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="progress-text">{completionRate}%</div>
                  </div>
                </div>
                <small className="text-muted">Completion rate</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      {realtimeStats.monthly_trends && realtimeStats.monthly_trends.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent">
                <h5 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Monthly Appointment Trends
                </h5>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: '300px' }}>
                  <div className="d-flex align-items-end justify-content-between" style={{ height: '250px' }}>
                    {realtimeStats.monthly_trends.reverse().map((month, index) => {
                      const maxValue = Math.max(...realtimeStats.monthly_trends.map(m => m.total_appointments));
                      const height = maxValue > 0 ? (month.total_appointments / maxValue) * 200 : 10;
                      const completedHeight = month.total_appointments > 0 ? (month.completed_appointments / month.total_appointments) * height : 0;
                      
                      return (
                        <div key={index} className="chart-bar-container text-center">
                          <div className="chart-bar position-relative mx-2" style={{ height: `${height}px`, width: '40px' }}>
                            <div 
                              className="chart-bar-total bg-primary-light" 
                              style={{ height: '100%', borderRadius: '4px' }}
                            ></div>
                            <div 
                              className="chart-bar-completed bg-primary position-absolute bottom-0" 
                              style={{ 
                                height: `${completedHeight}px`, 
                                width: '100%',
                                borderRadius: '4px'
                              }}
                            ></div>
                          </div>
                          <small className="text-muted mt-2 d-block">{month.month}</small>
                          <small className="text-primary fw-bold">{month.total_appointments}</small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="d-flex justify-content-center mt-3">
                    <div className="d-flex align-items-center me-4">
                      <div className="legend-color bg-primary-light me-2"></div>
                      <small>Total Appointments</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="legend-color bg-primary me-2"></div>
                      <small>Completed</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .kpi-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
        
        .avatar {
          width: 50px;
          height: 50px;
        }
        
        .avatar-md {
          width: 60px;
          height: 60px;
        }
        
        .bg-primary-light {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .bg-success-light {
          background-color: rgba(25, 135, 84, 0.1);
        }
        
        .bg-warning-light {
          background-color: rgba(255, 193, 7, 0.1);
        }
        
        .bg-danger-light {
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .bg-info-light {
          background-color: rgba(13, 202, 240, 0.1);
        }
        
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        
        .timeline-item {
          position: relative;
          padding-bottom: 20px;
        }
        
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: -21px;
          top: 20px;
          height: calc(100% - 10px);
          width: 2px;
          background-color: #e9ecef;
        }
        
        .timeline-marker {
          position: absolute;
          left: -25px;
          top: 0;
        }
        
        .timeline-marker-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .timeline-content {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 3px solid #dee2e6;
        }
        
        .quick-stat-item {
          padding: 10px 0;
        }
        
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .progress-circle {
          position: relative;
        }
        
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: bold;
          font-size: 14px;
        }
        
        .chart-container {
          overflow-x: auto;
        }
        
        .chart-bar-container {
          min-width: 60px;
          flex: 1;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        
        .font-weight-medium {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
