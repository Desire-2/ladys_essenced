'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCycle } from '../../contexts/CycleContext';
import { useMeal } from '../../contexts/MealContext';
import { useAppointment } from '../../contexts/AppointmentContext';
import { useChildren } from '../../hooks/dashboard/useChildren';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { 
  User, 
  Child, 
  ActiveTab, 
  CycleLogData, 
  MealLogData, 
  AppointmentData 
} from './types';
import { getStorageItem, clearDashboardStorage } from './utils';

// Components
import { NavigationTabs, ChildSelector } from './components/ui';
import { 
  OverviewTab, 
  CycleTab, 
  MealsTab, 
  AppointmentsTab, 
  ChildrenTab 
} from './components/tabs';
import { ViewChildModal } from './components/modals/ViewChildModal';
import { NotificationBell } from '../../components/notifications';

function DashboardContent() {
  const { user, loading: authLoading, logout, hasRole, getDashboardRoute } = useAuth();
  const { addCycleLog, fetchCycleStats, error: cycleError, loading: cycleLoading } = useCycle();
  const { addMealLog, error: mealError, loading: mealLoading } = useMeal();
  const { createAppointment, error: appointmentError, loading: appointmentLoading } = useAppointment();
  
  // Custom hooks
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    setError: setChildrenError,
    loadChildren,
    addChild,
    updateChild,
    deleteChild
  } = useChildren();

  const {
    cycleData,
    recentMeals,
    upcomingAppointments,
    notifications,
    calendarData,
    dataLoadingStates,
    dataErrors,
    dataAvailability,
    loadCycleData,
    loadMealsData,
    loadAppointmentsData,
    loadNotificationsData,
    loadCalendarData,
    loadAllData,
    retryDataLoad
  } = useDashboardData();

  // Local state
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Child form state
  const [childFormError, setChildFormError] = useState('');
  const [childFormSuccess, setChildFormSuccess] = useState('');

  // View child modal state
  const [viewingChild, setViewingChild] = useState<Child | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const router = useRouter();

  // Auth check and data loading
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.log('Dashboard: No user found, redirecting to login.');
      router.push('/login');
      return;
    }

    if (!hasRole('parent') && !hasRole('adolescent')) {
      console.log('Dashboard: User redirected to correct dashboard.');
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }

    console.log('Dashboard: User authenticated, loading data...');
    initializeDashboard();
  }, [user, authLoading, router, hasRole, getDashboardRoute]);

  // Reload data when selectedChild changes
  useEffect(() => {
    if (user) {
      console.log('Dashboard: Selected child changed, reloading data for:', selectedChild || user.id);
      loadCycleData(selectedChild);
      loadMealsData(selectedChild);
      loadAppointmentsData(selectedChild);
      
      if (activeTab === 'cycle') {
        loadCalendarData(undefined, undefined, selectedChild);
      }
    }
  }, [selectedChild, user]);

  // Load calendar data when switching to cycle tab
  useEffect(() => {
    if (user && activeTab === 'cycle') {
      loadCalendarData(undefined, undefined, selectedChild);
    }
  }, [user, activeTab, selectedChild]);

  const initializeDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Load children data if user is a parent
      if (user.user_type === 'parent') {
        await loadChildren();
      }

      // Load all dashboard data
      await loadAllData(selectedChild);
    } catch (err: any) {
      console.error('Failed to initialize dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate calendar months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    loadCalendarData(newDate.getFullYear(), newDate.getMonth() + 1, selectedChild);
  };

  // Handle form submissions
  const handleCycleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError('');

    const symptoms: string[] = [];
    const symptomCheckboxes = e.currentTarget.querySelectorAll('input[name="symptoms"]:checked') as NodeListOf<HTMLInputElement>;
    symptomCheckboxes.forEach(cb => symptoms.push(cb.value));

    const cycleLogData: CycleLogData = {
      start_date: formData.get('startDate') as string,
      end_date: formData.get('endDate') as string || undefined,
      flow_intensity: formData.get('flowIntensity') as string || undefined,
      symptoms: symptoms.length > 0 ? symptoms : undefined,
      notes: formData.get('notes') as string,
      user_id: selectedChild || user?.id
    };

    const result = await addCycleLog(cycleLogData);
    if (!result.success) {
      setError(result.error || 'Failed to save cycle log');
      return;
    }

    // Refresh stats and calendar
    await fetchCycleStats();
    loadCalendarData(undefined, undefined, selectedChild);
    e.currentTarget.reset();
    console.log('Cycle log saved successfully!');
  };

  const handleMealSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setError('');

    const formData = new FormData(form);
    const mealLogData: MealLogData = {
      meal_type: formData.get('mealType') as string,
      meal_time: formData.get('mealDate') as string,
      description: formData.get('mealDetails') as string,
      user_id: selectedChild || user?.id
    };

    const result = await addMealLog(mealLogData);
    if (!result.success) {
      setError(result.error || 'Failed to save meal log');
      return;
    }

    loadMealsData(selectedChild);
    form.reset();
  };

  const handleAppointmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const appointmentData: AppointmentData = {
      issue: formData.get('issue') as string,
      preferred_date: formData.get('preferredDate') as string,
      appointment_date: formData.get('appointmentDate') as string || undefined,
      for_user_id: selectedChild || user?.id
    };

    const result = await createAppointment(appointmentData);
    if (!result.success) {
      setError(result.error || 'Failed to save appointment');
      return;
    }

    loadAppointmentsData(selectedChild);
    e.currentTarget.reset();
  };

  // Handle child form submission (placeholder - implement based on your existing logic)
  const handleChildFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implementation would go here based on your existing child form logic
    console.log('Child form submitted');
  };

  // Child modal handlers
  const viewChild = (child: Child) => {
    setViewingChild(child);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingChild(null);
  };

  const startEditingChild = (child: Child) => {
    // Implementation would go here based on your existing editing logic
    console.log('Start editing child:', child);
  };

  const handleDeleteChild = async (id: number) => {
    const result = await deleteChild(id);
    if (result.success) {
      setChildFormSuccess('Child removed successfully!');
      setTimeout(() => setChildFormSuccess(''), 3000);
    } else {
      setChildFormError(result.error || 'Failed to delete child');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Loading Dashboard</h4>
          <p className="text-muted">Fetching your data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center mb-3">
            <i className="fas fa-exclamation-triangle me-2" style={{ fontSize: '1.5rem' }}></i>
            <h4 className="mb-0">Dashboard Error</h4>
          </div>
          <p className="mb-3">{error}</p>
          
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-primary"
              onClick={async () => {
                if (retryCount < 5) {
                  setError('');
                  setRetryCount(prev => prev + 1);
                  await initializeDashboard();
                } else {
                  alert('Maximum retry attempts reached. Please check your connection and try logging in again.');
                }
              }}
              disabled={retryCount >= 5}
            >
              <i className="fas fa-redo me-1"></i>
              {retryCount >= 5 ? 'Max Retries Reached' : `Retry Loading (${retryCount}/5)`}
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-refresh me-1"></i>
              Refresh Page
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                clearDashboardStorage();
                router.push('/login');
              }}
            >
              <i className="fas fa-sign-out-alt me-1"></i>
              Logout & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3 py-md-4 px-2 px-md-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2">
        <h1 className="h4 h3-md mb-0">Dashboard - Welcome, {user?.name}</h1>
        <div className="d-flex gap-2 align-items-center">
          <NotificationBell />
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              localStorage.removeItem('access_token');
              router.push('/login');
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Parent-specific child selector */}
      {user?.user_type === 'parent' && (
        <ChildSelector 
          children={children}
          selectedChild={selectedChild}
          setSelectedChild={setSelectedChild}
        />
      )}
      
      {/* Dashboard Navigation */}
      <NavigationTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userType={user?.user_type || 'adolescent'}
      />
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          selectedChild={selectedChild}
          children={children}
          recentMeals={recentMeals}
          upcomingAppointments={upcomingAppointments}
          notifications={notifications}
          dataLoadingStates={dataLoadingStates}
          dataErrors={dataErrors}
          dataAvailability={dataAvailability}
          onRetryDataLoad={(dataType) => retryDataLoad(dataType, selectedChild)}
          setActiveTab={setActiveTab}
          userType={user?.user_type}
        />
      )}

      {activeTab === 'cycle' && (
        <CycleTab
          selectedChild={selectedChild}
          children={children}
          cycleData={cycleData}
          calendarData={calendarData}
          currentDate={currentDate}
          dataLoadingStates={dataLoadingStates}
          dataErrors={dataErrors}
          dataAvailability={dataAvailability}
          onNavigateMonth={navigateMonth}
          onRetryDataLoad={(dataType) => retryDataLoad(dataType, selectedChild)}
          onCycleSubmit={handleCycleSubmit}
          cycleError={cycleError}
        />
      )}

      {activeTab === 'meals' && (
        <MealsTab
          selectedChild={selectedChild}
          children={children}
          onMealSubmit={handleMealSubmit}
          mealError={mealError}
        />
      )}

      {activeTab === 'appointments' && (
        <AppointmentsTab
          selectedChild={selectedChild}
          children={children}
          upcomingAppointments={upcomingAppointments}
          onAppointmentBooked={() => {
            console.log('Appointment booked callback triggered - refreshing with force flag');
            loadAppointmentsData(selectedChild, true);
          }}
        />
      )}

      {user?.user_type === 'parent' && activeTab === 'children' && (
        <ChildrenTab
          children={children}
          onChildFormSubmit={handleChildFormSubmit}
          childFormError={childFormError}
          childFormSuccess={childFormSuccess}
          onDeleteChild={handleDeleteChild}
          onViewChild={viewChild}
        />
      )}

      {/* View Child Information Modal */}
      <ViewChildModal
        child={viewingChild}
        isOpen={showViewModal}
        onClose={closeViewModal}
        onEdit={startEditingChild}
        onSelectChild={setSelectedChild}
      />
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}