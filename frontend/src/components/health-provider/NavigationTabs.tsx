'use client';

import type { TabType } from '../../types/health-provider';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unassignedCount: number;
}

export default function NavigationTabs({ 
  activeTab, 
  onTabChange, 
  unassignedCount 
}: NavigationTabsProps) {
  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: 'fas fa-chart-line'
    },
    {
      id: 'appointments' as TabType,
      label: 'My Appointments',
      icon: 'fas fa-calendar-check'
    },
    {
      id: 'unassigned' as TabType,
      label: 'Available Appointments',
      icon: 'fas fa-calendar-plus',
      badge: unassignedCount > 0 ? unassignedCount : undefined
    },
    {
      id: 'schedule' as TabType,
      label: 'Schedule',
      icon: 'fas fa-calendar'
    },
    {
      id: 'patients' as TabType,
      label: 'Patients',
      icon: 'fas fa-users'
    },
    {
      id: 'book-appointment' as TabType,
      label: 'Book Appointment',
      icon: 'fas fa-plus-circle'
    },
    {
      id: 'profile' as TabType,
      label: 'Profile',
      icon: 'fas fa-user-md'
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: 'fas fa-chart-bar'
    },
    {
      id: 'availability' as TabType,
      label: 'Availability',
      icon: 'fas fa-clock'
    }
  ];

  return (
    <div className="card mb-4">
      <div className="card-body">
        <ul className="nav nav-tabs">
          {tabs.map((tab) => (
            <li key={tab.id} className="nav-item">
              <a 
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onTabChange(tab.id);
                }}
              >
                <i className={`${tab.icon} me-1`}></i>
                {tab.label}
                {tab.badge && (
                  <span className="badge bg-danger ms-2">{tab.badge}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
