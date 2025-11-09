import React from 'react';
import { ActiveTab } from '../../types';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userType: 'parent' | 'adolescent';
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  userType
}) => {
  return (
    <div className="card mb-3 mb-md-4">
      <div className="card-body p-0">
        <div className="overflow-auto">
          <ul className="nav nav-tabs border-0 flex-nowrap" style={{ minWidth: 'max-content' }}>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('overview');
                }}
              >
                <i className="fas fa-home me-1 me-md-2"></i>
                <span className="d-none d-sm-inline">Overview</span>
                <span className="d-inline d-sm-none">Home</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'cycle' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('cycle');
                }}
              >
                <i className="fas fa-calendar-alt me-1 me-md-2"></i>
                <span className="d-none d-sm-inline">Cycle Tracking</span>
                <span className="d-inline d-sm-none">Cycle</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'meals' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('meals');
                }}
              >
                <i className="fas fa-utensils me-1 me-md-2"></i>
                <span className="d-none d-sm-inline">Meal Logs</span>
                <span className="d-inline d-sm-none">Meals</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('appointments');
                }}
              >
                <i className="fas fa-calendar-check me-1 me-md-2"></i>
                <span className="d-none d-sm-inline">Appointments</span>
                <span className="d-inline d-sm-none">Appts</span>
              </a>
            </li>
            {userType === 'parent' && (
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'children' ? 'active' : ''}`} 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('children');
                  }}
                >
                  <i className="fas fa-users me-1 me-md-2"></i>
                  <span className="d-none d-sm-inline">Manage Children</span>
                  <span className="d-inline d-sm-none">Children</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};