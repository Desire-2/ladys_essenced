'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProviderStats } from '../../types/health-provider';
import RealTimeNotifications from './RealTimeNotifications';

interface HealthProviderHeaderProps {
  stats: ProviderStats | null;
  onProfileClick: () => void;
  onProviderSelectionClick?: () => void;
  useEnhancedViews?: boolean;
  onToggleViews?: () => void;
  successMessage: string;
  error: string;
  onClearSuccess: () => void;
  onClearError: () => void;
}

export default function HealthProviderHeader({ 
  stats, 
  onProfileClick, 
  onProviderSelectionClick,
  useEnhancedViews = true,
  onToggleViews,
  successMessage, 
  error, 
  onClearSuccess, 
  onClearError 
}: HealthProviderHeaderProps) {
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <div className="enhanced-header mb-4">
      {/* Alert Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClearSuccess}
          ></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClearError}
          ></button>
        </div>
      )}

      {/* Verification Status Alert */}
      {stats && !stats.provider_info.is_verified && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Your health provider account is pending verification. Some features may be limited until verification is complete.
        </div>
      )}

      {/* Main Header */}
      <div className="header-card">
        <div className="d-flex justify-content-between align-items-center">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="d-flex align-items-center">
              <div className="provider-avatar">
                <i className="fas fa-user-md"></i>
              </div>
              <div className="ms-3">
                <h2 className="mb-1 header-title">
                  Welcome back, {stats?.provider_info?.name || 'Doctor'}
                  <span className="wave-emoji">👋</span>
                </h2>
                <p className="text-muted mb-0 header-subtitle">
                  <i className="fas fa-stethoscope me-2"></i>
                  {stats?.provider_info?.specialization || 'Healthcare Provider'} 
                  {stats?.provider_info?.clinic_name && (
                    <>
                      <span className="mx-2">•</span>
                      <i className="fas fa-hospital me-1"></i>
                      {stats.provider_info.clinic_name}
                    </>
                  )}
                  {stats?.provider_info?.is_verified && (
                    <span className="verified-badge ms-2">
                      <i className="fas fa-check-circle text-success"></i>
                      <small className="text-success ms-1">Verified</small>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="action-section">
            <div className="d-flex align-items-center gap-3">
              {/* Quick Stats */}
              {stats && (
                <div className="quick-stats d-none d-lg-flex">
                  <div className="stat-item">
                    <div className="stat-value text-primary">{stats.appointment_stats.today}</div>
                    <div className="stat-label">Today</div>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <div className="stat-value text-warning">{stats.appointment_stats.pending}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <div className="stat-value text-danger">{stats.appointment_stats.urgent}</div>
                    <div className="stat-label">Urgent</div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              <RealTimeNotifications onNotificationCount={setNotificationCount} />
              
              {/* Select Healthcare Provider Button */}
              {onProviderSelectionClick && (
                <button 
                  className="btn btn-success provider-select-btn"
                  onClick={onProviderSelectionClick}
                  title="Select Healthcare Provider"
                >
                  <i className="fas fa-user-md me-2"></i>
                  Select Provider
                </button>
              )}
              
              {/* Profile Button */}
              <button 
                className="btn btn-outline-primary profile-btn"
                onClick={onProfileClick}
                title="View Profile"
              >
                <i className="fas fa-user me-2"></i>
                Profile
              </button>

              {/* Quick Actions Dropdown */}
              <div className="dropdown">
                <button 
                  className="btn btn-primary dropdown-toggle"
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  title="Quick Actions"
                >
                  <i className="fas fa-bolt me-2"></i>
                  Actions
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>
                      <i className="fas fa-plus-circle me-2 text-primary"></i>
                      New Appointment
                    </a>
                  </li>
                  {onProviderSelectionClick && (
                    <li>
                      <a 
                        className="dropdown-item" 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onProviderSelectionClick(); }}
                      >
                        <i className="fas fa-user-md me-2 text-success"></i>
                        Select Healthcare Provider
                      </a>
                    </li>
                  )}
                  <li>
                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>
                      <i className="fas fa-calendar me-2 text-info"></i>
                      View Schedule
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>
                      <i className="fas fa-ambulance me-2 text-danger"></i>
                      Emergency Mode
                    </a>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {onToggleViews && (
                    <li>
                      <a 
                        className="dropdown-item" 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onToggleViews(); }}
                      >
                        <i className={`fas ${useEnhancedViews ? 'fa-toggle-on' : 'fa-toggle-off'} me-2 text-primary`}></i>
                        {useEnhancedViews ? 'Enhanced Views' : 'Classic Views'}
                      </a>
                    </li>
                  )}
                  <li>
                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>
                      <i className="fas fa-cog me-2 text-secondary"></i>
                      Settings
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                      <i className="fas fa-sign-out-alt me-2 text-secondary"></i>
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {stats && (
          <div className="status-bar mt-4">
            <div className="row g-2">
              <div className="col-6 col-md-3">
                <div className="status-card bg-primary-light">
                  <i className="fas fa-calendar-check text-primary"></i>
                  <div className="ms-2">
                    <div className="status-value">{stats.appointment_stats.total}</div>
                    <div className="status-label">Total</div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="status-card bg-success-light">
                  <i className="fas fa-check-circle text-success"></i>
                  <div className="ms-2">
                    <div className="status-value">{stats.appointment_stats.completed}</div>
                    <div className="status-label">Completed</div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="status-card bg-warning-light">
                  <i className="fas fa-clock text-warning"></i>
                  <div className="ms-2">
                    <div className="status-value">{stats.appointment_stats.this_week}</div>
                    <div className="status-label">This Week</div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="status-card bg-info-light">
                  <i className="fas fa-users text-info"></i>
                  <div className="ms-2">
                    <div className="status-value">{stats.appointment_stats.confirmed}</div>
                    <div className="status-label">Confirmed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .enhanced-header {
          position: relative;
        }
        
        .header-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }
        
        .header-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          transform: translate(50%, -50%);
        }
        
        .provider-avatar {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          backdrop-filter: blur(10px);
        }
        
        .header-title {
          font-size: 1.8rem;
          font-weight: 600;
          color: white;
        }
        
        .wave-emoji {
          margin-left: 8px;
          animation: wave 2s ease-in-out infinite;
        }
        
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }
        
        .header-subtitle {
          color: rgba(255,255,255,0.9);
          font-size: 1rem;
        }
        
        .verified-badge {
          display: inline-flex;
          align-items: center;
        }
        
        .quick-stats {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          backdrop-filter: blur(10px);
        }
        
        .stat-item {
          text-align: center;
          min-width: 50px;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.8);
          margin-top: 2px;
        }
        
        .stat-divider {
          width: 1px;
          height: 30px;
          background: rgba(255,255,255,0.3);
          margin: 0 12px;
        }
        
        .profile-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          backdrop-filter: blur(10px);
        }
        
        .profile-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.5);
          color: white;
        }
        
        .provider-select-btn {
          background: #28a745;
          border: none;
          color: white;
          border-radius: 50px;
          padding: 10px 20px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .provider-select-btn:hover {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
          color: white;
        }
        
        .status-bar {
          margin-top: 1.5rem;
        }
        
        .status-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease;
        }
        
        .status-card:hover {
          transform: translateY(-2px);
        }
        
        .status-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          line-height: 1;
        }
        
        .status-label {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          margin-top: 2px;
        }
        
        .bg-primary-light { background: rgba(13, 110, 253, 0.2) !important; }
        .bg-success-light { background: rgba(25, 135, 84, 0.2) !important; }
        .bg-warning-light { background: rgba(255, 193, 7, 0.2) !important; }
        .bg-info-light { background: rgba(13, 202, 240, 0.2) !important; }
        
        .dropdown-menu {
          border: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border-radius: 12px;
        }
        
        .dropdown-item {
          padding: 12px 20px;
          transition: background-color 0.2s ease;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .header-card {
            padding: 1.5rem;
          }
          
          .header-title {
            font-size: 1.5rem;
          }
          
          .provider-avatar {
            width: 50px;
            height: 50px;
          }
          
          .action-section .d-flex {
            flex-direction: column;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
