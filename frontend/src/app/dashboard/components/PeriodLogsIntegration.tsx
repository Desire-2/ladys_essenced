import React, { useEffect, useState } from 'react';
import CycleLogsManagement from '../../../components/CycleLogsManagement';
import PeriodLogsManagement from '../../../components/PeriodLogsManagement';
import MenstrualHealthDashboard from '../../../components/MenstrualHealthDashboard';

interface PeriodLogsIntegrationProps {
  onClose?: () => void;
}

export const PeriodLogsIntegration: React.FC<PeriodLogsIntegrationProps> = ({ onClose }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'cycles' | 'periods'>('dashboard');
  const [navigationSource, setNavigationSource] = useState<string>('');

  useEffect(() => {
    // Listen for period logs navigation events
    const handleOpenPeriodLogs = (event: CustomEvent) => {
      const { source } = event.detail;
      setNavigationSource(source);
      setActiveView('periods');
      
      // Show notification
      console.log(`Opening period logs from: ${source}`);
    };

    // Add event listener
    window.addEventListener('openPeriodLogs' as any, handleOpenPeriodLogs);

    // Cleanup
    return () => {
      window.removeEventListener('openPeriodLogs' as any, handleOpenPeriodLogs);
    };
  }, []);

  const renderBreadcrumb = () => (
    <div className="mb-3">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <button 
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setActiveView('dashboard')}
            >
              <i className="fas fa-home me-1"></i>
              Dashboard
            </button>
          </li>
          {activeView !== 'dashboard' && (
            <li className="breadcrumb-item active" aria-current="page">
              <i className={`fas fa-${activeView === 'cycles' ? 'calendar-alt' : 'tint'} me-1`}></i>
              {activeView === 'cycles' ? 'Cycle Management' : 'Period Tracking'}
            </li>
          )}
        </ol>
      </nav>
      {navigationSource && activeView === 'periods' && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Welcome to Period Logs!</strong> You navigated here from the {navigationSource.replace('-', ' ')}.
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNavigationSource('')}
          ></button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'cycles':
        return <CycleLogsManagement />;
      case 'periods':
        return <PeriodLogsManagement />;
      default:
        return <MenstrualHealthDashboard />;
    }
  };

  return (
    <div className="period-logs-integration">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="fas fa-heart text-danger me-2"></i>
            Menstrual Health Management
          </h2>
          <p className="text-muted mb-0">Comprehensive tracking and insights for your menstrual health</p>
        </div>
        {onClose && (
          <button className="btn btn-outline-secondary" onClick={onClose}>
            <i className="fas fa-times me-1"></i>
            Close
          </button>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      {renderBreadcrumb()}

      {/* Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-body">
          <ul className="nav nav-pills nav-justified" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
                type="button"
                role="tab"
              >
                <i className="fas fa-tachometer-alt me-2"></i>
                <span className="d-none d-md-inline">Dashboard Overview</span>
                <span className="d-md-none">Dashboard</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeView === 'cycles' ? 'active' : ''}`}
                onClick={() => setActiveView('cycles')}
                type="button"
                role="tab"
              >
                <i className="fas fa-calendar-alt me-2"></i>
                <span className="d-none d-md-inline">Cycle Management</span>
                <span className="d-md-none">Cycles</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeView === 'periods' ? 'active' : ''}`}
                onClick={() => setActiveView('periods')}
                type="button"
                role="tab"
              >
                <i className="fas fa-tint me-2"></i>
                <span className="d-none d-md-inline">Period Tracking</span>
                <span className="d-md-none">Periods</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content Area */}
      <div className="tab-content">
        {renderContent()}
      </div>

      {/* Quick Access Floating Button */}
      {activeView !== 'periods' && (
        <div 
          className="position-fixed bottom-0 end-0 p-4"
          style={{ zIndex: 1050 }}
        >
          <button
            className="btn btn-primary rounded-circle shadow-lg"
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(255,107,107,0.4)'
            }}
            onClick={() => setActiveView('periods')}
            title="Quick Period Tracking"
          >
            <i className="fas fa-tint" style={{ fontSize: '1.5rem' }}></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default PeriodLogsIntegration;