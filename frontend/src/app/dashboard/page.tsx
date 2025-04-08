'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for dashboard
  const upcomingPeriod = '2025-04-15';
  const lastPeriod = '2025-03-18';
  const cycleLength = 28;
  const recentMeals = [
    { id: 1, date: '2025-04-06', details: 'Breakfast: Oatmeal with fruits and nuts' },
    { id: 2, date: '2025-04-06', details: 'Lunch: Grilled chicken salad with avocado' },
    { id: 3, date: '2025-04-05', details: 'Dinner: Salmon with steamed vegetables' }
  ];
  const upcomingAppointments = [
    { id: 1, date: '2025-04-10', issue: 'Regular checkup', status: 'Confirmed' }
  ];
  const notifications = [
    { id: 1, message: 'Your next period is expected in 8 days', date: '2025-04-07' },
    { id: 2, message: 'Remember to log your meals today', date: '2025-04-07' },
    { id: 3, message: 'New article: "Nutrition during menstruation"', date: '2025-04-06' }
  ];
  
  return (
    <div className="container py-4">
      <h1 className="mb-4">Dashboard</h1>
      
      {/* Dashboard Navigation */}
      <div className="card mb-4">
        <div className="card-body">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                href="#" 
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'cycle' ? 'active' : ''}`} 
                href="#" 
                onClick={() => setActiveTab('cycle')}
              >
                Cycle Tracking
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'meals' ? 'active' : ''}`} 
                href="#" 
                onClick={() => setActiveTab('meals')}
              >
                Meal Logs
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} 
                href="#" 
                onClick={() => setActiveTab('appointments')}
              >
                Appointments
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div className="row">
            {/* Cycle Summary */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h3>Cycle Summary</h3>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <strong>Next Period:</strong>
                    </div>
                    <div>{upcomingPeriod}</div>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <strong>Last Period:</strong>
                    </div>
                    <div>{lastPeriod}</div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>Average Cycle Length:</strong>
                    </div>
                    <div>{cycleLength} days</div>
                  </div>
                  <div className="mt-4">
                    <a href="/cycle-tracking" className="btn btn-secondary">Track Cycle</a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notifications */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h3>Notifications</h3>
                </div>
                <div className="card-body">
                  {notifications.length > 0 ? (
                    <ul className="list-group">
                      {notifications.map(notification => (
                        <li key={notification.id} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <div>{notification.message}</div>
                            <small className="text-muted">{notification.date}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No new notifications</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            {/* Recent Meals */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h3>Recent Meals</h3>
                </div>
                <div className="card-body">
                  {recentMeals.length > 0 ? (
                    <ul className="list-group">
                      {recentMeals.map(meal => (
                        <li key={meal.id} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <div>{meal.details}</div>
                            <small className="text-muted">{meal.date}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No meal logs yet</p>
                  )}
                  <div className="mt-4">
                    <a href="/meal-logging" className="btn btn-secondary">Log Meal</a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upcoming Appointments */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h3>Upcoming Appointments</h3>
                </div>
                <div className="card-body">
                  {upcomingAppointments.length > 0 ? (
                    <ul className="list-group">
                      {upcomingAppointments.map(appointment => (
                        <li key={appointment.id} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{appointment.date}</strong>: {appointment.issue}
                            </div>
                            <span className="badge bg-success">{appointment.status}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No upcoming appointments</p>
                  )}
                  <div className="mt-4">
                    <a href="/appointments" className="btn btn-secondary">Schedule Appointment</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cycle Tracking Tab Content */}
      {activeTab === 'cycle' && (
        <div className="card">
          <div className="card-header">
            <h3>Cycle Tracking</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <div id="calendar-container" className="mb-4">
                  {/* Calendar would be initialized here with JavaScript */}
                  <div className="text-center p-5 bg-light">
                    <p>Calendar visualization would appear here</p>
                    <p>Using the CycleCalendar class from main.js</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h4>Log New Period</h4>
                  </div>
                  <div className="card-body">
                    <form>
                      <div className="form-group mb-3">
                        <label htmlFor="startDate" className="form-label">Start Date</label>
                        <input type="date" className="form-control" id="startDate" />
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="notes" className="form-label">Notes</label>
                        <textarea className="form-control" id="notes" rows={3}></textarea>
                      </div>
                      <button type="submit" className="btn btn-primary">Save</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Meal Logs Tab Content */}
      {activeTab === 'meals' && (
        <div className="card">
          <div className="card-header">
            <h3>Meal Logging</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="card mb-4">
                  <div className="card-header">
                    <h4>Add New Meal</h4>
                  </div>
                  <div className="card-body">
                    <form>
                      <div className="form-group mb-3">
                        <label htmlFor="mealType" className="form-label">Meal Type</label>
                        <select className="form-control" id="mealType">
                          <option>Breakfast</option>
                          <option>Lunch</option>
                          <option>Dinner</option>
                          <option>Snack</option>
                        </select>
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="mealDate" className="form-label">Date & Time</label>
                        <input type="datetime-local" className="form-control" id="mealDate" />
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="mealDetails" className="form-label">Meal Details</label>
                        <textarea className="form-control" id="mealDetails" rows={3}></textarea>
                      </div>
                      <button type="submit" className="btn btn-primary">Save Meal</button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h4>Nutrition Recommendations</h4>
                  </div>
                  <div className="card-body">
                    <p>Based on your cycle data, consider including these nutrients in your diet:</p>
                    <ul>
                      <li><strong>Iron-rich foods</strong>: Red meat, spinach, beans</li>
                      <li><strong>Calcium</strong>: Dairy products, fortified plant milks</li>
                      <li><strong>Magnesium</strong>: Nuts, seeds, whole grains</li>
                      <li><strong>Omega-3 fatty acids</strong>: Fatty fish, flaxseeds</li>
                    </ul>
                    <p>Stay hydrated and limit caffeine and alcohol intake during your period.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Appointments Tab Content */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <h3>Appointment Scheduling</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="card mb-4">
                  <div className="card-header">
                    <h4>Request Appointment</h4>
                  </div>
                  <div className="card-body">
                    <form>
                      <div className="form-group mb-3">
                        <label htmlFor="appointmentFor" className="form-label">For</label>
                        <select className="form-control" id="appointmentFor">
                          <option>Self</option>
                          <option>Child (Sarah)</option>
                          <option>Child (Emma)</option>
                        </select>
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="issue" className="form-label">Issue</label>
                        <textarea className="form-control" id="issue" rows={3}></textarea>
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="preferredDate" className="form-label">Preferred Date</label>
                        <input type="date" className="form-control" id="preferredDate" />
                      </div>
                      <button type="submit" className="btn btn-primary">Request Appointment</button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h4>Upcoming Appointments</h4>
                  </div>
                  <div className="card-body">
                    {upcomingAppointments.length > 0 ? (
                      <ul className="list-group">
                        {upcomingAppointments.map(appointment => (
                          <li key={appointment.id} className="list-group-item">
                            <div className="d-flex justify-content-between">
                              <div>
                                <strong>{appointment.date}</strong>: {appointment.issue}
                              </div>
                              <span className="badge bg-success">{appointment.status}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No upcoming appointments</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
