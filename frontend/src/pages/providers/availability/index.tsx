import { AvailabilityEditor } from '@/components/providers/AvailabilityEditor';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  useProviderAvailability,
  useUpdateAvailability,
} from '@/hooks/providers/useProviderAvailability';
import { DEFAULT_AVAILABILITY } from '@/types/provider';

export function ProviderAvailabilityPage() {
  const { data, isLoading, isError, refetch } = useProviderAvailability();
  const { mutate: save, isPending } = useUpdateAvailability(refetch);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted mb-3">Failed to load availability.</p>
        <Button type="button" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <AvailabilityEditor
      initial={data ?? DEFAULT_AVAILABILITY}
      onSave={save}
      isSaving={isPending}
    />
  );
}
