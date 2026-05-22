/**
 * Admin Appointments Management Page
 * View and manage all platform appointments
 */
import React, { useState, useEffect } from 'react';
import { Loader, Search } from 'lucide-react';
import { useAdminAppointments, useCancelAppointment } from '@/hooks/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { formatDateTime } from '@/lib/utils';
import type { AdminAppointment } from '@/types/admin';

interface AppointmentsPageProps {
  onNavigate: (path: string) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AppointmentsPage({ onNavigate }: AppointmentsPageProps) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    appointmentId?: number;
    patientName?: string;
  }>({ isOpen: false });

  const { data: appointmentsData, isLoading, fetchAppointments } = useAdminAppointments({ page, status });
  const { cancel } = useCancelAppointment(() => {
    fetchAppointments({ page, status });
    setConfirmModal({ isOpen: false });
  });

  useEffect(() => {
    fetchAppointments({ page, status });
  }, [page, status]);

  const handleCancel = async () => {
    if (confirmModal.appointmentId) {
      await cancel(confirmModal.appointmentId);
    }
  };

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      width: '25%',
      render: (appt: AdminAppointment) => (
        <p className="font-semibold text-ink">{appt.patient_name}</p>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      width: '20%',
      render: (appt: AdminAppointment) => (
        <p className="text-sm text-ink">{appt.provider_name || 'Unassigned'}</p>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: '15%',
      render: (appt: AdminAppointment) => (
        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
          {appt.appointment_type}
        </span>
      ),
    },
    {
      key: 'datetime',
      label: 'Date & Time',
      width: '18%',
      render: (appt: AdminAppointment) => (
        <p className="text-sm text-muted">{formatDateTime(appt.scheduled_datetime)}</p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (appt: AdminAppointment) => <StatusBadge status={appt.status} />,
    },
    {
      key: 'actions',
      label: '',
      width: '10%',
      render: (appt: AdminAppointment) => (
        appt.status !== 'completed' && appt.status !== 'cancelled' ? (
          <button
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                appointmentId: appt.id,
                patientName: appt.patient_name,
              })
            }
            className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Cancel
          </button>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">Appointment Management</h1>
        <p className="text-sm text-muted mt-1">
          View and manage {appointmentsData?.total?.toLocaleString() || 0} platform appointments
        </p>
      </div>

      {/* Filters */}
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Table */}
      <AdminDataTable
        data={appointmentsData?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No appointments found"
        pagination={{
          page,
          total: appointmentsData?.total ?? 0,
          perPage,
          pages: appointmentsData?.pages ?? 1,
          onPageChange: setPage,
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cancel Appointment"
        description={`Cancel appointment for ${confirmModal.patientName}?`}
        dangerLabel="Cancel Appointment"
        consequences={['Patient will be notified', 'Provider availability will be freed']}
        onConfirm={handleCancel}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
