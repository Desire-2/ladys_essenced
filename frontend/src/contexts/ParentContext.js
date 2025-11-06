'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { parentAPI } from '../api';

const ParentContext = createContext();

export const useParent = () => {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error('useParent must be used within ParentProvider');
  }
  return context;
};

export const ParentProvider = ({ children }) => {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState(null);
  const [childCycleLogs, setChildCycleLogs] = useState({});
  const [childMealLogs, setChildMealLogs] = useState({});
  const [childAppointments, setChildAppointments] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});

  // Fetch all children for the parent
  const fetchChildren = useCallback(async () => {
    setChildrenLoading(true);
    setChildrenError(null);
    try {
      const response = await parentAPI.getChildren();
      setChildrenList(response.data || []);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch children';
      setChildrenError(errorMessage);
      console.error('Error fetching children:', error);
      throw error;
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  // Fetch single child details
  const fetchChild = useCallback(async (childId) => {
    try {
      const response = await parentAPI.getChild(childId);
      return response.data;
    } catch (error) {
      console.error(`Error fetching child ${childId}:`, error);
      throw error;
    }
  }, []);

  // Add new child
  const addChild = useCallback(async (childData) => {
    try {
      const response = await parentAPI.addChild(childData);
      setChildrenList([...childrenList, response.data.child]);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add child';
      console.error('Error adding child:', error);
      throw new Error(errorMessage);
    }
  }, [childrenList]);

  // Update child
  const updateChild = useCallback(async (childId, childData) => {
    try {
      const response = await parentAPI.updateChild(childId, childData);
      setChildrenList(
        childrenList.map(c => c.id === childId ? { ...c, ...childData } : c)
      );
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update child';
      console.error('Error updating child:', error);
      throw new Error(errorMessage);
    }
  }, [childrenList]);

  // Delete child
  const deleteChild = useCallback(async (childId) => {
    try {
      await parentAPI.deleteChild(childId);
      setChildrenList(childrenList.filter(c => c.id !== childId));
      // Clear data for this child
      setChildCycleLogs(prev => {
        const updated = { ...prev };
        delete updated[childId];
        return updated;
      });
      setChildMealLogs(prev => {
        const updated = { ...prev };
        delete updated[childId];
        return updated;
      });
      setChildAppointments(prev => {
        const updated = { ...prev };
        delete updated[childId];
        return updated;
      });
      if (selectedChild === childId) {
        setSelectedChild(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete child';
      console.error('Error deleting child:', error);
      throw new Error(errorMessage);
    }
  }, [childrenList, selectedChild]);

  // Fetch cycle logs for a child
  const fetchChildCycleLogs = useCallback(async (childId, page = 1, perPage = 10) => {
    const cacheKey = `cycle_${childId}`;
    setLoadingStates(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));
    try {
      const response = await parentAPI.getChildCycleLogs(childId, page, perPage);
      setChildCycleLogs(prev => ({
        ...prev,
        [childId]: response.data
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch cycle logs';
      setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
      console.error(`Error fetching cycle logs for child ${childId}:`, error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  // Fetch meal logs for a child
  const fetchChildMealLogs = useCallback(async (childId, page = 1, perPage = 10) => {
    const cacheKey = `meal_${childId}`;
    setLoadingStates(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));
    try {
      const response = await parentAPI.getChildMealLogs(childId, page, perPage);
      setChildMealLogs(prev => ({
        ...prev,
        [childId]: response.data
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch meal logs';
      setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
      console.error(`Error fetching meal logs for child ${childId}:`, error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  // Fetch appointments for a child
  const fetchChildAppointments = useCallback(async (childId, page = 1, perPage = 10) => {
    const cacheKey = `appointment_${childId}`;
    setLoadingStates(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));
    try {
      const response = await parentAPI.getChildAppointments(childId, page, perPage);
      setChildAppointments(prev => ({
        ...prev,
        [childId]: response.data
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch appointments';
      setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
      console.error(`Error fetching appointments for child ${childId}:`, error);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  // Get data for current selected child
  const getChildCycleData = useCallback((childId) => {
    return childCycleLogs[childId] || null;
  }, [childCycleLogs]);

  const getChildMealData = useCallback((childId) => {
    return childMealLogs[childId] || null;
  }, [childMealLogs]);

  const getChildAppointmentData = useCallback((childId) => {
    return childAppointments[childId] || null;
  }, [childAppointments]);

  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const getError = useCallback((key) => {
    return errors[key] || null;
  }, [errors]);

  const value = {
    // Children management
    childrenList,
    selectedChild,
    setSelectedChild,
    childrenLoading,
    childrenError,
    fetchChildren,
    fetchChild,
    addChild,
    updateChild,
    deleteChild,

    // Child data fetching
    fetchChildCycleLogs,
    fetchChildMealLogs,
    fetchChildAppointments,

    // Data access
    getChildCycleData,
    getChildMealData,
    getChildAppointmentData,
    getLoadingState,
    getError,

    // Cache data
    childCycleLogs,
    childMealLogs,
    childAppointments,
  };

  return (
    <ParentContext.Provider value={value}>
      {children}
    </ParentContext.Provider>
  );
};
