'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChildAccess } from '@/contexts/ChildAccessContext';
import { useParent } from '@/contexts/ParentContext';
import { ChildrenList } from '@/components/parent/ChildrenList';
import { AddChildForm } from '@/components/parent/AddChildForm';
import { ChildMonitoring } from '@/components/parent/ChildMonitoring';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { ChildProfile } from '@/components/parent/ChildProfile';
import { LogCycle } from '@/components/parent/LogCycle';
import { LogMeal } from '@/components/parent/LogMeal';
import { AddAppointment } from '@/components/parent/AddAppointment';
import ChildAppointmentBooking from '@/components/parent/ChildAppointmentBooking';
import { ChildCalendar } from '@/components/parent/ChildCalendar';
import { CycleCalendar } from '@/components/parent/CycleCalendar';
import '../../../styles/parent-dashboard.css';
import '../../../styles/child-appointment-booking.css';

interface Child {
  id: number;
  name: string;
  date_of_birth?: string;
  relationship?: string;
  user_id?: number;
}

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, hasRole, logout } = useAuth();
  const { childrenList, selectedChild, setSelectedChild, fetchChildren, childrenLoading } = useParent();
  const { accessedChild, switchToChild, parentChildren } = useChildAccess();
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  
  // Get tab from URL query params, default to 'overview'
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'add-child' | 'profile' | 'monitoring' | 'cycle' | 'meal' | 'appointment' | 'calendar' | 'cycle-calendar'>(
    (tabParam as any) || 'overview'
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasRole('parent')) {
      router.push(user.user_type === 'adolescent' ? '/dashboard' : '/');
      return;
    }

    // Load children data on mount
    fetchChildren();
  }, [user, authLoading, hasRole, router, fetchChildren]);

  const handleChildAdded = () => {
    setActiveTab('overview');
    setEditingChild(null);
  };

  const selectedChildData = childrenList.find((c: Child) => c.id === selectedChild);

  if (authLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient">
        <div className="text-center">
          <div className="spinner-border text-primary mb-4" style={{ width: '4rem', height: '4rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading dashboard...</h5>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="parent-dashboard-container">
      {/* Header Section */}
      <div className="header-gradient mb-5 pb-4 pt-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-5 fw-bold text-white mb-2">
                <i className="fas fa-home me-3"></i>
                Parent Dashboard
              </h1>
              <p className="text-white-50">Welcome, {user?.name}</p>
            </div>
            <button
              className="btn btn-light btn-lg"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>

          {/* Child Switcher */}
          {parentChildren.length > 0 && (
            <div className="mb-4">
              <ChildSwitcher asDropdown={true} showLabel={true} />
            </div>
          )}

          {/* Quick Stats */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="stat-card bg-white bg-opacity-10 text-white p-3 rounded">
                <div className="d-flex align-items-center">
                  <i className="fas fa-child fa-2x me-3 op-7"></i>
                  <div>
                    <small className="op-7">Children Added</small>
                    <h4 className="mb-0">{childrenList.length}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card bg-white bg-opacity-10 text-white p-3 rounded">
                <div className="d-flex align-items-center">
                  <i className="fas fa-calendar-check fa-2x me-3 op-7"></i>
                  <div>
                    <small className="op-7">Active Monitoring</small>
                    <h4 className="mb-0">{selectedChild ? '1' : '0'}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card bg-white bg-opacity-10 text-white p-3 rounded">
                <div className="d-flex align-items-center">
                  <i className="fas fa-shield-alt fa-2x me-3 op-7"></i>
                  <div>
                    <small className="op-7">Account Status</small>
                    <h4 className="mb-0">Active</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container pb-5">
        {/* Navigation Tabs */}
        <div className="mb-4">
          <ul className="nav nav-pills flex-wrap" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
                type="button"
                role="tab"
              >
                <i className="fas fa-th-large me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'add-child' ? 'active' : ''}`}
                onClick={() => {
                  setEditingChild(null);
                  setActiveTab('add-child');
                }}
                type="button"
                role="tab"
              >
                <i className="fas fa-plus-circle me-2"></i>
                Add Child
              </button>
            </li>
            {selectedChild && (
              <>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-user-circle me-2"></i>
                    Profile
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'monitoring' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monitoring')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-heartbeat me-2"></i>
                    Monitor
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'cycle' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cycle')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-calendar-check me-2"></i>
                    Log Cycle
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'meal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meal')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-utensils me-2"></i>
                    Log Meal
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'appointment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appointment')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-calendar-plus me-2"></i>
                    Appointment
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-calendar me-2"></i>
                    Calendar
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'cycle-calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cycle-calendar')}
                    type="button"
                    role="tab"
                  >
                    <i className="fas fa-heart me-2"></i>
                    Cycle Calendar
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-pane fade show active">
            <div className="row g-4">
              {/* Children List */}
              <div className="col-lg-8">
                <ChildrenList
                  selectedChildId={selectedChild}
                  onSelectChild={(childId) => {
                    setSelectedChild(childId);
                    if (childId) {
                      setActiveTab('monitoring');
                    }
                  }}
                />
              </div>

              {/* Quick Actions Sidebar */}
              <div className="col-lg-4">
                <div className="card mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-lightning me-2"></i>
                      Quick Actions
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setActiveTab('add-child')}
                      >
                        <i className="fas fa-plus-circle me-2"></i>
                        Add New Child
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={!selectedChild}
                      >
                        <i className="fas fa-edit me-2"></i>
                        Edit Child
                      </button>
                      <button
                        className="btn btn-outline-info btn-sm"
                        disabled={!selectedChild}
                      >
                        <i className="fas fa-download me-2"></i>
                        Export Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features Card */}
                <div className="card">
                  <div className="card-header bg-info text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-star me-2"></i>
                      Features
                    </h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled small">
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Track multiple children
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Monitor cycle patterns
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        View meal logs
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Schedule appointments
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Get health insights
                      </li>
                      <li className="mb-0">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Secure data privacy
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Child Tab */}
        {activeTab === 'add-child' && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <AddChildForm
                  editingChild={editingChild}
                  onChildAdded={handleChildAdded}
                  onEditComplete={() => {
                    setEditingChild(null);
                    setActiveTab('overview');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <ChildProfile
                  childId={selectedChild}
                  childName={selectedChildData.name}
                  childData={selectedChildData}
                  onDataUpdated={() => {
                    fetchChildren();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <ChildMonitoring
              childId={selectedChild}
              childName={selectedChildData.name}
            />
          </div>
        )}

        {/* Log Cycle Tab */}
        {activeTab === 'cycle' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <LogCycle
                  childId={selectedChild}
                  childName={selectedChildData.name}
                  onSuccess={() => setActiveTab('monitoring')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Log Meal Tab */}
        {activeTab === 'meal' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <LogMeal
                  childId={selectedChild}
                  childName={selectedChildData.name}
                  onSuccess={() => setActiveTab('monitoring')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Add Appointment Tab */}
        {activeTab === 'appointment' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <ChildAppointmentBooking
              user={user}
              onBookingSuccess={() => {
                setActiveTab('monitoring');
              }}
            />
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-12">
                <ChildCalendar
                  childId={selectedChild}
                  childName={selectedChildData.name}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cycle Calendar Tab */}
        {activeTab === 'cycle-calendar' && selectedChild && selectedChildData && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-12">
                <CycleCalendar
                  childId={selectedChild}
                  childName={selectedChildData.name}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient">
        <div className="text-center">
          <div className="spinner-border text-primary mb-4" style={{ width: '4rem', height: '4rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading dashboard...</h5>
        </div>
      </div>
    }>
      <ParentDashboardContent />
    </Suspense>
  );
}
