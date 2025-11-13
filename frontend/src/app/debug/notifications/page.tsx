'use client';

import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function NotificationDebugPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications
  } = useNotification();
  
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setDebugInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      user: user,
      userType: user?.user_type,
      timestamp: new Date().toISOString()
    });
  }, [user]);
  
  const handleManualRefresh = async () => {
    console.log('Manual refresh triggered');
    await fetchNotifications();
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1>🔍 Notification Debug Page</h1>
          <p className="text-muted">Debug information for notification system</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>🔐 Authentication Status</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <strong>Has Token:</strong>
                  <span className={debugInfo.hasToken ? 'text-success' : 'text-danger'}>
                    {debugInfo.hasToken ? 'Yes' : 'No'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>Token Length:</strong>
                  <span>{debugInfo.tokenLength}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>User Loaded:</strong>
                  <span className={debugInfo.user ? 'text-success' : 'text-danger'}>
                    {debugInfo.user ? 'Yes' : 'No'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>User Type:</strong>
                  <span>{debugInfo.userType || 'N/A'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>User Name:</strong>
                  <span>{debugInfo.user?.name || 'N/A'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>📬 Notification Status</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <strong>Loading:</strong>
                  <span className={loading ? 'text-warning' : 'text-success'}>
                    {loading ? 'Yes' : 'No'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>Total Notifications:</strong>
                  <span className="badge bg-primary">{notifications.length}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>Unread Count:</strong>
                  <span className="badge bg-danger">{unreadCount}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <strong>Last Fetch:</strong>
                  <span className="small">
                    Never tracked
                  </span>
                </li>
              </ul>
              
              <div className="mt-3">
                <button 
                  className="btn btn-primary w-100" 
                  onClick={handleManualRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt me-2"></i>
                      Manual Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {notifications.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>📋 Notification List</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Priority</th>
                        <th>Read</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map((notification: any) => (
                        <tr key={notification.id}>
                          <td>{notification.id}</td>
                          <td>{notification.title}</td>
                          <td>
                            <span className="badge bg-info">{notification.type}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              notification.priority === 'urgent' ? 'bg-danger' :
                              notification.priority === 'high' ? 'bg-warning' :
                              notification.priority === 'normal' ? 'bg-primary' : 'bg-secondary'
                            }`}>
                              {notification.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${notification.isRead ? 'bg-success' : 'bg-warning'}`}>
                              {notification.isRead ? 'Read' : 'Unread'}
                            </span>
                          </td>
                          <td className="small">
                            {new Date(notification.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>🛠️ Debug Information</h5>
            </div>
            <div className="card-body">
              <pre className="small bg-light p-3 rounded">
                {JSON.stringify({
                  debugInfo,
                  notificationCount: notifications.length,
                  unreadCount,
                  loading,
                  apiUrl: process.env.NEXT_PUBLIC_API_URL
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}