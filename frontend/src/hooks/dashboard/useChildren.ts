import { useState, useCallback } from 'react';
import { parentAPI } from '../../api';
import { Child } from '../../app/dashboard/types';

export const useChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Loading children...');
      const response = await parentAPI.getChildren();
      setChildren(response.data || []);
      console.log('Children loaded:', response.data);
    } catch (err: any) {
      console.error('Failed to load children:', err);
      setError(err.response?.data?.message || 'Failed to load children data');
    } finally {
      setLoading(false);
    }
  }, []);

  const addChild = useCallback(async (childData: {
    name: string;
    date_of_birth: string;
    relationship_type: string;
    phone_number?: string;
    password?: string;
  }) => {
    try {
      setError('');
      await parentAPI.addChild(childData);
      await loadChildren(); // Refresh list
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add child';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadChildren]);

  const updateChild = useCallback(async (childId: number, childData: {
    name: string;
    date_of_birth: string;
    relationship_type: string;
    phone_number?: string;
    password?: string;
  }) => {
    try {
      setError('');
      await parentAPI.updateChild(childId, childData);
      await loadChildren(); // Refresh list
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update child';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadChildren]);

  const deleteChild = useCallback(async (childId: number) => {
    try {
      setError('');
      await parentAPI.deleteChild(childId);
      await loadChildren(); // Refresh list
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete child';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadChildren]);

  return {
    children,
    loading,
    error,
    setError,
    loadChildren,
    addChild,
    updateChild,
    deleteChild
  };
};