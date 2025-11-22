'use client';

import { useState, createContext, useContext } from 'react';
import { periodAPI } from '../api';

// Create period logs context
const PeriodContext = createContext();

export const PeriodProvider = ({ children }) => {
  const [periodLogs, setPeriodLogs] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch period logs
  const fetchPeriodLogs = async (page = 1, perPage = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await periodAPI.getLogs(page, perPage);
      setPeriodLogs(response.data.items);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch period logs');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch current period
  const fetchCurrentPeriod = async () => {
    try {
      const response = await periodAPI.getCurrentPeriod();
      setCurrentPeriod(response.data.has_active_period ? response.data.current_period : null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch current period');
      throw err;
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await periodAPI.getAnalytics();
      setAnalytics(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
      throw err;
    }
  };

  // Fetch insights
  const fetchInsights = async () => {
    try {
      const response = await periodAPI.getInsights();
      setInsights(response.data.insights || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch insights');
      throw err;
    }
  };

  // Create period log
  const createPeriodLog = async (logData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await periodAPI.createLog(logData);
      
      // Refresh data after creating
      await fetchPeriodLogs();
      await fetchCurrentPeriod();
      await fetchAnalytics();
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create period log');
      return { success: false, error: err.response?.data?.message || 'Failed to create period log' };
    } finally {
      setLoading(false);
    }
  };

  // Update period log
  const updatePeriodLog = async (logId, logData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await periodAPI.updateLog(logId, logData);
      
      // Update local state
      setPeriodLogs(prev => prev.map(log => 
        log.id === logId ? response.data.period_log : log
      ));
      
      // If this is the current period, update it too
      if (currentPeriod && currentPeriod.id === logId) {
        setCurrentPeriod(response.data.period_log);
      }
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update period log');
      return { success: false, error: err.response?.data?.message || 'Failed to update period log' };
    } finally {
      setLoading(false);
    }
  };

  // Delete period log
  const deletePeriodLog = async (logId) => {
    try {
      setLoading(true);
      setError(null);
      await periodAPI.deleteLog(logId);
      
      // Remove from local state
      setPeriodLogs(prev => prev.filter(log => log.id !== logId));
      
      // If this was the current period, clear it
      if (currentPeriod && currentPeriod.id === logId) {
        setCurrentPeriod(null);
      }
      
      // Refresh analytics
      await fetchAnalytics();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete period log');
      return { success: false, error: err.response?.data?.message || 'Failed to delete period log' };
    } finally {
      setLoading(false);
    }
  };

  // End current period
  const endCurrentPeriod = async (data = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await periodAPI.endCurrentPeriod(data);
      
      // Update current period
      setCurrentPeriod(null);
      
      // Refresh data
      await fetchPeriodLogs();
      await fetchAnalytics();
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end period');
      return { success: false, error: err.response?.data?.message || 'Failed to end period' };
    } finally {
      setLoading(false);
    }
  };

  // Start new period
  const startNewPeriod = async (startDate = new Date()) => {
    const logData = {
      start_date: startDate instanceof Date ? startDate.toISOString() : startDate,
      daily_flow: [],
      products_used: [],
      emotional_symptoms: [],
      activity_limitations: [],
      self_care_activities: [],
      diet_changes: [],
      medication_taken: [],
      supplements_taken: [],
      stress_factors: []
    };
    
    return await createPeriodLog(logs);
  };

  return (
    <PeriodContext.Provider 
      value={{ 
        periodLogs,
        currentPeriod,
        analytics,
        insights,
        loading,
        error,
        pagination,
        fetchPeriodLogs,
        fetchCurrentPeriod,
        fetchAnalytics,
        fetchInsights,
        createPeriodLog,
        updatePeriodLog,
        deletePeriodLog,
        endCurrentPeriod,
        startNewPeriod
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
};

// Custom hook to use period context
export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
};