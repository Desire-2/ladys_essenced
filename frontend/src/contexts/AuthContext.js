'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import api from '../lib/api/client';

// Create auth context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// API Base URL - use environment variable in production, relative path in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
  : '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, logout user
        logout();
        throw new Error('Authentication expired');
      }
      const errorText = await response.text();
      console.error(`API Error: ${response.status}`, errorText);
      
      // For non-401 errors, throw a different error that won't trigger logout
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Expected JSON but received:`, text.substring(0, 200));
      throw new Error(`Expected JSON response but received: ${contentType || 'unknown content type'}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error('JSON parse error:', parseError, 'Response text:', text.substring(0, 200));
      throw new Error('Invalid JSON response from server');
    }
  };

  // Check if user is logged in on initial load and fetch profile based on user type
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const userType = localStorage.getItem('user_type');
      
      if (token && userType) {
        try {
          let profileData = null;
          
          // Fetch profile based on user type
          switch (userType) {
            case 'admin':
              // For admin, use basic auth profile (no separate admin profile endpoint exists)
              console.log('Fetching admin profile from /api/auth/profile');
              profileData = await makeAuthenticatedRequest('/api/auth/profile');
              console.log('Admin profile data received:', profileData);
              break;
            case 'content_writer':
              const writerResponse = await makeAuthenticatedRequest('/api/content-writer/profile');
              profileData = writerResponse.profile || writerResponse; // Handle nested profile
              break;
            case 'health_provider':
              const providerResponse = await makeAuthenticatedRequest('/api/health-provider/profile');
              profileData = providerResponse.profile || providerResponse; // Handle nested profile
              break;
            default:
              // For regular users (parent, adolescent), use basic auth profile endpoint
              profileData = await makeAuthenticatedRequest('/api/auth/profile');
              break;
          }

          console.log('Setting user with profile data:', profileData);
          setUser({
            ...profileData,
            user_type: userType,
            user_id: localStorage.getItem('user_id')
          });
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          console.error('Error message:', err.message);
          // Only clear tokens if it's an authentication error
          // Don't logout for other errors (like 404 route not found)
          if (err.message === 'Authentication expired') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_type');
          } else {
            // For other errors, keep the user logged in with stored data
            setUser({
              user_id: localStorage.getItem('user_id'),
              user_type: userType,
              name: 'User', // Fallback data
            });
          }
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);
  
  // Login function with timeout and better error handling
  const login = async (credentials) => {
    try {
      setError(null);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }
      
      const { token, access_token, refresh_token, user_id, user_type } = await response.json();
      
      // Use access_token if available, otherwise fall back to token (for backward compatibility)
      const actualToken = access_token || token;
      
      // Store tokens in localStorage with consistent naming
      localStorage.setItem('access_token', actualToken);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('user_type', user_type);

      // Fetch full user profile based on user type with timeout
      let profileData = null;
      const profileController = new AbortController();
      const profileTimeoutId = setTimeout(() => profileController.abort(), 5000);
      
      try {
        let profileEndpoint;
        switch (user_type) {
          case 'admin':
            profileEndpoint = '/api/auth/profile';
            break;
          case 'content_writer':
            profileEndpoint = '/api/content-writer/profile';
            break;
          case 'health_provider':
            profileEndpoint = '/api/health-provider/profile';
            break;
          default:
            profileEndpoint = '/api/auth/profile';
            break;
        }
        
        const profileResponse = await fetch(`${API_BASE_URL}${profileEndpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${actualToken}`,
          },
          signal: profileController.signal
        });
        
        clearTimeout(profileTimeoutId);
        
        if (profileResponse.ok) {
          const rawProfileData = await profileResponse.json();
          // Handle nested profile data for content_writer and health_provider
          profileData = rawProfileData.profile || rawProfileData;
        } else {
          console.warn('Profile fetch failed, using basic user data');
          profileData = { user_id, user_type };
        }
      } catch (profileErr) {
        console.warn('Profile fetch error:', profileErr.message);
        profileData = { user_id, user_type };
      }

      setUser({
        ...profileData,
        user_type: user_type,
        user_id: user_id
      });

      return { success: true };
    } catch (err) {
      if (err.name === 'AbortError') {
        const errorMessage = 'Login timeout - please try again';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.auth.register(userData);
      return { success: true, userId: response.user_id };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    setUser(null);
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const userType = localStorage.getItem('user_type');
      
      // Update profile based on user type
      switch (userType) {
        case 'content_writer':
          await api.contentWriter.updateProfile(userData);
          break;
        case 'health_provider':
          await api.healthProvider.updateProfile(userData);
          break;
        default:
          // For regular users and admin, use basic auth profile update
          await makeAuthenticatedRequest('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
          });
          break;
      }

      // Refresh user data
      let profileData = null;
      let rawData = null;
      switch (userType) {
        case 'admin':
          profileData = await makeAuthenticatedRequest('/api/auth/profile');
          break;
        case 'content_writer':
          rawData = await makeAuthenticatedRequest('/api/content-writer/profile');
          profileData = rawData.profile || rawData;
          break;
        case 'health_provider':
          rawData = await makeAuthenticatedRequest('/api/health-provider/profile');
          profileData = rawData.profile || rawData;
          break;
        default:
          profileData = await makeAuthenticatedRequest('/api/auth/profile');
          break;
      }

      setUser({
        ...profileData,
        user_type: userType,
        user_id: localStorage.getItem('user_id')
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Helper function to check user permissions
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Define permissions based on user type
    const permissions = {
      admin: ['view_analytics', 'manage_users', 'manage_content', 'manage_appointments', 'view_logs'],
      content_writer: ['create_content', 'edit_content', 'submit_content'],
      health_provider: ['view_appointments', 'manage_appointments', 'view_patients'],
      parent: ['view_profile', 'manage_children', 'book_appointments'],
      adolescent: ['view_profile', 'log_cycles', 'log_meals', 'view_content']
    };

    return permissions[user.user_type]?.includes(permission) || false;
  };

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    return user?.user_type === role;
  };

  // Helper function to get user's full name or display name
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.name || user.full_name || 'User';
  };

  // Helper function to get dashboard route based on user type
  const getDashboardRoute = () => {
    if (!user) return '/';
    
    switch (user.user_type) {
      case 'admin':
        return '/admin';
      case 'content_writer':
        return '/content-writer';
      case 'health_provider':
        return '/health-provider';
      case 'parent':
        // If parent has no children, redirect to collect/onboarding page
        if (user.children && user.children.length === 0) {
          return '/dashboard/parent/collect';
        }
        return '/dashboard/parent';
      case 'adolescent':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  // Helper function to allow parent access to child's account
  const accessChildAccount = (childUserId) => {
    if (user?.user_type !== 'parent') {
      console.error('Only parents can access child accounts');
      return false;
    }

    // Store the accessed child ID for the parent
    localStorage.setItem('accessed_child_id', childUserId);
    return true;
  };

  // Helper function to get accessed child ID if parent is accessing a child's account
  const getAccessedChildId = () => {
    if (user?.user_type !== 'parent') return null;
    return localStorage.getItem('accessed_child_id');
  };

  // Helper function to clear accessed child account
  const clearChildAccess = () => {
    localStorage.removeItem('accessed_child_id');
  };

  // Helper function to check if parent is currently accessing a child account
  const isAccessingChildAccount = () => {
    return user?.user_type === 'parent' && !!localStorage.getItem('accessed_child_id');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      updateProfile,
      hasPermission,
      hasRole,
      getUserDisplayName,
      getDashboardRoute,
      makeAuthenticatedRequest,
      accessChildAccount,
      getAccessedChildId,
      clearChildAccess,
      isAccessingChildAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};