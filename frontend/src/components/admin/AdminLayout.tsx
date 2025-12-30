'use client';

import { useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  color?: string;
}

export default function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#667eea' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users', color: '#f093fb' },
    { id: 'health-providers', label: 'Health Providers', icon: 'fas fa-user-md', color: '#4facfe' },
    { id: 'content', label: 'Content Review', icon: 'fas fa-file-alt', color: '#43e97b' },
    { id: 'courses', label: 'Course Management', icon: 'fas fa-graduation-cap', color: '#fa709a' },
    { id: 'appointments', label: 'Appointments', icon: 'fas fa-calendar-check', color: '#feca57' },
    { id: 'logs', label: 'System Logs', icon: 'fas fa-list-alt', color: '#ff6b6b' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar', color: '#4834d4' },
  ];

  const handleNavClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Top Navigation Bar */}
      <nav className="admin-topbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        zIndex: 1030,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px'
      }}>
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-auto">
              {/* Mobile Menu Toggle */}
              <button
                className="btn btn-link text-dark d-lg-none p-0 me-3"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ fontSize: '24px' }}
              >
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>

              {/* Desktop Sidebar Toggle */}
              <button
                className="btn btn-link text-dark d-none d-lg-inline p-0 me-3"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ fontSize: '20px' }}
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>

            <div className="col">
              <div className="d-flex align-items-center">
                <i className="fas fa-crown me-2" style={{ color: '#667eea', fontSize: '24px' }}></i>
                <h4 className="mb-0 fw-bold d-none d-md-block" style={{ color: '#2d3748' }}>
                  Admin Dashboard
                </h4>
                <h5 className="mb-0 fw-bold d-md-none" style={{ color: '#2d3748' }}>
                  Admin
                </h5>
              </div>
            </div>

            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                {/* Notifications */}
                <div className="position-relative d-none d-md-block">
                  <button className="btn btn-link text-dark p-0" style={{ fontSize: '20px' }}>
                    <i className="fas fa-bell"></i>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                      3
                    </span>
                  </button>
                </div>

                {/* User Profile Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-link text-dark p-0 d-flex align-items-center text-decoration-none"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-2"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div className="text-start d-none d-md-block">
                        <div className="fw-semibold" style={{ fontSize: '14px', lineHeight: '1.2' }}>
                          {user?.name || 'Admin'}
                        </div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                          Administrator
                        </div>
                      </div>
                      <i className="fas fa-chevron-down ms-2 d-none d-md-inline" style={{ fontSize: '12px' }}></i>
                    </div>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" style={{ minWidth: '220px' }}>
                    <li>
                      <div className="dropdown-item-text">
                        <div className="fw-semibold">{user?.name || 'Admin'}</div>
                        <div className="text-muted small">{user?.email || user?.phone_number}</div>
                      </div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fas fa-user me-2"></i>
                        Profile Settings
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fas fa-cog me-2"></i>
                        System Settings
                      </a>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          position: 'fixed',
          top: '70px',
          left: isMobileMenuOpen ? '0' : sidebarCollapsed ? '-280px' : '0',
          width: sidebarCollapsed ? '80px' : '280px',
          height: 'calc(100vh - 70px)',
          backgroundColor: '#fff',
          boxShadow: '2px 0 10px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          zIndex: 1020,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div className="p-3">
          <nav className="nav flex-column">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link text-start border-0 mb-2 ${activeSection === item.id ? 'active' : ''}`}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: activeSection === item.id ? `${item.color}15` : 'transparent',
                  color: activeSection === item.id ? item.color : '#6c757d',
                  fontWeight: activeSection === item.id ? '600' : '500',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {activeSection === item.id && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: item.color,
                      borderRadius: '0 4px 4px 0'
                    }}
                  />
                )}
                <div className="d-flex align-items-center">
                  <i
                    className={item.icon}
                    style={{
                      fontSize: '18px',
                      width: '24px',
                      marginRight: sidebarCollapsed ? '0' : '12px'
                    }}
                  ></i>
                  {!sidebarCollapsed && (
                    <span style={{ fontSize: '14px' }}>{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className="badge rounded-pill ms-auto"
                      style={{ backgroundColor: item.color, fontSize: '11px' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="mt-auto p-3 border-top">
            <div className="card border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white p-3">
                <h6 className="mb-2" style={{ fontSize: '13px' }}>
                  <i className="fas fa-lightbulb me-2"></i>
                  Quick Tip
                </h6>
                <p className="mb-0" style={{ fontSize: '12px', opacity: 0.9 }}>
                  Use keyboard shortcuts to navigate faster through the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay d-lg-none"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1010
          }}
        />
      )}

      {/* Main Content */}
      <main
        className="admin-main-content"
        style={{
          marginTop: '70px',
          marginLeft: sidebarCollapsed ? '0' : '280px',
          padding: '32px',
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 70px)',
          backgroundColor: '#f8f9fa'
        }}
      >
        <div className="container-fluid" style={{ maxWidth: '1600px' }}>
          {children}
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 991px) {
          .admin-sidebar {
            left: ${isMobileMenuOpen ? '0' : '-280px'} !important;
            width: 280px !important;
          }
          .admin-main-content {
            margin-left: 0 !important;
            padding: 16px !important;
          }
        }

        @media (max-width: 767px) {
          .admin-main-content {
            padding: 12px !important;
          }
        }

        .admin-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .admin-sidebar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .admin-sidebar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .admin-sidebar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .admin-main-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
