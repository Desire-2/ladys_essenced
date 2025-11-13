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

export const OverviewTab: React.FC<OverviewTabProps> = ({
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
  return (
    <div className="overview-tab">
      {/* Welcome Header with Gradient */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px'
          }}>
            <div className="card-body text-white p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h3 className="mb-2 fw-bold">
                    <i className="fas fa-heart me-3" style={{ color: '#ff6b8a' }}></i>
                    Your Health Overview
                  </h3>
                  <p className="mb-0 opacity-90">
                    {selectedChild 
                      ? `Managing health insights for ${children.find(c => c.user_id === selectedChild)?.name}`
                      : 'Track your wellness journey with personalized insights'
                    }
                  </p>
                </div>
                <div className="col-md-4 text-end d-none d-md-block">
                  <div className="position-relative">
                    <i className="fas fa-chart-line" style={{ 
                      fontSize: '4rem', 
                      opacity: '0.3',
                      color: '#fff'
                    }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Intelligent Cycle Insights - Enhanced */}
        <div className="col-12 col-xl-6 mb-4">
          {selectedChild && (
            <div className="alert alert-info border-0 shadow-sm mb-4" style={{ 
              borderRadius: '15px',
              background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              color: 'white'
            }}>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                  <i className="fas fa-user-friends"></i>
                </div>
                <div>
                  <strong>Child Profile Active</strong>
                  <div className="small opacity-90">
                    Viewing data for {children.find(c => c.user_id === selectedChild)?.name}
                  </div>
                </div>
              </div>
            </div>
          )}
          <CycleInsights userId={selectedChild} />
        </div>
        
        {/* Recent Activities - Right Side */}
        <div className="col-12 col-xl-6 mb-4">
          <div className="row g-4 h-100">
            {/* Recent Meals - Enhanced */}
            <div className="col-12">
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
                      <span>Recent Meals</span>
                      <span className="badge bg-white text-success ms-2">
                        {recentMeals.length}
                      </span>
                    </div>
                  </h5>
                </div>
                <div className="card-body p-3">
                  {dataLoadingStates.meals ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : recentMeals.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="fas fa-utensils fa-2x mb-3 opacity-50"></i>
                      <p className="mb-0">No meals logged yet</p>
                      <small>Start tracking your nutrition</small>
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {recentMeals.slice(0, 3).map((meal: any, index) => (
                        <div key={meal.id} 
                             className="p-3 rounded-3 bg-success bg-opacity-5 border border-success border-opacity-20"
                             style={{ transition: 'all 0.3s ease' }}>
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-success bg-opacity-20 p-2 me-3">
                              <i className="fas fa-utensils text-success"></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-1 text-success fw-semibold">
                                    {meal.meal_type}
                                  </h6>
                                  <p className="small text-muted mb-1">
                                    {meal.description || 'Nutritious meal'}
                                  </p>
                                </div>
                                <span className="badge bg-success bg-opacity-20 text-success">
                                  Fresh
                                </span>
                              </div>
                              <small className="text-muted">
                                <i className="fas fa-calendar me-1"></i>
                                {new Date(meal.logged_at || meal.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Appointments - Enhanced */}
            <div className="col-12">
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
                      <span>Healthcare</span>
                      <span className="badge bg-white text-primary ms-2">
                        {upcomingAppointments.length}
                      </span>
                    </div>
                  </h5>
                </div>
                <div className="card-body p-3">
                  {dataLoadingStates.appointments ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="fas fa-calendar-plus fa-2x mb-3 opacity-50"></i>
                      <p className="mb-0">No appointments scheduled</p>
                      <small>Book your next health check</small>
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {upcomingAppointments.slice(0, 3).map((appointment: any, index) => (
                        <div key={appointment.id} 
                             className="p-3 rounded-3 bg-primary bg-opacity-5 border border-primary border-opacity-20"
                             style={{ transition: 'all 0.3s ease' }}>
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary bg-opacity-20 p-2 me-3">
                              <i className="fas fa-calendar-check text-primary"></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-1 text-primary fw-semibold">
                                    {appointment.title || appointment.issue || 'Health Appointment'}
                                  </h6>
                                  <p className="small text-muted mb-1">
                                    {appointment.description || appointment.issue || 'General consultation'}
                                  </p>
                                </div>
                                <span className="badge bg-primary bg-opacity-20 text-primary">
                                  Scheduled
                                </span>
                              </div>
                              <small className="text-muted">
                                <i className="fas fa-clock me-1"></i>
                                {new Date(appointment.appointment_date || appointment.date).toLocaleDateString()}
                              </small>
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
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="col-12 mb-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
            <div className="card-header border-0 text-white position-relative overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
              borderRadius: '20px 20px 0 0'
            }}>
              <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '5rem' }}>
                <i className="fas fa-bolt"></i>
              </div>
              <h5 className="mb-0 position-relative">
                <i className="fas fa-rocket me-2"></i>
                Quick Actions
              </h5>
              <small className="opacity-90">Start tracking in seconds</small>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-3">
                <button 
                  className="btn btn-lg shadow-sm position-relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setActiveTab('cycle')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(232, 67, 147, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <span className="fw-semibold">Track Cycle</span>
                  </div>
                </button>
                
                <button 
                  className="btn btn-lg shadow-sm position-relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setActiveTab('meals')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 184, 148, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                      <i className="fas fa-utensils"></i>
                    </div>
                    <span className="fw-semibold">Log Nutrition</span>
                  </div>
                </button>
                
                <button 
                  className="btn btn-lg shadow-sm position-relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setActiveTab('appointments')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(116, 185, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                      <i className="fas fa-stethoscope"></i>
                    </div>
                    <span className="fw-semibold">Book Care</span>
                  </div>
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-4 pt-3 border-top">
                <div className="row text-center">
                  <div className="col-4">
                    <div className="p-2">
                      <div className="text-primary fw-bold h5 mb-1">
                        {recentMeals.length}
                      </div>
                      <small className="text-muted">Meals Logged</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2">
                      <div className="text-success fw-bold h5 mb-1">
                        {upcomingAppointments.length}
                      </div>
                      <small className="text-muted">Appointments</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2">
                      <div className="text-warning fw-bold h5 mb-1">
                        {notifications.filter(n => !n.is_read).length}
                      </div>
                      <small className="text-muted">New Alerts</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* AI Insights Section - Enhanced */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 shadow-lg ai-insights-card" style={{ 
            borderRadius: '25px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Animated Background Pattern */}
            <div className="position-absolute w-100 h-100" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 10s ease infinite',
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
                    opacity: '0.3',
                    animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite alternate`
                  }}
                />
              ))}
            </div>

            <div className="card-header border-0 position-relative" style={{ 
              background: 'transparent',
              padding: '2rem 2rem 1rem'
            }}>
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center mb-2">
                    <div className="position-relative me-3">
                      <div className="rounded-circle p-3" style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <i className="fas fa-brain text-white" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle" style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}></div>
                    </div>
                    <div>
                      <h4 className="text-white mb-1 fw-bold">
                        AI Health Companion
                        <span className="badge ms-2" style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontSize: '0.7rem',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <i className="fas fa-sparkles me-1"></i>
                          Powered by AI
                        </span>
                      </h4>
                      <p className="text-white opacity-90 mb-0">
                        Get personalized health insights in Kinyarwanda & English
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end d-none d-md-block">
                  <div className="d-flex justify-content-end align-items-center">
                    <div className="me-3 text-center">
                      <div className="text-white opacity-75 small">Supported Languages</div>
                      <div className="d-flex gap-2 mt-1">
                        <span className="badge" style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}>🇷🇼 Kinyarwanda</span>
                        <span className="badge" style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}>🇬🇧 English</span>
                      </div>
                    </div>
                    <div className="position-relative">
                      <i className="fas fa-robot text-white" style={{ 
                        fontSize: '3rem', 
                        opacity: '0.4',
                        animation: 'bounce 2s ease-in-out infinite'
                      }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-body position-relative" style={{ padding: '1rem 2rem 2rem' }}>
              <div className="bg-white rounded-4 p-4 shadow-sm" style={{
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <AIInsights 
                  selectedChildId={selectedChild} 
                  userType={userType}
                  className="ai-insights-enhanced"
                />
              </div>
              
              {/* Feature highlights */}
              <div className="row mt-3 text-white">
                <div className="col-md-4 text-center">
                  <div className="p-2">
                    <i className="fas fa-language mb-2" style={{ fontSize: '1.2rem', opacity: '0.8' }}></i>
                    <div className="small opacity-90">Bilingual Support</div>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="p-2">
                    <i className="fas fa-chart-line mb-2" style={{ fontSize: '1.2rem', opacity: '0.8' }}></i>
                    <div className="small opacity-90">Data-Driven Insights</div>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="p-2">
                    <i className="fas fa-shield-alt mb-2" style={{ fontSize: '1.2rem', opacity: '0.8' }}></i>
                    <div className="small opacity-90">Privacy Protected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};