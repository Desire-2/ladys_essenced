'use client';

import { useState, createContext, useContext } from 'react';
import { appointmentAPI } from '../api';

// Create appointments context
const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch appointments
  const fetchAppointments = async (page = 1, perPage = 10, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentAPI.getAppointments(page, perPage, filters);
      setAppointments(response.data.items);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch upcoming appointments
  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentAPI.getUpcoming();
      setUpcomingAppointments(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch upcoming appointments');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get single appointment
  const getAppointment = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentAPI.getAppointment(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointment details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create appointment
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentAPI.createAppointment(appointmentData);
      
      // Refresh appointments after creating
      await fetchAppointments();
      await fetchUpcomingAppointments();
      
      return { success: true, id: response.data.id };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment');
      return { success: false, error: err.response?.data?.message || 'Failed to create appointment' };
    } finally {
      setLoading(false);
    }
  };

  // Update appointment
  const updateAppointment = async (id, appointmentData) => {
    try {
      setLoading(true);
      setError(null);
      await appointmentAPI.updateAppointment(id, appointmentData);
      
      // Refresh appointments after updating
      await fetchAppointments();
      await fetchUpcomingAppointments();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
      return { success: false, error: err.response?.data?.message || 'Failed to update appointment' };
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment
  const deleteAppointment = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await appointmentAPI.deleteAppointment(id);
      
      // Refresh appointments after deleting
      await fetchAppointments();
      await fetchUpcomingAppointments();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete appointment');
      return { success: false, error: err.response?.data?.message || 'Failed to delete appointment' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppointmentContext.Provider 
      value={{ 
        appointments, 
        upcomingAppointments,
        loading, 
        error, 
        pagination,
        fetchAppointments,
        fetchUpcomingAppointments,
        getAppointment,
        createAppointment,
        updateAppointment,
        deleteAppointment
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

// Custom hook to use appointment context
export const useAppointment = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointment must be used within an AppointmentProvider');
  }
  return context;
};
