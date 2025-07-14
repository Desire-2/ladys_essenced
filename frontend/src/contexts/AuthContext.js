'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../api/index';

// Create auth context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// API Base URL - use environment variable in production, empty for relative URLs in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
  : ''; // Empty string for relative URLs in development to use Next.js proxy

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('makeAuthenticatedRequest: No authentication token');
      throw new Error('No authentication token');
    }

    console.log('makeAuthenticatedRequest: Making request to:', endpoint);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    console.log('makeAuthenticatedRequest: Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('makeAuthenticatedRequest: Token expired or invalid, logging out user');
        // Token expired or invalid, logout user
        logout();
        throw new Error('Authentication expired');
      }
      const errorText = await response.text();
      console.error(`makeAuthenticatedRequest: API Error: ${response.status}`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`makeAuthenticatedRequest: Expected JSON but received:`, text.substring(0, 200));
      throw new Error(`Expected JSON response but received: ${contentType || 'unknown content type'}`);
    }

    try {
      const result = await response.json();
      console.log('makeAuthenticatedRequest: Success, received data:', result);
      return result;
    } catch (parseError) {
      const text = await response.text();
      console.error('makeAuthenticatedRequest: JSON parse error:', parseError, 'Response text:', text.substring(0, 200));
      throw new Error('Invalid JSON response from server');
    }
  };

  // Check if user is logged in on initial load and fetch profile based on user type
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Starting authentication check...');
      const token = localStorage.getItem('access_token');
      const userType = localStorage.getItem('user_type');
      
      console.log('AuthContext: Token exists:', !!token);
      console.log('AuthContext: User type:', userType);
      
      if (token && userType) {
        try {
          let profileData = null;
          
          console.log('AuthContext: Fetching profile for user type:', userType);
          
          // Add a small delay to ensure the backend is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
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

          console.log('AuthContext: Profile data received:', profileData);

          const userData = {
            ...profileData,
            user_type: userType,
            user_id: localStorage.getItem('user_id')
          };
          
          console.log('AuthContext: Setting user data:', userData);
          setUser(userData);
          
          console.log('AuthContext: User set successfully');
        } catch (err) {
          console.error('AuthContext: Failed to fetch user profile:', err);
          // Don't immediately clear tokens on profile fetch failure
          // This could be a temporary network issue
          console.log('AuthContext: Keeping tokens but setting user to null, letting app retry');
          // Only clear tokens if it's definitely an auth error, not a network error
          if (err.message === 'Authentication expired') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_type');
            console.log('AuthContext: Cleared invalid tokens');
          }
        }
      } else {
        console.log('AuthContext: No token or user type found, user remains null');
      }
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    };
    checkAuth();
  }, []);
  
  // Login function with timeout and better error handling
  const login = async (credentials) => {
    try {
      setError(null);
      
      // Use the authAPI from our configured axios instance
      const response = await authAPI.login(credentials);
      const { token, refresh_token, user_id, user_type } = response.data;

      // Store tokens in localStorage with consistent naming
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('user_type', user_type);

      // Fetch full user profile
      let profileData = null;
      try {
        const profileResponse = await authAPI.getProfile();
        profileData = profileResponse.data;
      } catch (profileErr) {
        console.warn('Profile fetch error:', profileErr.message);
        profileData = { user_id, user_type };
      }

      const userData = {
        ...profileData,
        user_type: user_type,
        user_id: user_id
      };
      
      console.log('Login: Setting user data after login:', userData);
      setUser(userData);
      console.log('Login: User set successfully');

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