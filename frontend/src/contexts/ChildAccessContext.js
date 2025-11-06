'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { parentAPI } from '../api/index';

const ChildAccessContext = createContext();

export const useChildAccess = () => {
  const context = useContext(ChildAccessContext);
  if (!context) {
    throw new Error('useChildAccess must be used within ChildAccessProvider');
  }
  return context;
};

export const ChildAccessProvider = ({ children }) => {
  const { user, hasRole } = useAuth();
  const [accessedChild, setAccessedChild] = useState(null);
  const [parentChildren, setParentChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load parent's children on mount
  useEffect(() => {
    if (user && hasRole('parent')) {
      fetchParentChildren();
    }
  }, [user, hasRole]);

  // Load accessed child from localStorage
  useEffect(() => {
    const savedChildId = localStorage.getItem('accessed_child_id');
    if (savedChildId && parentChildren.length > 0) {
      const child = parentChildren.find(c => c.user_id === parseInt(savedChildId));
      if (child) {
        setAccessedChild(child);
      }
    }
  }, [parentChildren]);

  const fetchParentChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await parentAPI.getChildren();
      setParentChildren(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch children');
      console.error('Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  };

  // Switch to a specific child's account
  const switchToChild = (childId) => {
    const child = parentChildren.find(c => c.id === childId);
    if (child) {
      setAccessedChild(child);
      localStorage.setItem('accessed_child_id', child.user_id);
      return true;
    }
    return false;
  };

  // Clear the accessed child
  const clearAccessedChild = () => {
    setAccessedChild(null);
    localStorage.removeItem('accessed_child_id');
  };

  // Get the currently accessed child
  const getCurrentAccessedChild = () => {
    return accessedChild;
  };

  // Check if parent is accessing a specific child
  const isAccessingChild = (childId) => {
    return accessedChild?.id === childId;
  };

  // Get child by ID
  const getChildById = (childId) => {
    return parentChildren.find(c => c.id === childId) || null;
  };

  // Get child by user ID
  const getChildByUserId = (userId) => {
    return parentChildren.find(c => c.user_id === userId) || null;
  };

  // Add a new child
  const addChild = async (childData) => {
    try {
      setError(null);
      const response = await parentAPI.addChild(childData);
      const newChild = response.data.child;
      setParentChildren([...parentChildren, newChild]);
      return newChild;
    } catch (err) {
      setError(err.message || 'Failed to add child');
      throw err;
    }
  };

  // Update child information
  const updateChild = async (childId, updates) => {
    try {
      setError(null);
      const response = await parentAPI.updateChild(childId, updates);
      const updated = response.data;
      setParentChildren(
        parentChildren.map(c => c.id === childId ? { ...c, ...updated } : c)
      );
      if (accessedChild?.id === childId) {
        setAccessedChild({ ...accessedChild, ...updated });
      }
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update child');
      throw err;
    }
  };

  // Delete a child
  const deleteChild = async (childId) => {
    try {
      setError(null);
      await parentAPI.deleteChild(childId);
      setParentChildren(parentChildren.filter(c => c.id !== childId));
      if (accessedChild?.id === childId) {
        clearAccessedChild();
      }
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete child');
      throw err;
    }
  };

  // Get child's cycle logs
  const getChildCycleLogs = async (childId) => {
    try {
      setError(null);
      const response = await parentAPI.getChildCycleLogs(childId);
      return response.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch cycle logs');
      throw err;
    }
  };

  // Get child's meal logs
  const getChildMealLogs = async (childId) => {
    try {
      setError(null);
      const response = await parentAPI.getChildMealLogs(childId);
      return response.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch meal logs');
      throw err;
    }
  };

  // Get child's appointments
  const getChildAppointments = async (childId) => {
    try {
      setError(null);
      const response = await parentAPI.getChildAppointments(childId);
      return response.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments');
      throw err;
    }
  };

  const value = {
    // State
    accessedChild,
    parentChildren,
    loading,
    error,

    // Navigation
    switchToChild,
    clearAccessedChild,
    getCurrentAccessedChild,
    isAccessingChild,

    // Fetching
    getChildById,
    getChildByUserId,
    fetchParentChildren,

    // Child Management
    addChild,
    updateChild,
    deleteChild,

    // Child Data
    getChildCycleLogs,
    getChildMealLogs,
    getChildAppointments,
  };

  return (
    <ChildAccessContext.Provider value={value}>
      {children}
    </ChildAccessContext.Provider>
  );
};

export default ChildAccessContext;
