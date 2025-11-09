import React from 'react';
import { Child, MealLog, Appointment, Notification, ActiveTab } from '../../types';
import { DataSection } from '../ui/DataSection';
import { EmptyState } from '../ui/EmptyState';
import { formatDate, getMealTypeBadgeClass, getAppointmentStatusBadgeClass } from '../../utils';
import CycleInsights from '../../../../components/CycleInsights';

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
  setActiveTab
}) => {
  return (
    <div>
      <div className="row g-3 g-md-4">
        {/* Intelligent Cycle Insights - Enhanced */}
        <div className="col-12 col-lg-8 mb-3 mb-md-4">
          {selectedChild && (
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Viewing intelligent cycle insights for: <strong>{children.find(c => c.user_id === selectedChild)?.name}</strong>
            </div>
          )}
          <CycleInsights userId={selectedChild} />
        </div>
        
        {/* Quick Actions - Compact */}
        <div className="col-12 col-lg-4 mb-3 mb-md-4">
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h6>
            </div>
            <div className="card-body">
              <button 
                className="btn btn-primary w-100 mb-3"
                onClick={() => setActiveTab('cycle')}
              >
                <i className="fas fa-plus-circle me-2"></i>
                Log Cycle
              </button>
              <button 
                className="btn btn-outline-success w-100 mb-3"
                onClick={() => setActiveTab('meals')}
              >
                <i className="fas fa-utensils me-2"></i>
                Log Meal
              </button>
              <button 
                className="btn btn-outline-info w-100"
                onClick={() => setActiveTab('appointments')}
              >
                <i className="fas fa-calendar-check me-2"></i>
                Book Appointment
              </button>
            </div>
          </div>
        </div>
        
        {/* Notifications - Responsive */}
        <div className="col-12 col-lg-6 mb-3 mb-md-4">
          <DataSection
            title="Notifications"
            dataType="notifications"
            icon="fas fa-bell"
            isLoading={dataLoadingStates.notifications}
            error={dataErrors.notifications}
            hasData={dataAvailability.notifications}
            onRetry={() => onRetryDataLoad('notifications')}
          >
            {dataAvailability.notifications ? (
              notifications.length > 0 ? (
                <>
                  <ul className="list-group list-group-flush">
                    {notifications.slice(0, 5).map(notification => (
                      <li key={notification.id} className={`list-group-item px-0 py-2 ${!notification.is_read ? 'bg-light border-start border-primary border-3' : ''}`}>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-1">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              {!notification.is_read && <span className="badge bg-primary me-2 small">New</span>}
                              <span className={`${!notification.is_read ? 'fw-bold' : ''} small`}>{notification.message}</span>
                            </div>
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(notification.date)}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {notifications.length > 5 && (
                    <div className="mt-2 mt-md-3 text-center">
                      <a href="/notifications" className="btn btn-sm btn-outline-primary w-100 w-md-auto">
                        View All {notifications.length} Notifications
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon="fas fa-bell-slash"
                  title="No Notifications"
                  description="You're all caught up! No new notifications to display."
                />
              )
            ) : (
              <EmptyState
                icon="fas fa-exclamation-triangle"
                title="Notifications Unavailable"
                description="Unable to load your notifications at this time."
              />
            )}
          </DataSection>
        </div>
      </div>
      
      <div className="row g-3 g-md-4">
        {/* Recent Meals - Responsive */}
        <div className="col-12 col-lg-6 mb-3 mb-md-4">
          <DataSection
            title="Recent Meals"
            dataType="meals"
            icon="fas fa-utensils"
            isLoading={dataLoadingStates.meals}
            error={dataErrors.meals}
            hasData={dataAvailability.meals}
            onRetry={() => onRetryDataLoad('meals')}
          >
            {selectedChild && (
              <small className="text-muted d-block mb-2 mb-md-3">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
            )}
            {dataAvailability.meals ? (
              recentMeals.length > 0 ? (
                <>
                  <ul className="list-group list-group-flush">
                    {recentMeals.map(meal => (
                      <li key={meal.id} className="list-group-item px-0 py-2">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-1">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <span className={`badge me-2 small ${getMealTypeBadgeClass(meal.meal_type)}`}>
                                {meal.meal_type}
                              </span>
                              <strong className="text-capitalize small">{meal.meal_type}</strong>
                            </div>
                            <p className="mb-0 text-muted small">{meal.description || meal.details}</p>
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(meal.meal_time || meal.date)}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 mt-md-4">
                    <button 
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => setActiveTab('meals')}
                    >
                      <i className="fas fa-plus-circle me-2"></i>
                      Log New Meal
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="fas fa-utensils"
                  title="No Meal Logs"
                  description="Start logging your meals to track your nutrition and eating patterns."
                  actionText="Log First Meal"
                  onAction={() => setActiveTab('meals')}
                />
              )
            ) : (
              <EmptyState
                icon="fas fa-exclamation-triangle"
                title="Meals Unavailable"
                description="Unable to load your meal logs at this time."
              />
            )}
          </DataSection>
        </div>
        
        {/* Upcoming Appointments - Responsive */}
        <div className="col-12 col-lg-6 mb-3 mb-md-4">
          <DataSection
            title="Upcoming Appointments"
            dataType="appointments"
            icon="fas fa-calendar-check"
            isLoading={dataLoadingStates.appointments}
            error={dataErrors.appointments}
            hasData={dataAvailability.appointments}
            onRetry={() => onRetryDataLoad('appointments')}
          >
            {dataAvailability.appointments ? (
              upcomingAppointments.length > 0 ? (
                <>
                  <ul className="list-group list-group-flush">
                    {upcomingAppointments.map(appointment => (
                      <li key={appointment.id} className="list-group-item px-0 py-2">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-calendar text-primary me-2"></i>
                              <strong className="small">{formatDate(appointment.appointment_date || appointment.date)}</strong>
                            </div>
                            <p className="mb-1 small">{appointment.issue}</p>
                            {appointment.for_user && (
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-user me-1"></i>
                                For: {appointment.for_user}
                              </small>
                            )}
                          </div>
                          <span className={`badge align-self-md-start ${getAppointmentStatusBadgeClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 mt-md-4">
                    <button 
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => setActiveTab('appointments')}
                    >
                      <i className="fas fa-plus-circle me-2"></i>
                      Schedule Appointment
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="fas fa-calendar-plus"
                  title="No Upcoming Appointments"
                  description="Schedule your first appointment with a healthcare provider."
                  actionText="Book Appointment"
                  onAction={() => setActiveTab('appointments')}
                />
              )
            ) : (
              <EmptyState
                icon="fas fa-exclamation-triangle"
                title="Appointments Unavailable"
                description="Unable to load your appointments at this time."
              />
            )}
          </DataSection>
        </div>
      </div>
    </div>
  );
};