'use client';

import type { Analytics } from '../../types/health-provider';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/health-provider';

interface AnalyticsTabProps {
  analytics: Analytics;
  onLoadAnalytics: (days: number) => void;
}

export default function AnalyticsTab({ 
  analytics, 
  onLoadAnalytics 
}: AnalyticsTabProps) {
  return (
    <div className="row">
      <div className="col-md-6 mb-4">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Appointment Status Breakdown</h5>
            <div className="btn-group btn-group-sm">
              <button 
                className="btn btn-outline-primary"
                onClick={() => onLoadAnalytics(7)}
              >
                7 Days
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={() => onLoadAnalytics(30)}
              >
                30 Days
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={() => onLoadAnalytics(90)}
              >
                90 Days
              </button>
            </div>
          </div>
          <div className="card-body">
            {Object.entries(analytics.status_breakdown).map(([status, count]) => (
              <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-capitalize">{status}:</span>
                <span className={`badge ${getStatusBadgeClass(status)}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="col-md-6 mb-4">
        <div className="card">
          <div className="card-header">
            <h5>Priority Distribution</h5>
          </div>
          <div className="card-body">
            {Object.entries(analytics.priority_breakdown).map(([priority, count]) => (
              <div key={priority} className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-capitalize">{priority}:</span>
                <span className={`badge ${getPriorityBadgeClass(priority)}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="col-md-12 mb-4">
        <div className="card">
          <div className="card-header">
            <h5>Performance Metrics</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h4 className="text-primary">{analytics.total_appointments}</h4>
                  <small className="text-muted">Total Appointments</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h4 className="text-success">{analytics.completed_appointments}</h4>
                  <small className="text-muted">Completed</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h4 className="text-info">{analytics.success_rate}%</h4>
                  <small className="text-muted">Success Rate</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h4 className="text-warning">{analytics.average_rating.toFixed(1)}</h4>
                  <small className="text-muted">Avg Rating</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-md-12">
        <div className="card">
          <div className="card-header">
            <h5>Daily Appointment Trends</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(analytics.daily_counts).slice(-7).map(([date, count]) => (
                <div key={date} className="col-md-4 col-lg-3 mb-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6 className="card-title">
                        {new Date(date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h6>
                      <h4 className="text-primary">{count}</h4>
                      <small className="text-muted">Appointments</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {Object.keys(analytics.daily_counts).length === 0 && (
              <div className="text-center py-4">
                <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                <p>No data available for the selected period</p>
                <small className="text-muted">Analytics will appear here once you have appointment data</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
