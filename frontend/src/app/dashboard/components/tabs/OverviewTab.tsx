import React from 'react';
import { Child, MealLog, Appointment, Notification, ActiveTab } from '../../types';
import CycleInsights from '../../../../components/CycleInsights';
import { AIInsights } from '../../../../components/insights';
import '../../../../styles/overview-tab.css';

interface OverviewTabProps {
  selectedChild: number | null;
  children: Child[];
  recentMeals: MealLog[];
  upcomingAppointments: Appointment[];
  notifications: Notification[];
  dataLoadingStates: any;
  dataErrors: any;
  dataAvailability: any;
  onRetryDataLoad: (dataType: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  userType?: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  selectedChild,
  children,
  recentMeals,
  upcomingAppointments,
  notifications,
  dataLoadingStates,
  dataErrors,
  dataAvailability,
  onRetryDataLoad,
  setActiveTab,
  userType
}) => {
  // Helper to get selected child info
  const selectedChildInfo = selectedChild ? children.find(c => c.user_id === selectedChild) : null;
  const isParentView = userType === 'parent' && selectedChild;
  
  return (
    <div className="overview-tab">
      {/* Welcome Header with Enhanced Design */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg position-relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            backgroundSize: '200% 200%',
            borderRadius: '25px'
          }}>
            {/* Floating Circles Background */}
            <div className="position-absolute w-100 h-100 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="position-absolute rounded-circle"
                  style={{
                    width: `${Math.random() * 150 + 50}px`,
                    height: `${Math.random() * 150 + 50}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(2px)',
                    transform: `translate(-50%, -50%)`
                  }}
                />
              ))}
            </div>

            <div className="card-body text-white p-4 position-relative">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center mb-3">
                    <div className="position-relative me-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                        width: '65px',
                        height: '65px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                      }}>
                        <i className="fas fa-heart-pulse" style={{ fontSize: '1.8rem', color: '#ff6b8a' }}></i>
                      </div>
                      <div className="position-absolute" style={{
                        top: '-5px',
                        right: '-5px',
                        width: '20px',
                        height: '20px',
                        background: '#4ade80',
                        borderRadius: '50%',
                        border: '3px solid white'
                      }}></div>
                    </div>
                    <div>
                      <h2 className="mb-1 fw-bold" style={{ 
                        fontSize: '2rem',
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                      }}>
                        {isParentView ? `${selectedChildInfo?.name}'s Health Hub` : 'Your Health Hub'}
                      </h2>
                      <p className="mb-0 opacity-90" style={{ fontSize: '1.05rem' }}>
                        {isParentView 
                          ? `Managing ${selectedChildInfo?.name}'s wellness journey`
                          : 'Your personalized wellness companion'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge" style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <i className="fas fa-shield-alt me-2"></i>Secure & Private
                    </span>
                    <span className="badge" style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <i className="fas fa-chart-line me-2"></i>Real-time Tracking
                    </span>
                    <span className="badge" style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <i className="fas fa-brain me-2"></i>AI-Powered
                    </span>
                  </div>
                </div>
                <div className="col-md-4 text-end d-none d-md-block">
                  <div className="position-relative d-inline-block">
                    {/* Pulsing rings */}
                    <div className="position-absolute top-50 start-50 translate-middle" style={{
                      width: '150px',
                      height: '150px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%'
                    }}></div>
                    <div className="position-absolute top-50 start-50 translate-middle" style={{
                      width: '120px',
                      height: '120px',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '50%'
                    }}></div>
                    <i className="fas fa-heartbeat" style={{ 
                      fontSize: '5rem', 
                      opacity: '0.4',
                      color: '#fff',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
                    }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics Row - Compact for Parent View */}
      {isParentView && selectedChildInfo && (
        <div className="row mb-4 g-3">
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              borderRadius: '15px'
            }}>
              <div className="card-body text-white text-center p-3">
                <i className="fas fa-utensils mb-2" style={{ fontSize: '2rem', opacity: '0.9' }}></i>
                <h4 className="mb-1 fw-bold">{recentMeals.length}</h4>
                <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Recent Meals</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px'
            }}>
              <div className="card-body text-white text-center p-3">
                <i className="fas fa-calendar-check mb-2" style={{ fontSize: '2rem', opacity: '0.9' }}></i>
                <h4 className="mb-1 fw-bold">{upcomingAppointments.length}</h4>
                <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Appointments</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              borderRadius: '15px'
            }}>
              <div className="card-body text-white text-center p-3">
                <i className="fas fa-heart-pulse mb-2" style={{ fontSize: '2rem', opacity: '0.9' }}></i>
                <h4 className="mb-1 fw-bold">Active</h4>
                <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Health Status</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              borderRadius: '15px'
            }}>
              <div className="card-body text-center p-3">
                <div className="position-relative d-inline-block mb-2">
                  <i className="fas fa-user-circle" style={{ 
                    fontSize: '2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}></i>
                </div>
                <h6 className="mb-0 fw-bold text-truncate" style={{ color: '#5a2d82' }}>{selectedChildInfo.name}</h6>
                <small style={{ fontSize: '0.75rem', color: '#764ba2' }}>{selectedChildInfo.relationship || 'Child'}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid - Cycle Insights & AI Companion */}
      <div className="row g-4 mb-4">
        {/* Intelligent Cycle Insights */}
        <div className="col-12 col-lg-6">
          {isParentView && selectedChildInfo && (
            <div className="alert border-0 shadow-sm mb-3" style={{ 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              padding: '0.75rem 1rem'
            }}>
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-2 me-2" style={{ background: 'rgba(102, 126, 234, 0.2)' }}>
                  <i className="fas fa-user-circle" style={{ color: '#667eea', fontSize: '1rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <small className="fw-semibold" style={{ color: '#5a2d82' }}>
                    {selectedChildInfo.name}'s Cycle Data
                  </small>
                </div>
              </div>
            </div>
          )}
          <CycleInsights userId={selectedChild} />
        </div>
        
        {/* AI Insights Companion */}
        <div className="col-12 col-lg-6">
          {isParentView && selectedChildInfo && (
            <div className="alert border-0 shadow-sm mb-3" style={{ 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)',
              padding: '0.75rem 1rem'
            }}>
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-2 me-2" style={{ background: 'rgba(103, 58, 183, 0.2)' }}>
                  <i className="fas fa-brain" style={{ color: '#673ab7', fontSize: '1rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <small className="fw-semibold" style={{ color: '#5a2d82' }}>
                    AI Insights for {selectedChildInfo.name}
                  </small>
                </div>
              </div>
            </div>
          )}
          <div className="card border-0 shadow-lg h-100" style={{ 
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Animated Background Pattern */}
            <div className="position-absolute w-100 h-100" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
              backgroundSize: '200% 200%',
              opacity: '0.95'
            }}></div>
            
            {/* Floating Particles Effect */}
            <div className="position-absolute w-100 h-100 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className="position-absolute rounded-circle bg-white"
                  style={{
                    width: `${Math.random() * 4 + 2}px`,
                    height: `${Math.random() * 4 + 2}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: '0.3'
                  }}
                />
              ))}
            </div>

            <div className="card-header border-0 position-relative" style={{ 
              background: 'transparent',
              padding: '1.5rem'
            }}>
              <div className="d-flex align-items-center">
                <div className="position-relative me-3">
                  <div className="rounded-circle p-2" style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <i className="fas fa-robot text-white" style={{ fontSize: '1.3rem' }}></i>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h5 className="text-white mb-1 fw-bold">
                    AI Health Companion
                    <span className="badge ms-2" style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '0.65rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <i className="fas fa-sparkles me-1"></i>Live
                    </span>
                  </h5>
                  <small className="text-white opacity-90">
                    🇷🇼 Kinyarwanda • 🇬🇧 English
                  </small>
                </div>
              </div>
            </div>
            
            <div className="card-body position-relative" style={{ padding: '1rem 1.5rem 1.5rem' }}>
              <div className="bg-white rounded-3 p-3 shadow-sm">
                <AIInsights 
                  selectedChildId={selectedChild} 
                  userType={userType}
                  className="ai-insights-compact"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed Section - Recent Meals & Appointments */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle p-2 me-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <i className="fas fa-clock text-white" style={{ fontSize: '0.9rem' }}></i>
            </div>
            <h4 className="mb-0 fw-bold" style={{ color: '#2d3748' }}>Recent Activity</h4>
            <div className="ms-auto">
              <span className="badge" style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                padding: '6px 12px'
              }}>
                <i className="fas fa-sync-alt me-1"></i>Live Updates
              </span>
            </div>
          </div>
        </div>
        
        {/* Recent Meals */}
        <div className="col-12 col-xl-6">
          {isParentView && selectedChildInfo && (
            <div className="alert border-0 shadow-sm mb-3" style={{ 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              padding: '0.75rem 1rem'
            }}>
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-2 me-2" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                  <i className="fas fa-utensils" style={{ color: '#10b981', fontSize: '1rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <small className="fw-semibold" style={{ color: '#065f46' }}>
                    {selectedChildInfo.name}'s Nutrition
                  </small>
                </div>
              </div>
            </div>
          )}
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
            <div className="card-header border-0 position-relative overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
              borderRadius: '20px 20px 0 0'
            }}>
              <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '4rem' }}>
                <i className="fas fa-utensils"></i>
              </div>
              <h5 className="text-white mb-0 position-relative">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-white bg-opacity-20 p-2 me-2">
                    <i className="fas fa-utensils"></i>
                  </div>
                  <span>{isParentView ? `${selectedChildInfo?.name}'s Meals` : 'Recent Meals'}</span>
                  <span className="badge bg-white text-success ms-2">
                    {recentMeals.length}
                  </span>
                </div>
              </h5>
            </div>
            <div className="card-body p-3">
              {isParentView && (
                <div className="d-flex align-items-center mb-2 text-muted">
                  <i className="fas fa-info-circle me-1" style={{ fontSize: '0.8rem' }}></i>
                  <small>Showing {selectedChildInfo?.name}'s meal data</small>
                </div>
              )}
              {dataErrors.meals && (
                <div className={`alert py-2 mb-3 ${dataErrors.meals.includes('relationship') || dataErrors.meals.includes('Access denied') ? 'alert-danger' : 'alert-warning'}`} style={{ fontSize: '0.85rem' }}>
                  <i className={`fas me-2 ${dataErrors.meals.includes('relationship') || dataErrors.meals.includes('Access denied') ? 'fa-shield-alt' : 'fa-exclamation-triangle'}`}></i>
                  {dataErrors.meals}
                  {!dataErrors.meals.includes('relationship') && !dataErrors.meals.includes('Access denied') && (
                    <button 
                      className="btn btn-sm btn-outline-warning ms-2"
                      onClick={() => onRetryDataLoad('meals')}
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              {dataLoadingStates.meals ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : recentMeals.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-utensils fa-2x mb-3 opacity-50"></i>
                  <p className="mb-0">
                    {isParentView ? `No meals logged for ${selectedChildInfo?.name} yet` : 'No meals logged yet'}
                  </p>
                  <small>
                    {isParentView ? 'Help your child track their nutrition' : 'Start tracking your nutrition'}
                  </small>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {recentMeals.slice(0, 3).map((meal: any, index) => (
                    <div key={meal.id || index} 
                         className="p-3 rounded-3 bg-success bg-opacity-5 border border-success border-opacity-20">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success bg-opacity-20 p-2 me-3">
                          <i className="fas fa-utensils text-success"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 text-success fw-semibold">
                                {meal.meal_type}
                                {isParentView && (
                                  <span className="badge bg-info bg-opacity-20 text-info ms-2" style={{ fontSize: '0.7rem' }}>
                                    <i className="fas fa-user-friends me-1" style={{ fontSize: '0.6rem' }}></i>
                                    {selectedChildInfo?.name}
                                  </span>
                                )}
                              </h6>
                              <p className="small text-muted mb-1">
                                {meal.description || 'Nutritious meal'}
                              </p>
                            </div>
                            <span className="badge bg-success bg-opacity-20 text-success">
                              {isParentView ? 'Logged' : 'Fresh'}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              <i className="fas fa-calendar me-1"></i>
                              {new Date(meal.logged_at || meal.created_at).toLocaleDateString()}
                            </small>
                            {isParentView && (
                              <small className="text-muted">
                                <i className="fas fa-clock me-1"></i>
                                {new Date(meal.meal_time || meal.logged_at || meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Upcoming Appointments */}
        <div className="col-12 col-xl-6">
          {isParentView && selectedChildInfo && (
            <div className="alert border-0 shadow-sm mb-3" style={{ 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '0.75rem 1rem'
            }}>
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-2 me-2" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <i className="fas fa-calendar-check" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <small className="fw-semibold" style={{ color: '#1e40af' }}>
                    {selectedChildInfo.name}'s Appointments
                  </small>
                </div>
              </div>
            </div>
          )}
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
            <div className="card-header border-0 position-relative overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              borderRadius: '20px 20px 0 0'
            }}>
              <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '4rem' }}>
                <i className="fas fa-calendar-check"></i>
              </div>
              <h5 className="text-white mb-0 position-relative">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-white bg-opacity-20 p-2 me-2">
                    <i className="fas fa-stethoscope"></i>
                  </div>
                  <span>{isParentView ? `${selectedChildInfo?.name}'s Healthcare` : 'Healthcare'}</span>
                  <span className="badge bg-white text-primary ms-2">
                    {upcomingAppointments.length}
                  </span>
                </div>
              </h5>
            </div>
            <div className="card-body p-3">
              {isParentView && (
                <div className="d-flex align-items-center mb-2 text-muted">
                  <i className="fas fa-info-circle me-1" style={{ fontSize: '0.8rem' }}></i>
                  <small>Showing {selectedChildInfo?.name}'s appointments</small>
                </div>
              )}
              {dataErrors.appointments && (
                <div className={`alert py-2 mb-3 ${dataErrors.appointments.includes('relationship') || dataErrors.appointments.includes('Access denied') ? 'alert-danger' : 'alert-warning'}`} style={{ fontSize: '0.85rem' }}>
                  <i className={`fas me-2 ${dataErrors.appointments.includes('relationship') || dataErrors.appointments.includes('Access denied') ? 'fa-shield-alt' : 'fa-exclamation-triangle'}`}></i>
                  {dataErrors.appointments}
                  {!dataErrors.appointments.includes('relationship') && !dataErrors.appointments.includes('Access denied') && (
                    <button 
                      className="btn btn-sm btn-outline-warning ms-2"
                      onClick={() => onRetryDataLoad('appointments')}
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              {dataLoadingStates.appointments ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-calendar-plus fa-2x mb-3 opacity-50"></i>
                  <p className="mb-0">
                    {isParentView ? `No appointments scheduled for ${selectedChildInfo?.name}` : 'No appointments scheduled'}
                  </p>
                  <small>
                    {isParentView ? 'Schedule their next health check' : 'Book your next health check'}
                  </small>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {upcomingAppointments.slice(0, 3).map((appointment: any, index) => (
                    <div key={appointment.id || index} 
                         className="p-3 rounded-3 bg-primary bg-opacity-5 border border-primary border-opacity-20">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary bg-opacity-20 p-2 me-3">
                          <i className="fas fa-calendar-check text-primary"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 text-primary fw-semibold">
                                {appointment.title || appointment.issue || 'Health Appointment'}
                                {isParentView && (
                                  <span className="badge bg-info bg-opacity-20 text-info ms-2" style={{ fontSize: '0.7rem' }}>
                                    <i className="fas fa-user-friends me-1" style={{ fontSize: '0.6rem' }}></i>
                                    {selectedChildInfo?.name}
                                  </span>
                                )}
                              </h6>
                              <p className="small text-muted mb-1">
                                {appointment.description || appointment.issue || 'General consultation'}
                              </p>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                              <span className="badge bg-primary bg-opacity-20 text-primary mb-1">
                                {appointment.status || 'Scheduled'}
                              </span>
                              {isParentView && (
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                  <i className="fas fa-user-md me-1"></i>
                                  Child's Appt.
                                </small>
                              )}
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              <i className="fas fa-calendar me-1"></i>
                              {new Date(appointment.appointment_date || appointment.date).toLocaleDateString()}
                            </small>
                            {isParentView && appointment.appointment_date && (
                              <small className="text-muted">
                                <i className="fas fa-clock me-1"></i>
                                {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parent Quick Actions - Enhanced for Parent View */}
      {isParentView && selectedChildInfo && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 shadow-lg position-relative overflow-hidden" style={{ borderRadius: '25px' }}>
              <div className="card-header border-0 position-relative" style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fa709a 100%)',
                backgroundSize: '200% 200%',
                borderRadius: '25px 25px 0 0',
                padding: '1.5rem 2rem'
              }}>
                {/* Decorative elements */}
                <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '6rem' }}>
                  <i className="fas fa-rocket"></i>
                </div>
                <div className="position-relative">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3" style={{
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <i className="fas fa-bolt text-white" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                      <h4 className="text-white mb-1 fw-bold">Quick Actions</h4>
                      <p className="text-white opacity-90 mb-0" style={{ fontSize: '0.9rem' }}>
                        Manage {selectedChildInfo.name}'s health with one click
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-4" style={{ background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)' }}>
                <div className="row g-4">
                  <div className="col-md-3 col-sm-6">
                    <button 
                      className="btn w-100 border-0 shadow-sm position-relative overflow-hidden"
                      onClick={() => setActiveTab('meals')}
                      style={{ 
                        height: '140px',
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        borderRadius: '20px'
                      }}
                    >
                      <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '4rem' }}>
                        <i className="fas fa-utensils"></i>
                      </div>
                      <div className="text-white position-relative d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="rounded-circle bg-white bg-opacity-20 p-3 mb-2" style={{
                          backdropFilter: 'blur(10px)'
                        }}>
                          <i className="fas fa-plus-circle" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.1rem' }}>Add Meal</div>
                        <small className="opacity-90" style={{ fontSize: '0.75rem' }}>Track nutrition</small>
                      </div>
                    </button>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <button 
                      className="btn w-100 border-0 shadow-sm position-relative overflow-hidden"
                      onClick={() => setActiveTab('appointments')}
                      style={{ 
                        height: '140px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '20px'
                      }}
                    >
                      <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '4rem' }}>
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                      <div className="text-white position-relative d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="rounded-circle bg-white bg-opacity-20 p-3 mb-2" style={{
                          backdropFilter: 'blur(10px)'
                        }}>
                          <i className="fas fa-calendar-plus" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.1rem' }}>Book Appointment</div>
                        <small className="opacity-90" style={{ fontSize: '0.75rem' }}>Schedule visit</small>
                      </div>
                    </button>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <button 
                      className="btn w-100 border-0 shadow-sm position-relative overflow-hidden"
                      onClick={() => setActiveTab('cycle')}
                      style={{ 
                        height: '140px',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        borderRadius: '20px'
                      }}
                    >
                      <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '4rem' }}>
                        <i className="fas fa-heart"></i>
                      </div>
                      <div className="text-white position-relative d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="rounded-circle bg-white bg-opacity-20 p-3 mb-2" style={{
                          backdropFilter: 'blur(10px)'
                        }}>
                          <i className="fas fa-heart-pulse" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.1rem' }}>Track Cycle</div>
                        <small className="opacity-90" style={{ fontSize: '0.75rem' }}>Monitor health</small>
                      </div>
                    </button>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <button 
                      className="btn w-100 border-0 shadow-sm position-relative overflow-hidden"
                      onClick={() => setActiveTab('children')}
                      style={{ 
                        height: '140px',
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        borderRadius: '20px'
                      }}
                    >
                      <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '4rem' }}>
                        <i className="fas fa-user-cog"></i>
                      </div>
                      <div className="text-dark position-relative d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="rounded-circle bg-white bg-opacity-50 p-3 mb-2" style={{
                          backdropFilter: 'blur(10px)'
                        }}>
                          <i className="fas fa-cog" style={{ fontSize: '2rem', color: '#667eea' }}></i>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#667eea' }}>Manage Profile</div>
                        <small style={{ fontSize: '0.75rem', color: '#764ba2' }}>Settings & info</small>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-3 position-relative overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                  border: '2px solid rgba(102, 126, 234, 0.1)'
                }}>
                  <div className="d-flex align-items-start">
                    <div className="rounded-circle bg-info bg-opacity-20 p-2 me-3 flex-shrink-0" style={{
                      backdropFilter: 'blur(10px)'
                    }}>
                      <i className="fas fa-shield-alt text-info" style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold" style={{ color: '#667eea' }}>Parent Control Active</h6>
                      <small className="text-muted">
                        You are managing <strong>{selectedChildInfo.name}'s</strong> health data. 
                        All actions will be securely recorded under their account with full privacy protection.
                      </small>
                    </div>
                    <div className="badge" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '8px 12px'
                    }}>
                      <i className="fas fa-check-circle me-1"></i>Verified Parent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;