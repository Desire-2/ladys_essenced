'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import api from '../lib/api/client';

// Create auth context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
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
              profileData = await makeAuthenticatedRequest('/api/auth/profile');
              break;
            case 'content_writer':
              profileData = await makeAuthenticatedRequest('/api/content-writer/profile');
              break;
            case 'health_provider':
              profileData = await makeAuthenticatedRequest('/api/health-provider/profile');
              break;
            default:
              // For regular users (parent, adolescent), use basic auth profile endpoint
              profileData = await makeAuthenticatedRequest('/api/auth/profile');
              break;
          }

          setUser({
            ...profileData,
            user_type: userType,
            user_id: localStorage.getItem('user_id')
          });
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_type');
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
      
      const { token, refresh_token, user_id, user_type } = await response.json();

      // Store tokens in localStorage with consistent naming
      localStorage.setItem('access_token', token);
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
            'Authorization': `Bearer ${token}`,
          },
          signal: profileController.signal
        });
        
        clearTimeout(profileTimeoutId);
        
        if (profileResponse.ok) {
          profileData = await profileResponse.json();
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
      switch (userType) {
        case 'admin':
          profileData = await makeAuthenticatedRequest('/api/auth/profile');
          break;
        case 'content_writer':
          profileData = await makeAuthenticatedRequest('/api/content-writer/profile');
          break;
        case 'health_provider':
          profileData = await makeAuthenticatedRequest('/api/health-provider/profile');
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
      default:
        return '/dashboard';
    }
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
      makeAuthenticatedRequest
    }}>
      {children}
    </AuthContext.Provider>
  );
};