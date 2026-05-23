import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { providerApi } from '@/services/providerApi';
import type { ProviderProfile } from '@/types/provider';

export function useProviderProfile() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await providerApi.getProfile();
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, isLoading, refetch };
}

export function useUpdateProviderProfile(onSuccess?: () => void) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (data: Partial<ProviderProfile>) => {
    setIsPending(true);
    try {
      await providerApi.updateProfile(data);
      toast.success('Profile updated');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Failed to update profile');
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
