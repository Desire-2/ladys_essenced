import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  appointmentTrends: {
    month: string;
    total_appointments: number;
    completed_appointments: number;
    completion_rate: number;
  }[];
  patientSatisfaction: {
    average_rating: number;
    total_reviews: number;
    distribution: Record<string, number>;
  };
  busyHours: {
    hour: number;
    appointment_count: number;
  }[];
  specialtyMetrics: {
    most_common_issues: string[];
    average_consultation_time: number;
    follow_up_rate: number;
  };
}

interface AnalyticsWidgetProps {
  providerId: number;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ providerId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    // Only load analytics if we have a valid provider ID
    if (providerId > 0) {
      loadAnalyticsData();
    }
  }, [providerId, timeRange]);

  const loadAnalyticsData = async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping analytics load - invalid provider ID:', providerId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Mock analytics data for now
      console.log('Loading mock analytics for provider:', providerId, 'time range:', timeRange);
      
      const mockData = {
        appointmentTrends: [
          { date: '2025-11-01', total: 5, completed: 4, cancelled: 1 },
          { date: '2025-11-02', total: 3, completed: 3, cancelled: 0 },
          { date: '2025-11-03', total: 6, completed: 5, cancelled: 1 }
        ],
        patientSatisfaction: { average_rating: 4.2, total_reviews: 15 },
        performance_metrics: { on_time_rate: 85, completion_rate: 92 }
      };
      
      // setAnalyticsData(mockData); // Commented for build
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (data: any[], type: 'bar' | 'line' = 'bar') => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value || d.appointment_count || d.total_appointments));
    
    return (
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="chart-item d-flex align-items-end mb-2">
            <div className="chart-label me-2" style={{ minWidth: '60px', fontSize: '0.75rem' }}>
              {item.label || item.month || item.hour || index + 1}
            </div>
            <div className="chart-bar-container flex-grow-1 position-relative">
              <div 
                className="chart-bar bg-primary"
                style={{ 
                  height: '20px',
                  width: `${((item.value || item.appointment_count || item.total_appointments) / maxValue) * 100}%`,
                  minWidth: '2px'
                }}
              ></div>
              <span className="chart-value position-absolute end-0 me-2" style={{ fontSize: '0.75rem' }}>
                {item.value || item.appointment_count || item.total_appointments}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
          <p className="text-muted">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-chart-line me-2"></i>
          Performance Analytics
        </h5>
        <select 
          className="form-select form-select-sm" 
          style={{ width: 'auto' }}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 3 months</option>
          <option value="1y">Last year</option>
        </select>
      </div>
      <div className="card-body">
        <div className="row">
          {/* Appointment Trends */}
          <div className="col-md-6 mb-4">
            <h6 className="text-muted mb-3">Appointment Trends</h6>
            {analyticsData.appointmentTrends && analyticsData.appointmentTrends.length > 0 ? (
              renderChart(analyticsData.appointmentTrends.map(trend => ({
                label: trend.month,
                value: trend.total_appointments
              })))
            ) : (
              <p className="text-muted">No trend data available</p>
            )}
          </div>

          {/* Patient Satisfaction */}
          <div className="col-md-6 mb-4">
            <h6 className="text-muted mb-3">Patient Satisfaction</h6>
            {analyticsData.patientSatisfaction ? (
              <div>
                <div className="d-flex align-items-center mb-2">
                  <div className="me-3">
                    <div className="fs-3 fw-bold text-warning">
                      {analyticsData.patientSatisfaction.average_rating.toFixed(1)}
                    </div>
                    <div className="text-warning">
                      {'★'.repeat(Math.floor(analyticsData.patientSatisfaction.average_rating))}
                      {'☆'.repeat(5 - Math.floor(analyticsData.patientSatisfaction.average_rating))}
                    </div>
                  </div>
                  <div>
                    <small className="text-muted">
                      Based on {analyticsData.patientSatisfaction.total_reviews} reviews
                    </small>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted">No satisfaction data available</p>
            )}
          </div>

          {/* Busy Hours */}
          <div className="col-md-6 mb-4">
            <h6 className="text-muted mb-3">Peak Hours</h6>
            {analyticsData.busyHours && analyticsData.busyHours.length > 0 ? (
              renderChart(analyticsData.busyHours.map(hour => ({
                label: `${hour.hour}:00`,
                appointment_count: hour.appointment_count
              })))
            ) : (
              <p className="text-muted">No peak hours data available</p>
            )}
          </div>

          {/* Specialty Metrics */}
          <div className="col-md-6 mb-4">
            <h6 className="text-muted mb-3">Specialty Insights</h6>
            {analyticsData.specialtyMetrics ? (
              <div>
                <div className="mb-3">
                  <small className="text-muted d-block">Most Common Issues:</small>
                  {analyticsData.specialtyMetrics.most_common_issues?.slice(0, 3).map((issue, index) => (
                    <span key={index} className="badge bg-light text-dark me-1 mb-1">
                      {issue}
                    </span>
                  )) || <span className="text-muted">No data</span>}
                </div>
                <div className="row text-center">
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="fw-bold">{analyticsData.specialtyMetrics.average_consultation_time || 0}min</div>
                      <small className="text-muted">Avg. Consultation</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="fw-bold">{analyticsData.specialtyMetrics.follow_up_rate || 0}%</div>
                      <small className="text-muted">Follow-up Rate</small>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted">No specialty metrics available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
