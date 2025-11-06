'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { buildAuthApiUrl } from '../../utils/apiConfig';

interface DashboardStats {
  users: {
    total: number;
    new_today: number;
    active: number;
    parents: number;
    adolescents: number;
    content_writers: number;
    health_providers: number;
  };
  content: {
    total: number;
    published: number;
    draft: number;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
  };
  recent_users: Array<{
    id: number;
    name: string;
    user_type: string;
    created_at: string;
  }>;
  recent_content: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
  }>;
  monthly_growth: Array<{
    month: string;
    users: number;
  }>;
}

interface User {
  id: number;
  name: string;
  username?: string;
  phone_number: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_activity: string | null;
}

interface PendingContent {
  id: number;
  title: string;
  summary: string;
  author: string;
  category: string;
  created_at: string;
}

interface Appointment {
  id: number;
  user_name: string;
  user_phone: string;
  issue: string;
  preferred_date: string | null;
  appointment_date: string | null;
  status: string;
  priority: string;
  provider: string | null;
  created_at: string;
}

interface SystemLog {
  id: number;
  user_name: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface Analytics {
  report_type: string;
  data: any[];
}

interface PaginationInfo {
  total: number;
  pages: number;
  current_page: number;
  has_prev?: boolean;
  has_next?: boolean;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface FilterOptions {
  search: string;
  userType: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Course {
  id: number;
  title: string;
  description: string;
  author_id: number;
  author_name: string;
  category_id: number | null;
  category_name: string | null;
  level: string;
  duration: string;
  price: number;
  featured_image: string | null;
  status: string;
  views: number;
  likes: number;
  rating: number;
  modules_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface CourseStats {
  overview: {
    total_courses: number;
    published_courses: number;
    draft_courses: number;
    total_modules: number;
    total_chapters: number;
  };
  recent_courses: Course[];
  top_courses: Course[];
  monthly_stats: Array<{
    month: string;
    courses: number;
  }>;
}

interface ContentWriter {
  id: number;
  name: string;
  email: string;
  courses_count: number;
  created_at: string;
}

interface ContentCategory {
  id: number;
  name: string;
  description: string;
  courses_count: number;
}

export default function AdminDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Course management state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [contentWriters, setContentWriters] = useState<ContentWriter[]>([]);
  const [contentCategories, setContentCategories] = useState<ContentCategory[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCourseStatusModal, setShowCourseStatusModal] = useState(false);
  const [courseFilters, setCourseFilters] = useState({
    search: '',
    status: '',
    level: '',
    author_id: '',
    category_id: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [coursesPagination, setCoursesPagination] = useState<PaginationInfo>({ total: 0, pages: 0, current_page: 1 });
  
  // Enhanced User management state
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userStatistics, setUserStatistics] = useState<any>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [userFormData, setUserFormData] = useState({
    name: '', phone_number: '', email: '', user_type: 'parent', password: '', is_active: true
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  
  // Pagination and filtering
  const [usersPagination, setUsersPagination] = useState<PaginationInfo>({ total: 0, pages: 0, current_page: 1 });
  const [appointmentsPagination, setAppointmentsPagination] = useState<PaginationInfo>({ total: 0, pages: 0, current_page: 1 });
  const [logsPagination, setLogsPagination] = useState<PaginationInfo>({ total: 0, pages: 0, current_page: 1 });
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    userType: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');

  // Computed properties
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !filters.search || 
        user.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone_number?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = !filters.userType || user.user_type === filters.userType;
      
      const matchesStatus = !filters.status || 
        (filters.status === 'active' && user.is_active) ||
        (filters.status === 'inactive' && !user.is_active);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, filters.search, filters.userType, filters.status]);
  
  // Toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  const router = useRouter();
  const { user, loading: authLoading, hasRole, getDashboardRoute } = useAuth();

  // Utility functions
  const showToast = useCallback((type: ToastNotification['type'], message: string, duration = 5000) => {
    const id = Date.now().toString();
    const toast: ToastNotification = { id, type, message, duration };
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatUserType = useCallback((userType: string) => {
    return userType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  const buildApiUrl = useCallback((endpoint: string, params?: Record<string, any>) => {
    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
      : 'http://localhost:5001';
    const url = new URL(`/api/admin${endpoint}`, apiBaseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    return url.toString();
  }, []);

  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      throw new Error('No authentication token');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      router.push('/login');
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, [router]);

  const setActionLoadingState = useCallback((key: string, isLoading: boolean) => {
    setActionLoading(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  const confirmActionDialog = useCallback((message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  }, []);

  // Enhanced data loading functions
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await makeApiCall(buildApiUrl('/dashboard/stats'));
      setStats(data);
      showToast('success', 'Dashboard data loaded successfully');
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      const errorMessage = err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, showToast, buildApiUrl]);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setActionLoadingState('load_users', true);
      
      const params = {
        page,
        per_page: 20,
        ...(filters.search && { search: filters.search }),
        ...(filters.userType && { user_type: filters.userType }),
        ...(filters.sortBy && { sort_by: filters.sortBy }),
        ...(filters.sortOrder && { sort_order: filters.sortOrder })
      };
      
      const data = await makeApiCall(buildApiUrl('/users', {
        page,
        per_page: 20,
        ...(filters.search && { search: filters.search }),
        ...(filters.userType && { user_type: filters.userType }),
        ...(filters.sortBy && { sort_by: filters.sortBy }),
        ...(filters.sortOrder && { sort_order: filters.sortOrder })
      }));
      
      setUsers(data.users);
      setUsersPagination({
        total: data.total,
        pages: data.pages,
        current_page: data.current_page
      });
    } catch (err: any) {
      console.error('Failed to load users:', err);
      showToast('error', err.message || 'Failed to load users');
    } finally {
      setActionLoadingState('load_users', false);
    }
  }, [makeApiCall, showToast, filters, setActionLoadingState]);

  const loadPendingContent = useCallback(async () => {
    try {
      setTabLoading(true);
      
      const data = await makeApiCall(buildApiUrl('/content/pending'));
      setPendingContent(data.content);
    } catch (err: any) {
      console.error('Failed to load pending content:', err);
      showToast('error', err.message || 'Failed to load pending content');
    } finally {
      setTabLoading(false);
    }
  }, [makeApiCall, showToast, buildApiUrl]);

  const loadAppointments = useCallback(async (page = 1) => {
    try {
      setTabLoading(true);
      
      const params = {
        page,
        per_page: 20,
        ...(filters.status && { status: filters.status })
      };
      
      const data = await makeApiCall(buildApiUrl('/appointments/manage', params));
      setAppointments(data.appointments);
      setAppointmentsPagination({
        total: data.total,
        pages: data.pages,
        current_page: data.current_page
      });
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      showToast('error', err.message || 'Failed to load appointments');
    } finally {
      setTabLoading(false);
    }
  }, [makeApiCall, showToast, filters, buildApiUrl]);

  const loadSystemLogs = useCallback(async (page = 1) => {
    try {
      setTabLoading(true);
      
      const params = {
        page,
        per_page: 50,
        ...(filters.search && { action: filters.search })
      };
      
      const data = await makeApiCall(buildApiUrl('/system/logs', params));
      setSystemLogs(data.logs);
      setLogsPagination({
        total: data.total,
        pages: data.pages,
        current_page: data.current_page
      });
    } catch (err: any) {
      console.error('Failed to load system logs:', err);
      showToast('error', err.message || 'Failed to load system logs');
    } finally {
      setTabLoading(false);
    }
  }, [makeApiCall, showToast, filters, buildApiUrl]);

  const loadAnalytics = useCallback(async (reportType = 'user_activity') => {
    try {
      setTabLoading(true);
      
      const data = await makeApiCall(buildApiUrl('/analytics/generate'), {
        method: 'POST',
        body: JSON.stringify({
          report_type: reportType,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        })
      });
      
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      showToast('error', err.message || 'Failed to load analytics');
    } finally {
      setTabLoading(false);
    }
  }, [makeApiCall, showToast]);

  // === COURSE MANAGEMENT FUNCTIONS ===

  const loadCourseStats = useCallback(async () => {
    try {
      setTabLoading(true);
      const data = await makeApiCall(buildApiUrl('/courses/stats'));
      setCourseStats(data);
    } catch (err: any) {
      console.error('Failed to load course stats:', err);
      showToast('error', err.message || 'Failed to load course statistics');
    } finally {
      setTabLoading(false);
    }
  }, [makeApiCall, showToast, buildApiUrl]);

  const loadCourses = useCallback(async (page = 1) => {
    try {
      setTabLoading(true);
      const queryParams = { page, per_page: 10, ...courseFilters };
      const data = await makeApiCall(buildApiUrl('/courses', queryParams));
      setCourses(data.courses || []);
      setCoursesPagination(data.pagination || { total: 0, pages: 0, current_page: 1 });
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      showToast('error', err.message || 'Failed to load courses');
    } finally {
      setTabLoading(false);
    }
  }, [makeApiCall, showToast, buildApiUrl, courseFilters]);

  const loadContentWriters = useCallback(async () => {
    try {
      const data = await makeApiCall(buildApiUrl('/content-writers'));
      setContentWriters(data);
    } catch (err: any) {
      console.error('Failed to load content writers:', err);
    }
  }, [makeApiCall, showToast, buildApiUrl]);

  const updateCourseStatus = useCallback(async (courseId: number, newStatus: string, adminNotes = '') => {
    try {
      setActionLoadingState(`course_${courseId}`, true);
      const data = await makeApiCall(buildApiUrl(`/courses/${courseId}/status`), {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, admin_notes: adminNotes })
      });
      setCourses(prev => prev.map(course => 
        course.id === courseId ? { ...course, status: newStatus } : course
      ));
      showToast('success', data.message || 'Course status updated successfully');
      setShowCourseStatusModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      console.error('Failed to update course status:', err);
      showToast('error', err.message || 'Failed to update course status');
    } finally {
      setActionLoadingState(`course_${courseId}`, false);
    }
  }, [makeApiCall, showToast, buildApiUrl, setActionLoadingState]);

  const deleteCourse = useCallback(async (courseId: number) => {
    try {
      setActionLoadingState(`delete_course_${courseId}`, true);
      const data = await makeApiCall(buildApiUrl(`/courses/${courseId}`), {
        method: 'DELETE'
      });
      setCourses(prev => prev.filter(course => course.id !== courseId));
      showToast('success', data.message || 'Course deleted successfully');
      setShowConfirmDialog(false);
    } catch (err: any) {
      console.error('Failed to delete course:', err);
      showToast('error', err.message || 'Failed to delete course');
    } finally {
      setActionLoadingState(`delete_course_${courseId}`, false);
    }
  }, [makeApiCall, showToast, buildApiUrl, setActionLoadingState]);

  // === ENHANCED USER MANAGEMENT FUNCTIONS ===

  const loadUserDetails = useCallback(async (userId: number) => {
    try {
      setActionLoadingState(`user_details_${userId}`, true);
      const data = await makeApiCall(buildApiUrl(`/users/${userId}`));
      setSelectedUserDetails(data);
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      showToast('error', err.message || 'Failed to load user details');
    } finally {
      setActionLoadingState(`user_details_${userId}`, false);
    }
  }, [makeApiCall, showToast, buildApiUrl, setActionLoadingState]);

  const loadUserStatistics = useCallback(async () => {
    try {
      const data = await makeApiCall(buildApiUrl('/users/statistics'));
      setUserStatistics(data);
    } catch (err: any) {
      console.error('Failed to load user statistics:', err);
    }
  }, [makeApiCall, showToast, buildApiUrl]);

  const createUser = useCallback(async (userData: any) => {
    try {
      setActionLoadingState('create_user', true);
      const data = await makeApiCall(buildApiUrl('/users/create'), {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      showToast('success', data.message || 'User created successfully');
      setShowCreateUserModal(false);
      loadUsers(1);
      setUserFormData({ name: '', phone_number: '', email: '', user_type: 'parent', password: '', is_active: true });
    } catch (err: any) {
      console.error('Failed to create user:', err);
      showToast('error', err.message || 'Failed to create user');
    } finally {
      setActionLoadingState('create_user', false);
    }
  }, [makeApiCall, showToast, buildApiUrl, setActionLoadingState, loadUsers]);

  const bulkUserAction = useCallback(async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      setActionLoadingState(`bulk_${action}`, true);
      
      if (action === 'export') {
        // Handle export locally
        const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
        const csvContent = [
          'ID,Name,Username,Email,Phone,Type,Status,Joined,Last Activity',
          ...selectedUserData.map(user => [
            user.id,
            user.name || '',
            user.username || '',
            user.email || '',
            user.phone_number || '',
            user.user_type || '',
            user.is_active ? 'Active' : 'Inactive',
            user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
            user.last_activity ? new Date(user.last_activity).toLocaleDateString() : ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        setShowBulkActionModal(false);
        setSelectedUsers([]);
        showToast('success', 'Users exported successfully');
        return;
      }

      const data = await makeApiCall(buildApiUrl('/users/bulk-action'), {
        method: 'POST',
        body: JSON.stringify({ user_ids: selectedUsers, action })
      });
      showToast('success', data.message || 'Bulk action completed');
      setShowBulkActionModal(false);
      setSelectedUsers([]);
      loadUsers(usersPagination.current_page);
      loadUserStatistics(); // Refresh statistics
    } catch (err: any) {
      showToast('error', err.message || 'Failed to perform bulk action');
    } finally {
      setActionLoadingState(`bulk_${action}`, false);
    }
  }, [selectedUsers, users, makeApiCall, showToast, buildApiUrl, setActionLoadingState, loadUsers, usersPagination.current_page, loadUserStatistics]);

  // Change User Role Function
  const changeUserRole = useCallback(async (userId: number, newRole: string) => {
    try {
      setActionLoadingState('change_role', true);
      const data = await makeApiCall(buildApiUrl(`/users/${userId}/change-role`), {
        method: 'PATCH',
        body: JSON.stringify({ user_type: newRole })
      });
      
      showToast('success', data.message || 'User role changed successfully');
      setShowChangeRoleModal(false);
      setSelectedUserForRoleChange(null);
      
      // Refresh users list and statistics
      loadUsers(usersPagination.current_page);
      loadUserStatistics();
      
      // Update the user in the current list if needed
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, user_type: newRole, updated_at: new Date().toISOString() }
            : user
        )
      );
    } catch (err: any) {
      showToast('error', err.message || 'Failed to change user role');
    } finally {
      setActionLoadingState('change_role', false);
    }
  }, [makeApiCall, showToast, buildApiUrl, setActionLoadingState, loadUsers, usersPagination.current_page, loadUserStatistics]);

  // === END ENHANCED USER MANAGEMENT FUNCTIONS ===

  // Enhanced action functions
  const toggleUserStatus = useCallback(async (userId: number, userName: string) => {
    const actionKey = `toggle-user-${userId}`;
    try {
      setActionLoadingState(actionKey, true);
      
      await makeApiCall(buildApiUrl(`/users/${userId}/toggle-status`), {
        method: 'PATCH'
      });
      
      showToast('success', `User ${userName} status updated successfully`);
      loadUsers(usersPagination.current_page);
      loadDashboardData(); // Refresh stats
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      showToast('error', err.message || 'Failed to update user status');
    } finally {
      setActionLoadingState(actionKey, false);
    }
  }, [makeApiCall, showToast, loadUsers, loadDashboardData, usersPagination.current_page, setActionLoadingState, buildApiUrl]);

  const approveContent = useCallback(async (contentId: number, contentTitle: string) => {
    const actionKey = `approve-content-${contentId}`;
    try {
      setActionLoadingState(actionKey, true);
      
      await makeApiCall(buildApiUrl(`/content/${contentId}/approve`), {
        method: 'PATCH'
      });
      
      showToast('success', `Content "${contentTitle}" approved and published successfully`);
      loadPendingContent();
      loadDashboardData(); // Refresh stats
    } catch (err: any) {
      console.error('Failed to approve content:', err);
      showToast('error', err.message || 'Failed to approve content');
    } finally {
      setActionLoadingState(actionKey, false);
    }
  }, [makeApiCall, showToast, loadPendingContent, loadDashboardData, setActionLoadingState, buildApiUrl]);

  const deleteUser = useCallback(async (userId: number, userName: string) => {
    const actionKey = `delete-user-${userId}`;
    try {
      setActionLoadingState(actionKey, true);
      
      await makeApiCall(buildApiUrl(`/users/${userId}`), {
        method: 'DELETE'
      });
      
      showToast('success', `User ${userName} deleted successfully`);
      loadUsers(usersPagination.current_page);
      loadDashboardData();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      showToast('error', err.message || 'Failed to delete user');
    } finally {
      setActionLoadingState(actionKey, false);
    }
  }, [makeApiCall, showToast, loadUsers, loadDashboardData, usersPagination.current_page, setActionLoadingState]);

  const rejectContent = useCallback(async (contentId: number, contentTitle: string) => {
    const actionKey = `reject-content-${contentId}`;
    try {
      setActionLoadingState(actionKey, true);
      
      await makeApiCall(buildApiUrl(`/content/${contentId}/reject`), {
        method: 'PATCH'
      });
      
      showToast('success', `Content "${contentTitle}" rejected successfully`);
      loadPendingContent();
    } catch (err: any) {
      console.error('Failed to reject content:', err);
      showToast('error', err.message || 'Failed to reject content');
    } finally {
      setActionLoadingState(actionKey, false);
    }
  }, [makeApiCall, showToast, loadPendingContent, setActionLoadingState]);

  // Enhanced effects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && user && !hasRole('admin')) {
      const correctRoute = getDashboardRoute();
      router.push(correctRoute);
      return;
    }
    
    if (!authLoading && user && hasRole('admin')) {
      loadDashboardData();
    }
  }, [user, authLoading, router, hasRole, getDashboardRoute, loadDashboardData]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'content') {
      loadPendingContent();
    } else if (activeTab === 'appointments') {
      loadAppointments();
    } else if (activeTab === 'logs') {
      loadSystemLogs();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadUsers, loadPendingContent, loadAppointments, loadSystemLogs, loadAnalytics]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'users') {
        loadUsers(1);
      } else if (activeTab === 'appointments') {
        loadAppointments(1);
      } else if (activeTab === 'logs') {
        loadSystemLogs(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.userType, filters.status, activeTab, loadUsers, loadAppointments, loadSystemLogs]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      userType: '',
      status: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  }, []);

  // Export Users Function
  const exportUsers = useCallback(async () => {
    try {
      setActionLoadingState('export_users', true);
      const csvContent = [
        'ID,Name,Username,Email,Phone,Type,Status,Joined,Last Activity',
        ...filteredUsers.map(user => [
          user.id,
          user.name || '',
          user.username || '',
          user.email || '',
          user.phone_number || '',
          user.user_type || '',
          user.is_active ? 'Active' : 'Inactive',
          user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
          user.last_activity ? new Date(user.last_activity).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast('success', 'All users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      showToast('error', 'Failed to export users');
    } finally {
      setActionLoadingState('export_users', false);
    }
  }, [filteredUsers, showToast, setActionLoadingState]);

  // Tab change handler
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, search: '', userType: '', status: '' }));
    
    // Load specific data for each tab
    if (tab === 'courses') {
      loadCourseStats();
      loadCourses();
      loadContentWriters();
    } else if (tab === 'users') {
      loadUserStatistics();
    }
  }, [loadCourseStats, loadCourses, loadContentWriters, loadUserStatistics]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number, type: 'users' | 'appointments' | 'logs') => {
    if (type === 'users') {
      loadUsers(page);
    } else if (type === 'appointments') {
      loadAppointments(page);
    } else if (type === 'logs') {
      loadSystemLogs(page);
    }
  }, [loadUsers, loadAppointments, loadSystemLogs]);

  // Enhanced loading and error components
  const LoadingSpinner = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
    const sizeClasses = {
      small: 'spinner-border-sm',
      default: '',
      large: 'spinner-border-lg'
    };

    return (
      <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  };

  const ToastContainer = () => (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`toast show border-0 bg-${toast.type === 'error' ? 'danger' : toast.type} text-white`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">
              <i className={`fas fa-${
                toast.type === 'success' ? 'check-circle' :
                toast.type === 'error' ? 'exclamation-circle' :
                toast.type === 'warning' ? 'exclamation-triangle' :
                'info-circle'
              } me-2`}></i>
              {toast.message}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white me-2 m-auto" 
              onClick={() => removeToast(toast.id)}
            ></button>
          </div>
        </div>
      ))}
    </div>
  );

  const ConfirmDialog = () => (
    showConfirmDialog && (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Action</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowConfirmDialog(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p>{confirmMessage}</p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => {
                  confirmAction();
                  setShowConfirmDialog(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const Pagination = ({ pagination, onPageChange, type }: { 
    pagination: PaginationInfo;
    onPageChange: (page: number) => void;
    type: string;
  }) => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.pages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <nav>
        <ul className="pagination justify-content-center">
          <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link"
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
            >
              Previous
            </button>
          </li>
          {pages.map(page => (
            <li key={page} className={`page-item ${page === pagination.current_page ? 'active' : ''}`}>
              <button 
                className="page-link"
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            </li>
          ))}
          <li className={`page-item ${pagination.current_page === pagination.pages ? 'disabled' : ''}`}>
            <button 
              className="page-link"
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.pages}
            >
              Next
            </button>
          </li>
        </ul>
        <div className="text-center text-muted">
          Showing page {pagination.current_page} of {pagination.pages} ({pagination.total} total {type})
        </div>
      </nav>
    );
  };

  // User Detail Modal
  const UserModal = () => (
    showUserModal && selectedUser && (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-user me-2"></i>
                User Details
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowUserModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card border-0">
                    <div className="card-body">
                      <h6 className="card-title">Basic Information</h6>
                      <dl className="row">
                        <dt className="col-sm-4">Name:</dt>
                        <dd className="col-sm-8">{selectedUser.name}</dd>
                        <dt className="col-sm-4">ID:</dt>
                        <dd className="col-sm-8">{selectedUser.id}</dd>
                        <dt className="col-sm-4">Phone:</dt>
                        <dd className="col-sm-8">{selectedUser.phone_number}</dd>
                        <dt className="col-sm-4">Email:</dt>
                        <dd className="col-sm-8">{selectedUser.email || 'Not provided'}</dd>
                        <dt className="col-sm-4">Type:</dt>
                        <dd className="col-sm-8">
                          <span className={`badge bg-${
                            selectedUser.user_type === 'admin' ? 'danger' : 
                            selectedUser.user_type === 'health_provider' ? 'warning' : 
                            selectedUser.user_type === 'content_writer' ? 'info' : 'primary'
                          }`}>
                            {formatUserType(selectedUser.user_type)}
                          </span>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-0">
                    <div className="card-body">
                      <h6 className="card-title">Activity Information</h6>
                      <dl className="row">
                        <dt className="col-sm-5">Status:</dt>
                        <dd className="col-sm-7">
                          <span className={`badge bg-${selectedUser.is_active ? 'success' : 'secondary'}`}>
                            <i className={`fas fa-${selectedUser.is_active ? 'check' : 'times'} me-1`}></i>
                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </dd>
                        <dt className="col-sm-5">Joined:</dt>
                        <dd className="col-sm-7">{formatDate(selectedUser.created_at)}</dd>
                        <dt className="col-sm-5">Last Activity:</dt>
                        <dd className="col-sm-7">
                          {selectedUser.last_activity ? formatDate(selectedUser.last_activity) : 'Never'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowUserModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className={`btn ${selectedUser.is_active ? 'btn-warning' : 'btn-success'}`}
                onClick={() => {
                  confirmActionDialog(
                    `Are you sure you want to ${selectedUser.is_active ? 'deactivate' : 'activate'} ${selectedUser.name}?`,
                    () => {
                      toggleUserStatus(selectedUser.id, selectedUser.name);
                      setShowUserModal(false);
                    }
                  );
                }}
              >
                <i className={`fas fa-${selectedUser.is_active ? 'pause' : 'play'} me-1`}></i>
                {selectedUser.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Content Review Modal
  const ContentModal = () => (
    showContentModal && selectedContent && (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-file-alt me-2"></i>
                Content Review: {selectedContent.title}
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowContentModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-8">
                  <div className="card border-0">
                    <div className="card-body">
                      <h6 className="card-title">Content Preview</h6>
                      <div className="bg-light p-3 rounded">
                        <h4>{selectedContent.title}</h4>
                        <p className="text-muted">
                          <strong>Category:</strong> {selectedContent.category} | 
                          <strong> Author:</strong> {selectedContent.author}
                        </p>
                        <div className="mt-3">
                          <h6>Summary:</h6>
                          <p>{selectedContent.summary}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0">
                    <div className="card-body">
                      <h6 className="card-title">Content Details</h6>
                      <dl className="row">
                        <dt className="col-sm-5">ID:</dt>
                        <dd className="col-sm-7">{selectedContent.id}</dd>
                        <dt className="col-sm-5">Created:</dt>
                        <dd className="col-sm-7">{formatDate(selectedContent.created_at)}</dd>
                        <dt className="col-sm-5">Status:</dt>
                        <dd className="col-sm-7">
                          <span className="badge bg-warning">Pending Review</span>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowContentModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => {
                  confirmActionDialog(
                    `Are you sure you want to reject "${selectedContent.title}"?`,
                    () => {
                      rejectContent(selectedContent.id, selectedContent.title);
                      setShowContentModal(false);
                    }
                  );
                }}
                disabled={actionLoading[`reject-content-${selectedContent.id}`]}
              >
                {actionLoading[`reject-content-${selectedContent.id}`] ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <i className="fas fa-times me-1"></i>
                    Reject
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  confirmActionDialog(
                    `Are you sure you want to approve and publish "${selectedContent.title}"?`,
                    () => {
                      approveContent(selectedContent.id, selectedContent.title);
                      setShowContentModal(false);
                    }
                  );
                }}
                disabled={actionLoading[`approve-content-${selectedContent.id}`]}
              >
                {actionLoading[`approve-content-${selectedContent.id}`] ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <i className="fas fa-check me-1"></i>
                    Approve & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Add login state
  const [loginForm, setLoginForm] = useState({ phone_number: '+1234567890', password: 'admin123' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const response = await fetch(buildAuthApiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_type', data.user_type);

      // Refresh the page to trigger auth context update
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Show login form if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="row justify-content-center w-100">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow border-0">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="fas fa-shield-alt text-primary fa-3x mb-3"></i>
                  <h2 className="h4 mb-0">Admin Login</h2>
                  <p className="text-muted">Access the Lady's Essence Admin Dashboard</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="phone_number" className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      id="phone_number"
                      value={loginForm.phone_number}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <small className="text-muted">
                    <strong>Default Admin Credentials:</strong><br />
                    Phone: +1234567890<br />
                    Password: admin123
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-3 text-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-3 text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <div>
            <strong>Error:</strong> {error}
            <div className="mt-2">
              <button 
                className="btn btn-outline-danger btn-sm"
                onClick={loadDashboardData}
              >
                <i className="fas fa-redo me-1"></i>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <ConfirmDialog />
      <UserModal />
      <ContentModal />
      
      <div className="container-fluid py-4">
        {/* Enhanced Header */}
        <div className="row align-items-center mb-4">
          <div className="col">
            <h1 className="h3 mb-0">
              <i className="fas fa-tachometer-alt text-primary me-2"></i>
              Admin Dashboard
            </h1>
            <p className="text-muted mb-0">Welcome back, {user?.name}</p>
          </div>
          <div className="col-auto">
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={loadDashboardData}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="fas fa-user-circle me-1"></i>
                {user?.name}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      router.push('/login');
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="card shadow-sm mb-4">
          <div className="card-body p-0">
            <nav className="nav nav-tabs border-0" style={{ borderRadius: '0.375rem 0.375rem 0 0' }}>
              {[
                { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
                { id: 'users', label: 'User Management', icon: 'fas fa-users' },
                { id: 'content', label: 'Content Review', icon: 'fas fa-file-alt' },
                { id: 'courses', label: 'Course Management', icon: 'fas fa-graduation-cap' },
                { id: 'appointments', label: 'Appointments', icon: 'fas fa-calendar-check' },
                { id: 'logs', label: 'System Logs', icon: 'fas fa-list-alt' },
                { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`nav-link border-0 px-4 py-3 ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  style={{ 
                    backgroundColor: activeTab === tab.id ? '#0d6efd' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#6c757d',
                    borderRadius: activeTab === tab.id ? '0.375rem 0.375rem 0 0' : '0'
                  }}
                >
                  <i className={`${tab.icon} me-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Loading Indicator */}
        {tabLoading && (
          <div className="text-center mb-3">
            <LoadingSpinner />
            <span className="ms-2 text-muted">Loading {activeTab}...</span>
          </div>
        )}

        {/* Enhanced Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Enhanced Statistics Cards */}
            <div className="row g-4 mb-4">
              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-1">{stats.users.total.toLocaleString()}</h2>
                        <p className="mb-0 opacity-75">Total Users</p>
                        <small className="opacity-75">
                          <i className="fas fa-arrow-up me-1"></i>
                          +{stats.users.new_today} today
                        </small>
                      </div>
                      <div className="opacity-75">
                        <i className="fas fa-users fa-2x"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-1">{stats.content.published.toLocaleString()}</h2>
                        <p className="mb-0 opacity-75">Published Content</p>
                        <small className="opacity-75">
                          <i className="fas fa-clock me-1"></i>
                          {stats.content.draft} pending
                        </small>
                      </div>
                      <div className="opacity-75">
                        <i className="fas fa-file-alt fa-2x"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-1">{stats.appointments.pending.toLocaleString()}</h2>
                        <p className="mb-0 opacity-75">Pending Appointments</p>
                        <small className="opacity-75">
                          <i className="fas fa-calendar me-1"></i>
                          {stats.appointments.total} total
                        </small>
                      </div>
                      <div className="opacity-75">
                        <i className="fas fa-calendar-check fa-2x"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-1">{stats.users.active.toLocaleString()}</h2>
                        <p className="mb-0 opacity-75">Active Users</p>
                        <small className="opacity-75">
                          <i className="fas fa-percentage me-1"></i>
                          {((stats.users.active / stats.users.total) * 100).toFixed(1)}% active
                        </small>
                      </div>
                      <div className="opacity-75">
                        <i className="fas fa-user-check fa-2x"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Charts Section */}
            <div className="row g-4 mb-4">
              <div className="col-lg-8">
                <div className="card shadow-sm">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">
                      <i className="fas fa-chart-line text-primary me-2"></i>
                      User Growth Trend
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      {stats.monthly_growth.reverse().map((month, index) => (
                        <div key={index} className="col">
                          <div className="mb-2">
                            <div 
                              className="bg-primary rounded-top mx-auto" 
                              style={{ 
                                height: `${Math.max(20, (month.users / Math.max(...stats.monthly_growth.map(m => m.users))) * 100)}px`,
                                width: '40px'
                              }}
                            ></div>
                            <div className="bg-light p-2 rounded-bottom">
                              <div className="fw-bold text-primary">{month.users}</div>
                              <small className="text-muted">{month.month}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">
                      <i className="fas fa-chart-pie text-success me-2"></i>
                      User Distribution
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-3">
                      {[
                        { type: 'Parents', count: stats.users.parents, color: '#0d6efd' },
                        { type: 'Adolescents', count: stats.users.adolescents, color: '#198754' },
                        { type: 'Content Writers', count: stats.users.content_writers, color: '#0dcaf0' },
                        { type: 'Health Providers', count: stats.users.health_providers, color: '#ffc107' }
                      ].map(item => (
                        <div key={item.type} className="d-flex align-items-center">
                          <div 
                            className="rounded me-3" 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              backgroundColor: item.color 
                            }}
                          ></div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted small">{item.type}</span>
                              <span className="fw-bold">{item.count}</span>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ 
                                  width: `${(item.count / stats.users.total) * 100}%`,
                                  backgroundColor: item.color
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">
                      <i className="fas fa-user-plus text-info me-2"></i>
                      Recent Users
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="list-group list-group-flush">
                      {stats.recent_users.map(user => (
                        <div key={user.id} className="list-group-item border-0 px-0 d-flex align-items-center">
                          <div className="avatar me-3">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <i className="fas fa-user text-white"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{user.name}</h6>
                            <small className="text-muted">
                              <span className={`badge badge-sm bg-${user.user_type === 'admin' ? 'danger' : 'primary'} me-2`}>
                                {formatUserType(user.user_type)}
                              </span>
                              {formatDate(user.created_at)}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">
                      <i className="fas fa-newspaper text-warning me-2"></i>
                      Recent Content
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="list-group list-group-flush">
                      {stats.recent_content.map(content => (
                        <div key={content.id} className="list-group-item border-0 px-0 d-flex align-items-center">
                          <div className="avatar me-3">
                            <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <i className="fas fa-file-alt text-white"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{content.title}</h6>
                            <small className="text-muted">
                              <span className={`badge badge-sm bg-${content.status === 'published' ? 'success' : 'secondary'} me-2`}>
                                {content.status}
                              </span>
                              {formatDate(content.created_at)}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* User Statistics Cards */}
            {userStatistics && (
              <div className="row g-4 mb-4">
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{userStatistics.overview.total_users}</h2>
                          <p className="mb-0 opacity-75">Total Users</p>
                          <small className="opacity-75">
                            <i className="fas fa-user-check me-1"></i>
                            {userStatistics.overview.active_users} active
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-users fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{userStatistics.overview.active_users}</h2>
                          <p className="mb-0 opacity-75">Active Users</p>
                          <small className="opacity-75">
                            <i className="fas fa-chart-line me-1"></i>
                            {((userStatistics.overview.active_users / userStatistics.overview.total_users) * 100).toFixed(1)}% active rate
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-user-check fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{userStatistics.user_types?.find((ut: any) => ut.type === 'parent')?.count || 0}</h2>
                          <p className="mb-0 opacity-75">Parents</p>
                          <small className="opacity-75">
                            <i className="fas fa-baby me-1"></i>
                            {userStatistics.user_types?.find((ut: any) => ut.type === 'adolescent')?.count || 0} adolescents
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-users-cog fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{userStatistics.user_types?.filter((ut: any) => ['content_writer', 'health_provider', 'admin'].includes(ut.type)).reduce((sum: number, ut: any) => sum + ut.count, 0) || 0}</h2>
                          <p className="mb-0 opacity-75">Staff</p>
                          <small className="opacity-75">
                            <i className="fas fa-user-tie me-1"></i>
                            Writers & Providers
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-user-tie fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Action Bar */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-md-3">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search users..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={filters.userType}
                      onChange={(e) => handleFilterChange('userType', e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="parent">Parents</option>
                      <option value="adolescent">Adolescents</option>
                      <option value="content_writer">Writers</option>
                      <option value="health_provider">Providers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-5">
                    <div className="btn-group w-100">
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateUserModal(true)}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Add User
                      </button>
                      <button
                        className="btn btn-outline-success"
                        onClick={exportUsers}
                        disabled={actionLoading.export_users}
                      >
                        <i className="fas fa-download me-2"></i>
                        Export
                      </button>
                      {selectedUsers.length > 0 && (
                        <button
                          className="btn btn-outline-warning"
                          onClick={() => setShowBulkActionModal(true)}
                        >
                          <i className="fas fa-tasks me-2"></i>
                          Bulk Action ({selectedUsers.length})
                        </button>
                      )}
                      <button
                        className="btn btn-outline-secondary"
                        onClick={clearFilters}
                      >
                        <i className="fas fa-times me-2"></i>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="card shadow-sm mb-4" style={{ display: 'none' }}>
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search users by name, phone, or email..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={filters.userType}
                      onChange={(e) => handleFilterChange('userType', e.target.value)}
                    >
                      <option value="">All User Types</option>
                      <option value="parent">Parents</option>
                      <option value="adolescent">Adolescents</option>
                      <option value="content_writer">Content Writers</option>
                      <option value="health_provider">Health Providers</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={clearFilters}
                    >
                      <i className="fas fa-times me-1"></i>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Users Table */}
            <div className="card shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="row align-items-center">
                  <div className="col">
                    <h5 className="mb-0">
                      <i className="fas fa-users me-2 text-primary"></i>
                      User Management
                    </h5>
                    <small className="text-muted">
                      {filteredUsers.length} of {users.length} users shown
                    </small>
                  </div>
                  <div className="col-auto">
                    {selectedUsers.length > 0 && (
                      <span className="badge bg-primary">
                        {selectedUsers.length} selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(filteredUsers.map(u => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                          />
                        </th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Last Active</th>
                        <th style={{ width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionLoading.load_users ? (
                        Array.from({ length: 5 }, (_, i) => (
                          <tr key={i}>
                            <td colSpan={7}>
                              <div className="d-flex align-items-center p-3">
                                <div className="spinner-border spinner-border-sm me-3" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                Loading users...
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">
                            <div className="text-muted">
                              <i className="fas fa-users fa-3x mb-3 opacity-25"></i>
                              <h5>No users found</h5>
                              <p>Try adjusting your filters or create a new user.</p>
                              <button 
                                className="btn btn-primary"
                                onClick={() => setShowCreateUserModal(true)}
                              >
                                <i className="fas fa-plus me-2"></i>
                                Add First User
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className={selectedUsers.includes(user.id) ? 'table-active' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-circle me-3" style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: user.user_type === 'admin' ? '#dc3545' : 
                                                 user.user_type === 'content_writer' ? '#198754' :
                                                 user.user_type === 'health_provider' ? '#0d6efd' :
                                                 user.user_type === 'parent' ? '#fd7e14' : '#6f42c1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}>
                                  {(user.name || user.username)?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="fw-semibold">{user.name || user.username}</div>
                                  <small className="text-muted">{user.email || user.phone_number}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                user.user_type === 'admin' ? 'bg-danger' :
                                user.user_type === 'content_writer' ? 'bg-success' :
                                user.user_type === 'health_provider' ? 'bg-primary' :
                                user.user_type === 'parent' ? 'bg-warning' : 'bg-info'
                              }`}>
                                <i className={`fas ${
                                  user.user_type === 'admin' ? 'fa-user-shield' :
                                  user.user_type === 'content_writer' ? 'fa-pen' :
                                  user.user_type === 'health_provider' ? 'fa-user-md' :
                                  user.user_type === 'parent' ? 'fa-users' : 'fa-user'
                                } me-1`}></i>
                                {formatUserType(user.user_type)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                <i className={`fas ${user.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(user.created_at)}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {user.last_activity ? formatDate(user.last_activity) : 'Never'}
                              </small>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => loadUserDetails(user.id)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => {
                                    setSelectedUserForRoleChange(user);
                                    setShowChangeRoleModal(true);
                                  }}
                                  title="Change Role"
                                >
                                  <i className="fas fa-user-cog"></i>
                                </button>
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedUsers([user.id]);
                                    setShowBulkActionModal(true);
                                  }}
                                  title="Quick Actions"
                                >
                                  <i className="fas fa-cog"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Pagination */}
            <div className="mt-4">
              <Pagination 
                pagination={usersPagination}
                onPageChange={(page) => handlePageChange(page, 'users')}
                type="users"
              />
            </div>
          </div>
        )}

        {/* Enhanced Content Review Tab */}
        {activeTab === 'content' && (
          <div>
            <div className="card shadow-sm">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-file-alt text-warning me-2"></i>
                  Content Pending Review
                </h5>
                <span className="badge bg-warning">
                  {pendingContent.length} pending
                </span>
              </div>
              <div className="card-body p-0">
                {pendingContent.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">Content</th>
                          <th className="border-0">Author</th>
                          <th className="border-0">Category</th>
                          <th className="border-0">Summary</th>
                          <th className="border-0">Created</th>
                          <th className="border-0 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingContent.map(content => (
                          <tr key={content.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-3">
                                  <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    <i className="fas fa-file-alt text-white"></i>
                                  </div>
                                </div>
                                <div>
                                  <h6 className="mb-0">{content.title}</h6>
                                  <small className="text-muted">ID: {content.id}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="fw-medium">{content.author}</div>
                            </td>
                            <td>
                              <span className="badge bg-info">{content.category}</span>
                            </td>
                            <td>
                              <div style={{ maxWidth: '300px' }}>
                                <p className="mb-0 text-truncate" title={content.summary}>
                                  {content.summary?.substring(0, 100)}
                                  {content.summary?.length > 100 && '...'}
                                </p>
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(content.created_at)}
                              </small>
                            </td>
                            <td className="text-end">
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => confirmActionDialog(
                                    `Are you sure you want to approve and publish "${content.title}"?`,
                                    () => approveContent(content.id, content.title)
                                  )}
                                  disabled={actionLoading[`approve-content-${content.id}`]}
                                  title="Approve and Publish"
                                >
                                  {actionLoading[`approve-content-${content.id}`] ? (
                                    <LoadingSpinner size="small" />
                                  ) : (
                                    <i className="fas fa-check"></i>
                                  )}
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => {
                                    setSelectedContent(content);
                                    setShowContentModal(true);
                                  }}
                                  title="Review Content"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => confirmActionDialog(
                                    `Are you sure you want to reject "${content.title}"?`,
                                    () => rejectContent(content.id, content.title)
                                  )}
                                  disabled={actionLoading[`reject-content-${content.id}`]}
                                  title="Reject Content"
                                >
                                  {actionLoading[`reject-content-${content.id}`] ? (
                                    <LoadingSpinner size="small" />
                                  ) : (
                                    <i className="fas fa-times"></i>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h5 className="text-muted">All caught up!</h5>
                    <p className="text-muted mb-0">No content pending review at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Course Management Tab */}
        {activeTab === 'courses' && (
          <div>
            {/* Course Statistics Cards */}
            {courseStats && courseStats.overview && (
              <div className="row g-4 mb-4">
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{courseStats.overview.total_courses || 0}</h2>
                          <p className="mb-0 opacity-75">Total Courses</p>
                          <small className="opacity-75">
                            <i className="fas fa-clock me-1"></i>
                            {courseStats.overview.draft_courses || 0} draft courses
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-graduation-cap fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{courseStats.overview.published_courses || 0}</h2>
                          <p className="mb-0 opacity-75">Published</p>
                          <small className="opacity-75">
                            <i className="fas fa-chart-line me-1"></i>
                            Active courses
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-check-circle fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{courseStats.overview.total_modules || 0}</h2>
                          <p className="mb-0 opacity-75">Total Modules</p>
                          <small className="opacity-75">
                            <i className="fas fa-book me-1"></i>
                            Course modules
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-book fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                    <div className="card-body text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="mb-1">{courseStats.overview.total_chapters || 0}</h2>
                          <p className="mb-0 opacity-75">Total Chapters</p>
                          <small className="opacity-75">
                            <i className="fas fa-layer-group me-1"></i>
                            Course chapters
                          </small>
                        </div>
                        <div className="opacity-75">
                          <i className="fas fa-layer-group fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Course Filters and Search */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search courses..."
                        value={courseFilters.search}
                        onChange={(e) => setCourseFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={courseFilters.status}
                      onChange={(e) => setCourseFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="published">Published</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={courseFilters.level}
                      onChange={(e) => setCourseFilters(prev => ({ ...prev, level: e.target.value }))}
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={courseFilters.sort_by}
                      onChange={(e) => setCourseFilters(prev => ({ ...prev, sort_by: e.target.value }))}
                    >
                      <option value="created_at">Created Date</option>
                      <option value="title">Title</option>
                      <option value="status">Status</option>
                      <option value="views">Views</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => loadCourses(1)}
                    >
                      <i className="fas fa-filter me-2"></i>
                      Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Table */}
            <div className="card shadow-sm">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-graduation-cap text-primary me-2"></i>
                  Course Management
                </h5>
                <span className="badge bg-primary">
                  {coursesPagination.total} courses
                </span>
              </div>
              <div className="card-body p-0">
                {courses.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">Course</th>
                          <th className="border-0">Author</th>
                          <th className="border-0">Level</th>
                          <th className="border-0">Status</th>
                          <th className="border-0">Performance</th>
                          <th className="border-0">Created</th>
                          <th className="border-0 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(course => (
                          <tr key={course.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-3">
                                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    <i className="fas fa-graduation-cap text-white"></i>
                                  </div>
                                </div>
                                <div>
                                  <h6 className="mb-0">{course.title}</h6>
                                  <small className="text-muted">
                                    {course.modules_count} modules • {course.duration}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="fw-medium">{course.author_name}</div>
                              <small className="text-muted">{course.category_name || 'Uncategorized'}</small>
                            </td>
                            <td>
                              <span className={`badge ${
                                course.level === 'beginner' ? 'bg-success' :
                                course.level === 'intermediate' ? 'bg-warning' : 'bg-danger'
                              }`}>
                                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                course.status === 'published' ? 'bg-success' :
                                course.status === 'pending_review' ? 'bg-warning' :
                                course.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {course.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex flex-column">
                                <small><i className="fas fa-eye me-1"></i>{course.views} views</small>
                                <small><i className="fas fa-heart me-1"></i>{course.likes} likes</small>
                                <small><i className="fas fa-star me-1"></i>{course.rating.toFixed(1)} rating</small>
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(course.created_at)}
                              </small>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setShowCourseModal(true);
                                  }}
                                  disabled={actionLoading[`course_${course.id}`]}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setShowCourseStatusModal(true);
                                  }}
                                  disabled={actionLoading[`course_${course.id}`]}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setConfirmAction(() => () => deleteCourse(course.id));
                                    setConfirmMessage(`Are you sure you want to delete the course "${course.title}"? This action cannot be undone.`);
                                    setShowConfirmDialog(true);
                                  }}
                                  disabled={actionLoading[`delete_course_${course.id}`]}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No courses found</h5>
                    <p className="text-muted mb-0">No courses match your current filters.</p>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {coursesPagination.pages > 1 && (
                <div className="card-footer bg-transparent border-0">
                  <nav>
                    <ul className="pagination justify-content-center mb-0">
                      <li className={`page-item ${!coursesPagination.has_prev ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => loadCourses(coursesPagination.current_page - 1)}
                          disabled={!coursesPagination.has_prev}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: coursesPagination.pages }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${page === coursesPagination.current_page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => loadCourses(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${!coursesPagination.has_next ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => loadCourses(coursesPagination.current_page + 1)}
                          disabled={!coursesPagination.has_next}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            {/* Filter Controls */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-filter"></i>
                      </span>
                      <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Appointments</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 text-end">
                    <span className="badge bg-secondary">
                      {appointmentsPagination.total} total appointments
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="card shadow-sm">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0">
                  <i className="fas fa-calendar-check text-primary me-2"></i>
                  Appointment Management
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0">Patient</th>
                        <th className="border-0">Issue</th>
                        <th className="border-0">Dates</th>
                        <th className="border-0">Provider</th>
                        <th className="border-0">Priority</th>
                        <th className="border-0">Status</th>
                        <th className="border-0">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(appointment => (
                        <tr key={appointment.id}>
                          <td>
                            <div>
                              <h6 className="mb-0">{appointment.user_name}</h6>
                              <small className="text-muted">{appointment.user_phone}</small>
                            </div>
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px' }}>
                              <p className="mb-0 text-truncate" title={appointment.issue}>
                                {appointment.issue.substring(0, 50)}
                                {appointment.issue.length > 50 && '...'}
                              </p>
                            </div>
                          </td>
                          <td>
                            <div>
                              <small className="text-muted d-block">
                                <strong>Preferred:</strong> {
                                  appointment.preferred_date ? 
                                  new Date(appointment.preferred_date).toLocaleDateString() : 
                                  'Not specified'
                                }
                              </small>
                              <small className="text-muted d-block">
                                <strong>Scheduled:</strong> {
                                  appointment.appointment_date ? 
                                  new Date(appointment.appointment_date).toLocaleDateString() : 
                                  'Not scheduled'
                                }
                              </small>
                            </div>
                          </td>
                          <td>
                            {appointment.provider ? (
                              <span className="badge bg-success">{appointment.provider}</span>
                            ) : (
                              <span className="badge bg-secondary">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge bg-${
                              appointment.priority === 'urgent' ? 'danger' : 
                              appointment.priority === 'high' ? 'warning' : 
                              appointment.priority === 'medium' ? 'info' : 'secondary'
                            }`}>
                              <i className={`fas fa-${
                                appointment.priority === 'urgent' ? 'exclamation-triangle' :
                                appointment.priority === 'high' ? 'arrow-up' :
                                appointment.priority === 'medium' ? 'minus' : 'arrow-down'
                              } me-1`}></i>
                              {appointment.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${
                              appointment.status === 'confirmed' ? 'success' : 
                              appointment.status === 'pending' ? 'warning' : 
                              appointment.status === 'cancelled' ? 'danger' : 'secondary'
                            }`}>
                              <i className={`fas fa-${
                                appointment.status === 'confirmed' ? 'check' :
                                appointment.status === 'pending' ? 'clock' :
                                appointment.status === 'cancelled' ? 'times' : 'question'
                              } me-1`}></i>
                              {appointment.status}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(appointment.created_at)}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {appointments.length === 0 && !tabLoading && (
                  <div className="text-center py-5">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No appointments found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pagination */}
            <div className="mt-4">
              <Pagination 
                pagination={appointmentsPagination}
                onPageChange={(page) => handlePageChange(page, 'appointments')}
                type="appointments"
              />
            </div>
          </div>
        )}

        {/* Enhanced System Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            {/* Search Controls */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-md-8">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search logs by action..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <span className="badge bg-secondary">
                      {logsPagination.total} total logs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Logs Table */}
            <div className="card shadow-sm">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0">
                  <i className="fas fa-list-alt text-info me-2"></i>
                  System Activity Logs
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0">User</th>
                        <th className="border-0">Action</th>
                        <th className="border-0">Details</th>
                        <th className="border-0">IP Address</th>
                        <th className="border-0">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.map(log => (
                        <tr key={log.id}>
                          <td>
                            <div className="fw-medium">{log.user_name}</div>
                          </td>
                          <td>
                            <span className="badge bg-primary">{log.action}</span>
                          </td>
                          <td>
                            <div style={{ maxWidth: '300px' }}>
                              <small className="text-muted text-truncate d-block" title={log.details}>
                                {log.details}
                              </small>
                            </div>
                          </td>
                          <td>
                            <code className="small">{log.ip_address}</code>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(log.created_at)}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {systemLogs.length === 0 && !tabLoading && (
                  <div className="text-center py-5">
                    <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No logs found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pagination */}
            <div className="mt-4">
              <Pagination 
                pagination={logsPagination}
                onPageChange={(page) => handlePageChange(page, 'logs')}
                type="logs"
              />
            </div>
          </div>
        )}

        {/* Enhanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            {/* Analytics Controls */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-chart-bar"></i>
                      </span>
                      <select
                        className="form-select"
                        onChange={(e) => loadAnalytics(e.target.value)}
                      >
                        <option value="user_activity">User Activity</option>
                        <option value="content_performance">Content Performance</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 text-end">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => loadAnalytics()}
                    >
                      <i className="fas fa-sync-alt me-1"></i>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Display */}
            <div className="card shadow-sm">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0">
                  <i className="fas fa-chart-line text-success me-2"></i>
                  Analytics Dashboard
                </h5>
              </div>
              <div className="card-body">
                {analytics ? (
                  <div>
                    <h6 className="text-muted mb-3">
                      {analytics.report_type.replace('_', ' ').toUpperCase()} REPORT
                    </h6>
                    <div className="row">
                      {analytics.data.map((item, index) => (
                        <div key={index} className="col-md-4 mb-3">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h4 className="text-primary">
                                {typeof item.count === 'number' ? item.count : 
                                 typeof item.views === 'number' ? item.views : 
                                 JSON.stringify(item)}
                              </h4>
                              <small className="text-muted">
                                {item.date || item.title || `Item ${index + 1}`}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <p className="text-muted">Loading analytics data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Modals */}
      {showCourseModal && selectedCourse && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Course Details: {selectedCourse.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCourseModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <p><strong>Description:</strong> {selectedCourse.description}</p>
                    <p><strong>Level:</strong> {selectedCourse.level}</p>
                    <p><strong>Duration:</strong> {selectedCourse.duration}</p>
                    <p><strong>Modules:</strong> {selectedCourse.modules_count}</p>
                  </div>
                  <div className="col-md-4">
                    <p><strong>Views:</strong> {selectedCourse.views}</p>
                    <p><strong>Likes:</strong> {selectedCourse.likes}</p>
                    <p><strong>Rating:</strong> {selectedCourse.rating}</p>
                    <p><strong>Author:</strong> {selectedCourse.author_name}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCourseStatusModal && selectedCourse && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Course Status</h5>
                <button type="button" className="btn-close" onClick={() => setShowCourseStatusModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Status: <span className="badge bg-info">{selectedCourse.status}</span></label>
                </div>
                <div className="mb-3">
                  <label className="form-label">New Status</label>
                  <select className="form-select" onChange={(e) => {
                    if (e.target.value) {
                      updateCourseStatus(selectedCourse.id, e.target.value);
                    }
                  }}>
                    <option value="">Select status...</option>
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseStatusModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Management Modals */}
      
      {/* User Details Modal */}
      {showUserDetailsModal && selectedUserDetails && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-circle me-2"></i>
                  User Details: {selectedUserDetails.name || selectedUserDetails.username}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUserDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <div className="avatar-circle mx-auto mb-3" style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: selectedUserDetails.user_type === 'admin' ? '#dc3545' : 
                                         selectedUserDetails.user_type === 'content_writer' ? '#198754' :
                                         selectedUserDetails.user_type === 'health_provider' ? '#0d6efd' :
                                         selectedUserDetails.user_type === 'parent' ? '#fd7e14' : '#6f42c1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}>
                          {(selectedUserDetails.name || selectedUserDetails.username)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h5>{selectedUserDetails.name || selectedUserDetails.username}</h5>
                        <p className="text-muted mb-2">{selectedUserDetails.email}</p>
                        <span className={`badge ${
                          selectedUserDetails.user_type === 'admin' ? 'bg-danger' :
                          selectedUserDetails.user_type === 'content_writer' ? 'bg-success' :
                          selectedUserDetails.user_type === 'health_provider' ? 'bg-primary' :
                          selectedUserDetails.user_type === 'parent' ? 'bg-warning' : 'bg-info'
                        } mb-2`}>
                          {selectedUserDetails.user_type?.replace('_', ' ').toUpperCase()}
                        </span>
                        <br />
                        <span className={`badge ${selectedUserDetails.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {selectedUserDetails.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title">User Information</h6>
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td><strong>User ID:</strong></td>
                              <td>{selectedUserDetails.id}</td>
                            </tr>
                            <tr>
                              <td><strong>Phone:</strong></td>
                              <td>{selectedUserDetails.phone_number || 'Not provided'}</td>
                            </tr>
                            <tr>
                              <td><strong>Joined:</strong></td>
                              <td>{selectedUserDetails.created_at ? new Date(selectedUserDetails.created_at).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                            <tr>
                              <td><strong>Last Login:</strong></td>
                              <td>{selectedUserDetails.last_login ? new Date(selectedUserDetails.last_login).toLocaleDateString() : 'Never'}</td>
                            </tr>
                            <tr>
                              <td><strong>Activity Count:</strong></td>
                              <td>{selectedUserDetails.activity_count || 0} activities</td>
                            </tr>
                            <tr>
                              <td><strong>Preferences:</strong></td>
                              <td>
                                {selectedUserDetails.preferences ? (
                                  <span className="badge bg-light text-dark">
                                    {JSON.stringify(selectedUserDetails.preferences)}
                                  </span>
                                ) : 'None set'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserDetailsModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  setSelectedUsers([selectedUserDetails.id]);
                  setShowUserDetailsModal(false);
                  setShowBulkActionModal(true);
                }}>
                  <i className="fas fa-cog me-2"></i>
                  Quick Actions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-plus me-2"></i>
                  Create New User
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateUserModal(false)}></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const userData = {
                  username: formData.get('username') as string,
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
                  user_type: formData.get('user_type') as string,
                  name: formData.get('name') as string,
                  phone_number: formData.get('phone_number') as string,
                };
                createUser(userData);
              }}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Username *</label>
                      <input type="text" className="form-control" name="username" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" name="name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input type="email" className="form-control" name="email" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input type="tel" className="form-control" name="phone_number" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Password *</label>
                      <input type="password" className="form-control" name="password" required minLength={6} />
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">User Type *</label>
                      <select className="form-select" name="user_type" required>
                        <option value="">Select user type...</option>
                        <option value="parent">Parent</option>
                        <option value="adolescent">Adolescent</option>
                        <option value="content_writer">Content Writer</option>
                        <option value="health_provider">Health Provider</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading.create_user}>
                    {actionLoading.create_user ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-tasks me-2"></i>
                  Bulk Actions
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBulkActionModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}. 
                  Choose an action to perform:
                </p>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-success"
                    onClick={() => bulkUserAction('activate')}
                    disabled={actionLoading.bulk_activate}
                  >
                    {actionLoading.bulk_activate ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Activating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        Activate Users
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => bulkUserAction('deactivate')}
                    disabled={actionLoading.bulk_deactivate}
                  >
                    {actionLoading.bulk_deactivate ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-pause-circle me-2"></i>
                        Deactivate Users
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-info"
                    onClick={() => bulkUserAction('export')}
                    disabled={actionLoading.bulk_export}
                  >
                    {actionLoading.bulk_export ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-download me-2"></i>
                        Export Selected
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      // Show bulk role change options
                      setBulkAction('change_role');
                      setShowBulkActionModal(false);
                      // You could show another modal for role selection here
                    }}
                    disabled={actionLoading.bulk_change_role}
                  >
                    {actionLoading.bulk_change_role ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Changing Roles...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-users-cog me-2"></i>
                        Bulk Role Change
                      </>
                    )}
                  </button>
                  <hr />
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => bulkUserAction('delete')}
                    disabled={actionLoading.bulk_delete}
                  >
                    {actionLoading.bulk_delete ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash me-2"></i>
                        Delete Users
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkActionModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showChangeRoleModal && selectedUserForRoleChange && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-cog me-2"></i>
                  Change User Role
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowChangeRoleModal(false)}></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const newRole = formData.get('new_role') as string;
                changeUserRole(selectedUserForRoleChange.id, newRole);
              }}>
                <div className="modal-body">
                  <div className="text-center mb-4">
                    <div className="avatar-circle mx-auto mb-3" style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: selectedUserForRoleChange.user_type === 'admin' ? '#dc3545' : 
                                     selectedUserForRoleChange.user_type === 'content_writer' ? '#198754' :
                                     selectedUserForRoleChange.user_type === 'health_provider' ? '#0d6efd' :
                                     selectedUserForRoleChange.user_type === 'parent' ? '#fd7e14' : '#6f42c1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}>
                      {(selectedUserForRoleChange.name || selectedUserForRoleChange.username)?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h6>{selectedUserForRoleChange.name || selectedUserForRoleChange.username}</h6>
                    <p className="text-muted mb-0">{selectedUserForRoleChange.email}</p>
                  </div>

                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> Changing a user's role will affect their permissions and access to features.
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Current Role</label>
                    <div className="form-control-plaintext">
                      <span className={`badge ${
                        selectedUserForRoleChange.user_type === 'admin' ? 'bg-danger' :
                        selectedUserForRoleChange.user_type === 'content_writer' ? 'bg-success' :
                        selectedUserForRoleChange.user_type === 'health_provider' ? 'bg-primary' :
                        selectedUserForRoleChange.user_type === 'parent' ? 'bg-warning' : 'bg-info'
                      }`}>
                        <i className={`fas ${
                          selectedUserForRoleChange.user_type === 'admin' ? 'fa-user-shield' :
                          selectedUserForRoleChange.user_type === 'content_writer' ? 'fa-pen' :
                          selectedUserForRoleChange.user_type === 'health_provider' ? 'fa-user-md' :
                          selectedUserForRoleChange.user_type === 'parent' ? 'fa-users' : 'fa-user'
                        } me-1`}></i>
                        {formatUserType(selectedUserForRoleChange.user_type)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">New Role *</label>
                    <select className="form-select" name="new_role" required defaultValue={selectedUserForRoleChange.user_type}>
                      <option value="parent">
                        👨‍👩‍👧‍👦 Parent - Can manage adolescent accounts and access parental features
                      </option>
                      <option value="adolescent">
                        👧 Adolescent - Standard user with access to health tracking features
                      </option>
                      <option value="content_writer">
                        ✍️ Content Writer - Can create and manage educational content
                      </option>
                      <option value="health_provider">
                        👨‍⚕️ Health Provider - Can manage appointments and provide medical guidance
                      </option>
                      <option value="admin">
                        🛡️ Admin - Full system access and user management capabilities
                      </option>
                    </select>
                    <small className="text-muted">
                      Select the new role for this user. This will immediately change their permissions.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowChangeRoleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={actionLoading.change_role}>
                    {actionLoading.change_role ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Changing Role...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-cog me-2"></i>
                        Change Role
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
