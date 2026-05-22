import React from 'react';
import { Plus } from 'lucide-react';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { FamilyChildCard } from '@/components/parent/FamilyChildCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface ChildrenListPageProps {
  onNavigate: (path: string) => void;
}

export function ChildrenListPage({ onNavigate }: ChildrenListPageProps) {
  const { data, isLoading } = useParentDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-heading font-bold text-ink">Family members</h2>
        <Button onClick={() => onNavigate('/dashboard/parent/children/add')}>
          <Plus className="w-4 h-4 mr-1" /> Add family member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.children.map((child) => (
            <FamilyChildCard
              key={child.adolescent_id}
              child={child}
              onView={(id) => onNavigate(`/dashboard/parent/children/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
