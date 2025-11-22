'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCycle } from '../../contexts/CycleContext';
import { useMeal } from '../../contexts/MealContext';
import { useAppointment } from '../../contexts/AppointmentContext';
import { useChildAccess } from '../../contexts/ChildAccessContext';
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
  ChildrenTab,
  SettingsTab 
} from './components/tabs';
import { ViewChildModal } from './components/modals/ViewChildModal';
import { CycleHistorySimple } from './components/CycleHistorySimple';

function DashboardContent() {
  const { user, loading: authLoading, logout, hasRole, getDashboardRoute, accessToken } = useAuth();
  const { addCycleLog, fetchCycleStats, error: cycleError, loading: cycleLoading } = useCycle();
  const { addMealLog, error: mealError, loading: mealLoading } = useMeal();
  const { createAppointment, error: appointmentError, loading: appointmentLoading } = useAppointment();
  
  // Local state for form errors
  const [cycleFormError, setCycleFormError] = useState<string | null>(null);
  
  // Custom hooks
  const {
    parentChildren: children,
    accessedChild,
    loading: childrenLoading,
    error: childrenError,
    fetchParentChildren: loadChildren,
    addChild,
    updateChild,
    deleteChild,
    switchToChild,
    clearAccessedChild,
    setError: setChildrenError
  } = useChildAccess();

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
    retryDataLoad,
    loadAllData: initializeDashboard
  } = useDashboardData();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // Use accessedChild from context for selectedChild
  const selectedChild = accessedChild?.user_id || null;
  
  const setSelectedChild = (userId: number | null) => {
    if (userId) {
      // Find child by user_id and switch to them using child.id
      const child = children.find((c: Child) => c.user_id === userId);
      if (child) {
        console.log('Switching to child:', child.name, 'with user_id:', userId, 'and child.id:', child.id);
        switchToChild(child.id); // Use child.id for switchToChild
      }
    } else {
      // Clear accessed child
      console.log('Clearing accessed child');
      clearAccessedChild();
    }
  };
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingChild, setViewingChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCycleHistory, setShowCycleHistory] = useState(false);
  
  // Form states
  const [childFormError, setChildFormError] = useState('');
  const [childFormSuccess, setChildFormSuccess] = useState('');

  // Initialize dashboard once when user is available
  const [isInitialized, setIsInitialized] = useState(false);

  // Event listener for cycle history management
  useEffect(() => {
    const handleOpenCycleHistory = (event: any) => {
      console.log('Dashboard received openCycleHistory event:', event);
      console.log('Event detail:', event.detail);
      console.log('Setting showCycleHistory to true');
      setShowCycleHistory(true);
    };

    console.log('Dashboard: Setting up openCycleHistory event listener');
    window.addEventListener('openCycleHistory', handleOpenCycleHistory);
    
    return () => {
      console.log('Dashboard: Cleaning up openCycleHistory event listener');
      window.removeEventListener('openCycleHistory', handleOpenCycleHistory);
    };
  }, []);

  // Auth checks and redirect
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If auth finished loading and no user, redirect to login
    if (!user || !accessToken) {
      console.log('⚠️ Dashboard: No user or token after auth loaded, redirecting to login');
      router.push('/login');
      return;
    }

    if (!hasRole('parent') && !hasRole('adolescent')) {
      setError('Unauthorized access. Please contact support.');
      return;
    }

    // Initialize dashboard only once
    if (!isInitialized) {
      const initialize = async () => {
        try {
          // Load dashboard data (children are loaded automatically by ChildAccessProvider)
          await initializeDashboard();
          setIsInitialized(true);
          console.log('Dashboard initialized. Children available:', children.length);
        } catch (err) {
          console.error('Dashboard initialization failed:', err);
          setError('Failed to initialize dashboard');
        } finally {
          setLoading(false);
        }
      };
      
      initialize();
    }
  }, [user, hasRole, isInitialized, authLoading, accessToken]); // Removed loadChildren dependency since ChildAccessProvider handles it

  useEffect(() => {
    // Wait for auth and initialization
    if (authLoading || !isInitialized) {
      return;
    }

    // Skip if no user after auth loaded
    if (!user || !accessToken) {
      return;
    }

    if (activeTab === 'cycle' && isInitialized) {
      console.log('Dashboard: Loading cycle tab data for child:', selectedChild);
      // Load both cycle data and calendar data when switching to cycle tab
      loadCycleData(selectedChild);
      loadCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1, selectedChild);
    }
  }, [user, activeTab, selectedChild, isInitialized, currentDate, authLoading, accessToken]); // Added currentDate dependency

  // Navigation function for calendar
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

  // Child management functions
  const handleChildFormSubmit = async (childData: any) => {
    try {
      setChildFormError('');
      setChildFormSuccess('');
      
      if (user.user_type === 'parent') {
        const result = await addChild(childData);
        
        if (result.success) {
          setChildFormSuccess('Child added successfully');
          await loadChildren();
        } else {
          setChildFormError(result.error || 'Failed to add child');
        }
      }
    } catch (err) {
      setChildFormError('An unexpected error occurred');
      console.error('Child form submission error:', err);
    }
  };



  // Form submission handlers
  const handleCycleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Extract all form fields properly
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;
      const flowIntensity = formData.get('flowIntensity') as string;
      const notes = formData.get('notes') as string;
      
      // Collect symptoms from checkboxes  
      const symptoms = formData.getAll('symptoms') as string[];
      
      // Extract new wellness tracking fields
      const mood = formData.get('mood') as string;
      const energy = formData.get('energy') as string;
      const sleepQuality = formData.get('sleep_quality') as string;
      const stressLevel = formData.get('stress_level') as string;
      const exercise = formData.getAll('exercise') as string[];

      // Validate required field - check for empty string, null, or undefined
      if (!startDate || startDate.trim() === '') {
        setCycleFormError('Start date is required and cannot be null');
        return;  // Exit early on validation failure
      }

      const data: any = {
        start_date: startDate.trim(),
        end_date: endDate && endDate.trim() !== '' ? endDate.trim() : null,
        flow_intensity: flowIntensity || 'medium',
        symptoms: symptoms,
        notes: notes && notes.trim() !== '' ? notes.trim() : null,
        // Enhanced tracking data for better predictions
        mood: mood || null,
        energy_level: energy || null,
        sleep_quality: sleepQuality || null,
        stress_level: stressLevel || null,
        exercise_activities: exercise.length > 0 ? exercise : null,
      };

      if (user?.user_type === 'parent' && selectedChild) {
        data.user_id = selectedChild;
      }

      console.log('Submitting cycle data:', data);
      const result = await addCycleLog(data);
      
      if (!result.success) {
        console.error('Cycle submission failed:', result.error);
        setCycleFormError(result.error || 'Failed to add cycle log');
        return;
      }

      // Clear any previous errors and reset form
      setCycleFormError(null);
      
      // Reset form fields safely
      if (e.currentTarget && typeof e.currentTarget.reset === 'function') {
        e.currentTarget.reset();
      } else {
        console.warn('Form reset not available, clearing manually');
        // Manual field clearing as fallback
        const form = e.target as HTMLFormElement;
        if (form && form.reset) {
          form.reset();
        }
      }
      
      // Reload cycle data after successful submission
      loadCycleData(selectedChild);
    } catch (error) {
      console.error('Cycle submission error:', error);
      const errorMsg = 'Failed to add cycle log';
      setCycleFormError(errorMsg);
    }
  };

  const handleMealSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.currentTarget);
      const data: any = {
        meal_type: formData.get('meal_type'),
        meal_time: formData.get('meal_time'),
        description: formData.get('description'),
      };

      if (user?.user_type === 'parent' && selectedChild) {
        data.user_id = selectedChild;
      }

      const result = await addMealLog(data);
      
      if (!result.success) {
        console.error('Meal submission failed:', result.error);
        return result;
      }

      // Reload meals data after successful submission
      loadMealsData(selectedChild);
      return result;
    } catch (error) {
      console.error('Meal submission error:', error);
      return { success: false, error: 'Failed to add meal log' };
    }
  };

  const handleDeleteChild = async (childId: number) => {
    try {
      const result = await deleteChild(childId);
      if (result.success) {
        if (selectedChild === childId) {
          setSelectedChild(null);
        }
        await loadChildren();
      }
      return result;
    } catch (error) {
      console.error('Delete child error:', error);
      return { success: false, error: 'Failed to delete child' };
    }
  };

  const viewChild = (child: Child) => {
    setViewingChild(child);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingChild(null);
  };

  const startEditingChild = (child: Child) => {
    // Implementation for editing child
    closeViewModal();
  };

  // Loading state - show while auth is loading or dashboard is initializing
  if (authLoading || (loading && !isInitialized)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Loading Dashboard</h4>
          <p className="text-muted">{authLoading ? 'Authenticating...' : 'Initializing your dashboard...'}</p>
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
                  setIsInitialized(false); // Reset initialization flag
                  setLoading(true); // Reset loading state
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
      <div className="mb-3 mb-md-4">
        <h1 className="h4 h3-md mb-0">Dashboard - Welcome, {user?.name}</h1>
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
          cycleError={cycleFormError || undefined}
          isLoading={cycleLoading}
          userType={user?.user_type}
        />
      )}

      {activeTab === 'meals' && (
        <MealsTab 
          selectedChild={selectedChild}
          children={children}
          onMealSubmit={handleMealSubmit}
          mealError={mealError}
          userType={user?.user_type}
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
          userType={user?.user_type}
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

      {user?.user_type === 'adolescent' && activeTab === 'settings' && (
        <SettingsTab
          userType={user?.user_type}
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

      {/* Cycle History Management Modal */}
      {showCycleHistory && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-history me-2 text-primary"></i>
                  Cycle History & Management
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    console.log('Closing modal via X button');
                    setShowCycleHistory(false);
                  }}
                ></button>
              </div>
              <div className="modal-body p-0">
                <CycleHistorySimple
                  onClose={() => {
                    console.log('Closing modal via component');
                    setShowCycleHistory(false);
                  }}
                  selectedChild={selectedChild}
                  children={children}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}