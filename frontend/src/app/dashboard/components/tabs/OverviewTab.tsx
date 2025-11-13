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
  // Helper to get selected child info
  const selectedChildInfo = selectedChild ? children.find(c => c.user_id === selectedChild) : null;
  const isParentView = userType === 'parent' && selectedChild;
  
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
                    {isParentView ? `${selectedChildInfo?.name}'s Health Overview` : 'Your Health Overview'}
                  </h3>
                  <p className="mb-0 opacity-90">
                    {isParentView 
                      ? `Managing health insights for ${selectedChildInfo?.name}`
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

      {/* Child Data Summary - Only for Parent View */}
      {isParentView && selectedChildInfo && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="mb-3 text-primary">
                      <i className="fas fa-chart-bar me-2"></i>
                      Data Summary for {selectedChildInfo.name}
                    </h5>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
                          <i className="fas fa-utensils text-success fa-2x mb-2"></i>
                          <h6 className="mb-1 text-success">{recentMeals.length}</h6>
                          <small className="text-muted">Recent Meals</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center p-3 bg-primary bg-opacity-10 rounded-3">
                          <i className="fas fa-calendar-check text-primary fa-2x mb-2"></i>
                          <h6 className="mb-1 text-primary">{upcomingAppointments.length}</h6>
                          <small className="text-muted">Appointments</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center p-3 bg-info bg-opacity-10 rounded-3">
                          <i className="fas fa-heart text-info fa-2x mb-2"></i>
                          <h6 className="mb-1 text-info">Active</h6>
                          <small className="text-muted">Health Status</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="bg-light rounded-3 p-3">
                      <div className="mb-2">
                        <i className="fas fa-user-circle text-primary" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <h6 className="mb-1">{selectedChildInfo.name}</h6>
                      <small className="text-muted">
                        {selectedChildInfo.relationship || 'Child'}
                        {selectedChildInfo.date_of_birth && (
                          <span className="d-block mt-1">
                            Age: {Math.floor((Date.now() - new Date(selectedChildInfo.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Intelligent Cycle Insights - Enhanced */}
        <div className="col-12 col-xl-6 mb-4">
          {isParentView && selectedChildInfo && (
            <div className="alert alert-info border-0 shadow-sm mb-4" style={{ 
              borderRadius: '15px',
              background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              color: 'white'
            }}>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                    <i className="fas fa-user-friends"></i>
                  </div>
                  <div>
                    <strong>{selectedChildInfo.name}'s Profile</strong>
                    <div className="small opacity-90">
                      Relationship: {selectedChildInfo.relationship || 'Child'}
                      {selectedChildInfo.date_of_birth && (
                        <> • Born: {new Date(selectedChildInfo.date_of_birth).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="small opacity-75">Data Source</div>
                  <div className="badge bg-white bg-opacity-20">
                    <i className="fas fa-database me-1"></i>
                    Child Account
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
                        {isParentView ? `AI Insights for ${selectedChildInfo?.name}` : 'AI Health Companion'}
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
                        {isParentView 
                          ? `Personalized health insights for your child in Kinyarwanda & English`
                          : 'Get personalized health insights in Kinyarwanda & English'
                        }
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

      {/* Parent Quick Actions - Only for Parent View */}
      {isParentView && selectedChildInfo && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <div className="card-header border-0" style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '20px 20px 0 0'
              }}>
                <h5 className="text-white mb-0">
                  <i className="fas fa-tools me-2"></i>
                  Quick Actions for {selectedChildInfo.name}
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center"
                      onClick={() => setActiveTab('meals')}
                      style={{ height: '60px' }}
                    >
                      <div className="text-center">
                        <i className="fas fa-plus-circle fa-lg mb-1"></i>
                        <div className="small">Add Meal</div>
                      </div>
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                      onClick={() => setActiveTab('appointments')}
                      style={{ height: '60px' }}
                    >
                      <div className="text-center">
                        <i className="fas fa-calendar-plus fa-lg mb-1"></i>
                        <div className="small">Book Appointment</div>
                      </div>
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-info w-100 d-flex align-items-center justify-content-center"
                      onClick={() => setActiveTab('cycle')}
                      style={{ height: '60px' }}
                    >
                      <div className="text-center">
                        <i className="fas fa-heart fa-lg mb-1"></i>
                        <div className="small">Track Cycle</div>
                      </div>
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                      onClick={() => setActiveTab('children')}
                      style={{ height: '60px' }}
                    >
                      <div className="text-center">
                        <i className="fas fa-user-cog fa-lg mb-1"></i>
                        <div className="small">Manage Child</div>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-info-circle text-info me-2"></i>
                    <small className="text-muted">
                      You are managing {selectedChildInfo.name}'s health data. All actions will be recorded under their account.
                    </small>
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