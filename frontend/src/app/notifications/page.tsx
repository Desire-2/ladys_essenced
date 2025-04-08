'use client';

import { useState, useEffect } from 'react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: 'Your next period is expected in 8 days',
      date: '2025-04-07',
      read: false,
      type: 'cycle'
    },
    {
      id: 2,
      message: 'Remember to log your meals today',
      date: '2025-04-07',
      read: false,
      type: 'nutrition'
    },
    {
      id: 3,
      message: 'New article: "Nutrition during menstruation"',
      date: '2025-04-06',
      read: true,
      type: 'education'
    },
    {
      id: 4,
      message: 'Your appointment has been confirmed for April 10th',
      date: '2025-04-05',
      read: true,
      type: 'appointment'
    },
    {
      id: 5,
      message: 'Your feedback has received a response',
      date: '2025-04-03',
      read: true,
      type: 'feedback'
    }
  ]);
  
  const [filter, setFilter] = useState('all');
  
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(notification => notification.type === filter);
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Notifications</h1>
        <div>
          <button className="btn btn-secondary me-2" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="card">
            <div className="card-header">
              <h3>Filter</h3>
            </div>
            <div className="card-body">
              <div className="list-group">
                <button 
                  className={`list-group-item list-group-item-action ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All Notifications
                  <span className="badge bg-primary rounded-pill float-end">{notifications.length}</span>
                </button>
                <button 
                  className={`list-group-item list-group-item-action ${filter === 'cycle' ? 'active' : ''}`}
                  onClick={() => setFilter('cycle')}
                >
                  Cycle Tracking
                </button>
                <button 
                  className={`list-group-item list-group-item-action ${filter === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setFilter('nutrition')}
                >
                  Nutrition
                </button>
                <button 
                  className={`list-group-item list-group-item-action ${filter === 'appointment' ? 'active' : ''}`}
                  onClick={() => setFilter('appointment')}
                >
                  Appointments
                </button>
                <button 
                  className={`list-group-item list-group-item-action ${filter === 'education' ? 'active' : ''}`}
                  onClick={() => setFilter('education')}
                >
                  Educational Content
                </button>
                <button 
                  className={`list-group-item list-group-item-action ${filter === 'feedback' ? 'active' : ''}`}
                  onClick={() => setFilter('feedback')}
                >
                  Feedback Responses
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-9">
          <div className="card">
            <div className="card-header">
              <h3>
                {filter === 'all' ? 'All Notifications' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{unreadCount} unread</span>
                )}
              </h3>
            </div>
            <div className="card-body">
              {filteredNotifications.length > 0 ? (
                <div className="list-group">
                  {filteredNotifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`list-group-item list-group-item-action ${!notification.read ? 'list-group-item-primary' : ''}`}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">
                          {!notification.read && (
                            <span className="badge bg-primary me-2">New</span>
                          )}
                          {notification.message}
                        </h5>
                        <small className="text-muted">{notification.date}</small>
                      </div>
                      <div className="d-flex mt-3">
                        {!notification.read && (
                          <button 
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No notifications found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3>Notification Settings</h3>
            </div>
            <div className="card-body">
              <form>
                <h4>Receive Notifications For:</h4>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="cyclePredictions" defaultChecked />
                  <label className="form-check-label" htmlFor="cyclePredictions">
                    Cycle Predictions and Reminders
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="nutritionReminders" defaultChecked />
                  <label className="form-check-label" htmlFor="nutritionReminders">
                    Nutrition and Meal Logging Reminders
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="appointmentReminders" defaultChecked />
                  <label className="form-check-label" htmlFor="appointmentReminders">
                    Appointment Reminders
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="educationalContent" defaultChecked />
                  <label className="form-check-label" htmlFor="educationalContent">
                    New Educational Content
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="feedbackResponses" defaultChecked />
                  <label className="form-check-label" htmlFor="feedbackResponses">
                    Feedback Responses
                  </label>
                </div>
                
                <h4 className="mt-4">Notification Method:</h4>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="inAppNotifications" defaultChecked />
                  <label className="form-check-label" htmlFor="inAppNotifications">
                    In-App Notifications
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="smsNotifications" defaultChecked />
                  <label className="form-check-label" htmlFor="smsNotifications">
                    SMS Notifications
                  </label>
                </div>
                
                <button type="submit" className="btn btn-primary mt-3">Save Settings</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
