/**
 * Admin Users Management Page
 * Full user directory with filtering, searching, and management actions
 */
import React, { useState, useCallback, useDeferredValue, useEffect } from 'react';
import { Search, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminUsers,
  useToggleUserStatus,
  useChangeUserRole,
  useDeleteUser,
  useResetUserPassword,
} from '@/hooks/admin';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { UserRoleBadge } from '@/components/admin/UserRoleBadge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserActionMenu } from '@/components/admin/UserActionMenu';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { formatDateTime } from '@/lib/utils';
import type { AdminUser } from '@/types/admin';

interface UsersPageProps {
  onNavigate: (path: string) => void;
}

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'adolescent', label: 'Adolescent' },
  { value: 'parent', label: 'Parent' },
  { value: 'health_provider', label: 'Health Provider' },
  { value: 'content_writer', label: 'Content Writer' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function UsersPage({ onNavigate }: UsersPageProps) {
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'status' | 'delete' | 'role' | 'reset_password';
    userId?: number;
    userName?: string;
    userType?: string;
  }>({ isOpen: false, type: 'status' });

  const [roleChangeUser, setRoleChangeUser] = useState<AdminUser | null>(null);

  // Fetch users with filters
  const { data: usersData, isLoading: usersLoading, fetchUsers } = useAdminUsers({
    page,
    per_page: perPage,
    user_type: userType,
    search,
    is_active: isActive ? isActive === 'true' : undefined,
  });

  // Mutations
  const { toggle: toggleStatus } = useToggleUserStatus(() => {
    fetchUsers({ page, per_page: perPage, user_type: userType, search, is_active: isActive ? isActive === 'true' : undefined });
    setConfirmModal({ isOpen: false, type: 'status' });
  });

  const { changeRole } = useChangeUserRole(() => {
    fetchUsers({ page, per_page: perPage, user_type: userType, search, is_active: isActive ? isActive === 'true' : undefined });
    setConfirmModal({ isOpen: false, type: 'role' });
    setRoleChangeUser(null);
  });

  const { deleteUser } = useDeleteUser(() => {
    fetchUsers({ page, per_page: perPage, user_type: userType, search, is_active: isActive ? isActive === 'true' : undefined });
    setConfirmModal({ isOpen: false, type: 'delete' });
  });

  const { resetPassword, isLoading: resetPasswordLoading } = useResetUserPassword(() => {
    setConfirmModal({ isOpen: false, type: 'reset_password' });
  });

  // Handle initial fetch
  useEffect(() => {
    fetchUsers({ page, per_page: perPage, user_type: userType, search, is_active: isActive ? isActive === 'true' : undefined });
  }, [page, perPage, userType, search, isActive]);

  const handleToggleStatus = async () => {
    if (confirmModal.userId) {
      await toggleStatus(confirmModal.userId);
    }
  };

  const handleDeleteUser = async () => {
    if (confirmModal.userId) {
      await deleteUser(confirmModal.userId);
    }
  };

  const handleResetPassword = async () => {
    if (confirmModal.userId) {
      await resetPassword(confirmModal.userId);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (roleChangeUser?.id) {
      await changeRole(roleChangeUser.id, newRole);
    }
  };

  const getDeletionConsequences = (userType: string): string[] => {
    const base = ['All notifications deleted', 'All session data cleared'];
    const roleSpecific: Record<string, string[]> = {
      parent: ['Removed from all parent-child relationships'],
      adolescent: ['All cycle logs deleted', 'All meal logs deleted', 'All appointments deleted'],
      health_provider: ['All appointments reassigned', 'Account removed from provider list'],
      content_writer: ['Content items will become authorless'],
    };
    return [...base, ...(roleSpecific[userType] || [])];
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      width: '25%',
      render: (user: AdminUser) => (
        <div>
          <p className="font-semibold text-ink">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-muted">{user.phone_number}</p>
        </div>
      ),
    },
    {
      key: 'user_type',
      label: 'Role',
      width: '15%',
      render: (user: AdminUser) => <UserRoleBadge role={user.user_type} />,
    },
    {
      key: 'is_active',
      label: 'Status',
      width: '12%',
      render: (user: AdminUser) => (
        <StatusBadge status={user.is_active ? 'active' : 'inactive'} showDot />
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      width: '18%',
      render: (user: AdminUser) => (
        <p className="text-sm text-muted">{formatDateTime(user.created_at)}</p>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '10%',
      render: (user: AdminUser) => (
        <UserActionMenu
          userId={user.id}
          userName={`${user.first_name} ${user.last_name}`}
          userType={user.user_type}
          isActive={user.is_active}
          onToggleStatus={() =>
            setConfirmModal({
              isOpen: true,
              type: 'status',
              userId: user.id,
              userName: `${user.first_name} ${user.last_name}`,
              userType: user.user_type,
            })
          }
          onChangeRole={() => setRoleChangeUser(user)}
          onResetPassword={
            user.user_type !== 'admin'
              ? () =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'reset_password',
                    userId: user.id,
                    userName: `${user.first_name} ${user.last_name}`.trim() || user.name || 'User',
                    userType: user.user_type,
                  })
              : undefined
          }
          onDelete={() =>
            setConfirmModal({
              isOpen: true,
              type: 'delete',
              userId: user.id,
              userName: `${user.first_name} ${user.last_name}`,
              userType: user.user_type,
            })
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">User Management</h1>
        <p className="text-sm text-muted mt-1">
          View and manage all {usersData?.total?.toLocaleString() || 0} platform users
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
          />
        </div>

        {/* Role Filter */}
        <select
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value);
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

        {/* Per Page */}
        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Data Table */}
      <AdminDataTable
        data={usersData?.data ?? usersData?.users ?? []}
        columns={columns}
        isLoading={usersLoading}
        emptyMessage="No users found"
        pagination={{
          page,
          total: usersData?.total ?? 0,
          perPage,
          pages: usersData?.pages ?? 1,
          onPageChange: setPage,
        }}
      />

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'status'}
        title={`${confirmModal.userName}`}
        description={`Are you sure you want to ${confirmModal.userType === 'parent' || confirmModal.userType === 'adolescent' ? 'toggle the' : ''} account status?`}
        dangerLabel="Toggle Status"
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'status' })}
        isDangerous={false}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'reset_password'}
        title="Reset Password"
        description={`Reset login credentials for ${confirmModal.userName}? They must sign in with the new default password.`}
        dangerLabel="Reset Password"
        consequences={[
          'Password will be set to: password',
          'PIN login will be disabled for this account',
          'Share the new password securely with the user',
        ]}
        onConfirm={handleResetPassword}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'reset_password' })}
        isLoading={resetPasswordLoading}
        isDangerous={false}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
        title="Delete User"
        description={`Permanently delete ${confirmModal.userName}? This action cannot be undone.`}
        dangerLabel="Delete User"
        consequences={getDeletionConsequences(confirmModal.userType || 'unknown')}
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'delete' })}
      />

      {/* Role Change Modal */}
      {roleChangeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-ink">Change User Role</h2>
              <p className="text-sm text-muted mt-1">
                {roleChangeUser.first_name} {roleChangeUser.last_name}
              </p>
            </div>

            <div className="p-6 space-y-3">
              {ROLE_OPTIONS.slice(1).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChangeRole(opt.value)}
                  className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                    roleChangeUser.user_type === opt.value
                      ? 'bg-terracotta text-white'
                      : 'border border-gray-300 text-ink hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setRoleChangeUser(null)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-ink font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
