import { useState, useCallback } from 'react';
import { appointmentAPI, mealAPI, cycleAPI, parentAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export function useParentChildData() {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to determine which API to use based on user type
  const getAppointmentsForChild = useCallback(async (childUserId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useParentChildData: getAppointmentsForChild called with childUserId:', childUserId);
      console.log('🔍 useParentChildData: hasRole("parent"):', hasRole('parent'));
      
      if (hasRole('parent')) {
        // Use the general appointments API with user_id parameter
        // This will trigger the parent-child validation in the backend
        console.log('🔍 useParentChildData: Making API call for parent viewing child appointments');
        const response = await (appointmentAPI.getUpcoming as any)(childUserId);
        console.log('🔍 useParentChildData: Response received:', response.data);
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } else {
        // For non-parents, just get their own appointments
        console.log('🔍 useParentChildData: Making API call for own appointments');
        const response = await appointmentAPI.getUpcoming();
        console.log('🔍 useParentChildData: Response received:', response.data);
        const data = response.data;
        return Array.isArray(data) ? data : [];
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load appointments';
      console.error('Error in getAppointmentsForChild:', errorMessage);
      setError(errorMessage);
      // Return empty array instead of throwing to prevent filter errors
      return [];
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  const getMealsForChild = useCallback(async (childUserId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      if (hasRole('parent')) {
        // Use the general meal API with user_id parameter
        // This will trigger the parent-child validation in the backend
        const response = await (mealAPI.getLogs as any)(1, 5, {}, childUserId);
        const data = response.data.logs;
        return Array.isArray(data) ? data : [];
      } else {
        // For non-parents, just get their own meals
        const response = await mealAPI.getLogs(1, 5, {});
        const data = response.data.logs;
        return Array.isArray(data) ? data : [];
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load meals';
      console.error('Error in getMealsForChild:', errorMessage);
      setError(errorMessage);
      // Return empty array instead of throwing to prevent filter errors
      return [];
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  const getCycleDataForChild = useCallback(async (childUserId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      if (hasRole('parent')) {
        // Use the general cycle API with user_id parameter
        // This will trigger the parent-child validation in the backend
        const response = await (cycleAPI.getStats as any)(childUserId);
        return response.data || {};
      } else {
        // For non-parents, just get their own cycle data
        const response = await cycleAPI.getStats();
        return response.data || {};
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load cycle data';
      console.error('Error in getCycleDataForChild:', errorMessage);
      setError(errorMessage);
      // Return empty object instead of throwing
      return {};
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  const createAppointmentForChild = useCallback(async (appointmentData: any, childUserId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const dataToSend = {
        ...appointmentData,
        for_user_id: childUserId || user?.id
      };

      const response = await appointmentAPI.create(dataToSend);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Validate parent-child access
  const validateChildAccess = useCallback(async (childUserId: number) => {
    if (!hasRole('parent')) {
      return false;
    }

    try {
      // Try to get child's appointments - this will validate the relationship
      await getAppointmentsForChild(childUserId);
      return true;
    } catch (err) {
      console.error('Child access validation failed:', err);
      return false;
    }
  }, [hasRole, getAppointmentsForChild]);

  return {
    loading,
    error,
    getAppointmentsForChild,
    getMealsForChild,
    getCycleDataForChild,
    createAppointmentForChild,
    validateChildAccess,
    setError
  };
}