import React, { useEffect, useState } from 'react';
import { useParent } from '@/contexts/ParentContext';

interface ChildMonitoringProps {
  childId: number;
  childName: string;
}

interface CycleStats {
  latest_period_start?: string;
  next_period_prediction?: string;
  average_cycle_length?: number;
  average_period_length?: number;
  total_logs: number;
}

export const ChildMonitoring: React.FC<ChildMonitoringProps> = ({ childId, childName }) => {
  const { getLoadingState, getError, getChildCycleData, getChildMealData, getChildAppointmentData, fetchChildCycleLogs, fetchChildMealLogs, fetchChildAppointments } = useParent();
  const [activeTab, setActiveTab] = useState<'cycle' | 'meals' | 'appointments'>('cycle');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !childId) return;

    // Load data based on active tab
    if (activeTab === 'cycle') {
      fetchChildCycleLogs(childId);
    } else if (activeTab === 'meals') {
      fetchChildMealLogs(childId);
    } else if (activeTab === 'appointments') {
      fetchChildAppointments(childId);
    }
  }, [activeTab, childId, mounted, fetchChildCycleLogs, fetchChildMealLogs, fetchChildAppointments]);

  const cycleData = getChildCycleData(childId);
  const mealData = getChildMealData(childId);
  const appointmentData = getChildAppointmentData(childId);

  const isCycleLoading = getLoadingState(`cycle_${childId}`);
  const isMealLoading = getLoadingState(`meal_${childId}`);
  const isAppointmentLoading = getLoadingState(`appointment_${childId}`);

  const cycleError = getError(`cycle_${childId}`);
  const mealError = getError(`meal_${childId}`);
  const appointmentError = getError(`appointment_${childId}`);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not recorded';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateCycleDaysSincePeriod = (lastPeriodStart?: string): number | null => {
    if (!lastPeriodStart) return null;
    const lastPeriod = new Date(lastPeriodStart);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">
            <i className="fas fa-heartbeat me-2"></i>
            {childName}'s Health Monitoring
          </h5>
          <span className="badge bg-white text-dark">Live</span>
        </div>
      </div>
      <div className="card-body p-0">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs" role="tablist" style={{ borderBottom: '2px solid #e9ecef' }}>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'cycle' ? 'active' : ''}`}
              onClick={() => setActiveTab('cycle')}
              type="button"
              role="tab"
            >
              <i className="fas fa-calendar-alt me-2"></i>
              Cycle Tracking
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'meals' ? 'active' : ''}`}
              onClick={() => setActiveTab('meals')}
              type="button"
              role="tab"
            >
              <i className="fas fa-utensils me-2"></i>
              Meals
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
              type="button"
              role="tab"
            >
              <i className="fas fa-calendar-check me-2"></i>
              Appointments
            </button>
          </li>
        </ul>

        <div className="p-4">
          {/* Cycle Tracking Tab */}
          {activeTab === 'cycle' && (
            <div className="tab-pane fade show active">
              {isCycleLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Loading cycle data...</p>
                </div>
              ) : cycleError ? (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {cycleError}
                </div>
              ) : cycleData?.items?.length > 0 ? (
                <>
                  {/* Cycle Stats Summary */}
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <small className="text-muted d-block mb-1">Last Period</small>
                        <h6 className="mb-0">
                          <i className="fas fa-calendar text-primary me-2"></i>
                          {formatDate(cycleData.items[0]?.start_date)}
                        </h6>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <small className="text-muted d-block mb-1">Total Cycles Tracked</small>
                        <h6 className="mb-0">
                          <i className="fas fa-chart-bar text-success me-2"></i>
                          {cycleData.total} cycles
                        </h6>
                      </div>
                    </div>
                  </div>

                  {/* Recent Cycle Logs */}
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>
                            <i className="fas fa-calendar me-2"></i>
                            Started
                          </th>
                          <th>
                            <i className="fas fa-hourglass-end me-2"></i>
                            Ended
                          </th>
                          <th>
                            <i className="fas fa-tint me-2"></i>
                            Flow
                          </th>
                          <th>
                            <i className="fas fa-notes-medical me-2"></i>
                            Symptoms
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycleData.items.slice(0, 5).map((log: any, idx: number) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              {formatDate(log.start_date)}
                            </td>
                            <td>{formatDate(log.end_date)}</td>
                            <td>
                              {log.flow_intensity && (
                                <span className={`badge ${
                                  log.flow_intensity === 'light' ? 'bg-info' :
                                  log.flow_intensity === 'medium' ? 'bg-warning' :
                                  'bg-danger'
                                }`}>
                                  {log.flow_intensity}
                                </span>
                              )}
                            </td>
                            <td>
                              <small className="text-muted">{log.symptoms || '-'}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No cycle logs recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Meals Tab */}
          {activeTab === 'meals' && (
            <div className="tab-pane fade show active">
              {isMealLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Loading meal logs...</p>
                </div>
              ) : mealError ? (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {mealError}
                </div>
              ) : mealData?.items?.length > 0 ? (
                <>
                  {/* Meal Summary */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Recent Meals</h6>
                      <span className="badge bg-primary">{mealData.total} logged</span>
                    </div>
                  </div>

                  {/* Meals List */}
                  <div className="list-group list-group-flush">
                    {mealData.items.slice(0, 10).map((meal: any, idx: number) => (
                      <div key={idx} className="list-group-item px-0 py-2 border-bottom-light">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <span className={`badge me-2 ${
                                meal.meal_type === 'breakfast' ? 'bg-warning' :
                                meal.meal_type === 'lunch' ? 'bg-success' :
                                meal.meal_type === 'dinner' ? 'bg-info' :
                                'bg-secondary'
                              }`}>
                                {meal.meal_type}
                              </span>
                              <strong className="text-capitalize">{meal.meal_type}</strong>
                            </div>
                            <p className="mb-1 text-muted small">{meal.description}</p>
                            {meal.calories && (
                              <small className="text-muted">
                                <i className="fas fa-fire me-1 text-danger"></i>
                                {meal.calories} cal
                              </small>
                            )}
                          </div>
                          <small className="text-muted">{formatDate(meal.meal_time)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-utensils fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No meal logs recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="tab-pane fade show active">
              {isAppointmentLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Loading appointments...</p>
                </div>
              ) : appointmentError ? (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {appointmentError}
                </div>
              ) : appointmentData?.items?.length > 0 ? (
                <>
                  {/* Appointments Summary */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Health Provider Appointments</h6>
                      <span className="badge bg-primary">{appointmentData.total} total</span>
                    </div>
                  </div>

                  {/* Appointments List */}
                  <div className="list-group list-group-flush">
                    {appointmentData.items.map((apt: any, idx: number) => (
                      <div key={idx} className="list-group-item px-0 py-3 border-bottom-light">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-calendar text-primary me-2"></i>
                              <strong>{formatDate(apt.appointment_date)}</strong>
                              <span className={`badge ms-2 ${
                                apt.status === 'confirmed' ? 'bg-success' :
                                apt.status === 'pending' ? 'bg-warning' :
                                apt.status === 'completed' ? 'bg-info' :
                                'bg-secondary'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                            <p className="mb-0 text-muted small">
                              <i className="fas fa-stethoscope me-1"></i>
                              {apt.issue}
                            </p>
                            {apt.appointment_for && (
                              <small className="text-muted">
                                For: {apt.appointment_for}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No appointments scheduled yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
