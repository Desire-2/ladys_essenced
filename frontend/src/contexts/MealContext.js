'use client';

import { useState, createContext, useContext } from 'react';
import { mealAPI } from '../api';

// Create meal logging context
const MealContext = createContext();

export const MealProvider = ({ children }) => {
  const [mealLogs, setMealLogs] = useState([]);
  const [mealStats, setMealStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch meal logs
  const fetchMealLogs = async (page = 1, perPage = 10, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mealAPI.getLogs(page, perPage, filters);
      setMealLogs(response.data.items);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch meal logs');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch meal statistics
  const fetchMealStats = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mealAPI.getStats(filters);
      setMealStats(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch meal statistics');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add new meal log
  const addMealLog = async (logData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mealAPI.createLog(logData);
      
      // Refresh logs and stats after adding
      await fetchMealLogs();
      await fetchMealStats();
      
      return { success: true, id: response.data.id };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add meal log');
      return { success: false, error: err.response?.data?.message || 'Failed to add meal log' };
    } finally {
      setLoading(false);
    }
  };

  // Update meal log
  const updateMealLog = async (id, logData) => {
    try {
      setLoading(true);
      setError(null);
      await mealAPI.updateLog(id, logData);
      
      // Refresh logs and stats after updating
      await fetchMealLogs();
      await fetchMealStats();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update meal log');
      return { success: false, error: err.response?.data?.message || 'Failed to update meal log' };
    } finally {
      setLoading(false);
    }
  };

  // Delete meal log
  const deleteMealLog = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await mealAPI.deleteLog(id);
      
      // Refresh logs and stats after deleting
      await fetchMealLogs();
      await fetchMealStats();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meal log');
      return { success: false, error: err.response?.data?.message || 'Failed to delete meal log' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <MealContext.Provider 
      value={{ 
        mealLogs, 
        mealStats, 
        loading, 
        error, 
        pagination,
        fetchMealLogs,
        fetchMealStats,
        addMealLog,
        updateMealLog,
        deleteMealLog
      }}
    >
      {children}
    </MealContext.Provider>
  );
};

// Custom hook to use meal context
export const useMeal = () => {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error('useMeal must be used within a MealProvider');
  }
  return context;
};
