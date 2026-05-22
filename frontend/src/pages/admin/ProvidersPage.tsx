/**
 * Admin Providers Management Page
 * Health provider verification and management
 */
import React, { useState, useEffect } from 'react';
import { Loader, Search } from 'lucide-react';
import { useAdminProviders, useVerifyProvider, useDeleteProvider } from '@/hooks/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { formatDateTime } from '@/lib/utils';
import type { AdminProvider } from '@/types/admin';

interface ProvidersPageProps {
  onNavigate: (path: string) => void;
}

export function ProvidersPage({ onNavigate }: ProvidersPageProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'verify' | 'delete';
    providerId?: number;
    providerName?: string;
  }>({ isOpen: false, type: 'verify' });

  const { data: providersData, isLoading, fetchProviders } = useAdminProviders({ page, search });
  const { verify } = useVerifyProvider(() => {
    fetchProviders({ page, search });
    setConfirmModal({ isOpen: false, type: 'verify' });
  });
  const { deleteProvider } = useDeleteProvider(() => {
    fetchProviders({ page, search });
    setConfirmModal({ isOpen: false, type: 'delete' });
  });

  useEffect(() => {
    fetchProviders({ page, search });
  }, [page, search]);

  const handleVerify = async () => {
    if (confirmModal.providerId) {
      await verify(confirmModal.providerId);
    }
  };

  const handleDelete = async () => {
    if (confirmModal.providerId) {
      await deleteProvider(confirmModal.providerId);
    }
  };

  const unverifiedCount = (providersData?.data ?? []).filter((p) => !p.is_verified).length;

  const columns = [
    {
      key: 'provider',
      label: 'Provider',
      width: '30%',
      render: (provider: AdminProvider) => (
        <div>
          <p className="font-semibold text-ink">{provider.user.first_name} {provider.user.last_name}</p>
          <p className="text-xs text-muted">{provider.clinic_name}</p>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      width: '20%',
      render: (provider: AdminProvider) => (
        <p className="text-sm text-ink">{provider.specialization}</p>
      ),
    },
    {
      key: 'license',
      label: 'License',
      width: '15%',
      render: (provider: AdminProvider) => (
        <p className="text-xs text-muted">{provider.license_number}</p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (provider: AdminProvider) => (
        <StatusBadge status={provider.is_verified ? 'verified' : 'unverified'} />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '20%',
      render: (provider: AdminProvider) => (
        <div className="flex gap-2">
          {!provider.is_verified && (
            <button
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  type: 'verify',
                  providerId: provider.id,
                  providerName: provider.user.first_name,
                })
              }
              className="px-3 py-1.5 rounded bg-sage text-white text-xs font-semibold hover:opacity-90"
            >
              Verify
            </button>
          )}
          <button
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                type: 'delete',
                providerId: provider.id,
                providerName: provider.user.first_name,
              })
            }
            className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">Health Providers</h1>
        <p className="text-sm text-muted mt-1">
          Manage {providersData?.total?.toLocaleString() || 0} registered health providers
        </p>
      </div>

      {/* Alert Banner */}
      {unverifiedCount > 0 && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">
            ⚠️ {unverifiedCount} provider{unverifiedCount === 1 ? '' : 's'} awaiting credential verification
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search by name or clinic..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
        />
      </div>

      {/* Table */}
      <AdminDataTable
        data={providersData?.data ?? providersData?.providers ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No providers found"
        pagination={{
          page,
          total: providersData?.total ?? 0,
          perPage,
          pages: providersData?.pages ?? 1,
          onPageChange: setPage,
        }}
      />

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'verify'}
        title="Verify Provider"
        description={`Approve credentials for ${confirmModal.providerName}?`}
        dangerLabel="Verify"
        onConfirm={handleVerify}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'verify' })}
        isDangerous={false}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
        title="Remove Provider"
        description={`Remove ${confirmModal.providerName} from the platform?`}
        dangerLabel="Remove"
        consequences={['Provider account disabled', 'All appointments reassigned']}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'delete' })}
      />
    </div>
  );
}
