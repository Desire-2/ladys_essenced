'use client';

import { useState, createContext, useContext } from 'react';
import { cycleAPI } from '../api';

// Create cycle tracking context
const CycleContext = createContext();

export const CycleProvider = ({ children }) => {
  const [cycleLogs, setCycleLogs] = useState([]);
  const [cycleStats, setCycleStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch cycle logs
  const fetchCycleLogs = async (page = 1, perPage = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleAPI.getLogs(page, perPage);
      setCycleLogs(response.data.items);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cycle logs');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch cycle statistics
  const fetchCycleStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleAPI.getStats();
      setCycleStats(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cycle statistics');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add new cycle log
  const addCycleLog = async (logData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleAPI.createLog(logData);
      
      // Refresh logs and stats after adding
      await fetchCycleLogs();
      await fetchCycleStats();
      
      return { success: true, id: response.data.id };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add cycle log');
      return { success: false, error: err.response?.data?.message || 'Failed to add cycle log' };
    } finally {
      setLoading(false);
    }
  };

  // Update cycle log
  const updateCycleLog = async (id, logData) => {
    try {
      setLoading(true);
      setError(null);
      await cycleAPI.updateLog(id, logData);
      
      // Refresh logs and stats after updating
      await fetchCycleLogs();
      await fetchCycleStats();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update cycle log');
      return { success: false, error: err.response?.data?.message || 'Failed to update cycle log' };
    } finally {
      setLoading(false);
    }
  };

  // Delete cycle log
  const deleteCycleLog = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await cycleAPI.deleteLog(id);
      
      // Refresh logs and stats after deleting
      await fetchCycleLogs();
      await fetchCycleStats();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete cycle log');
      return { success: false, error: err.response?.data?.message || 'Failed to delete cycle log' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CycleContext.Provider 
      value={{ 
        cycleLogs, 
        cycleStats, 
        loading, 
        error, 
        pagination,
        fetchCycleLogs,
        fetchCycleStats,
        addCycleLog,
        updateCycleLog,
        deleteCycleLog
      }}
    >
      {children}
    </CycleContext.Provider>
  );
};

// Custom hook to use cycle context
export const useCycle = () => {
  const context = useContext(CycleContext);
  if (!context) {
    throw new Error('useCycle must be used within a CycleProvider');
  }
  return context;
};
