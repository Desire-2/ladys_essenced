/**
 * User Action Menu Component
 * 3-dot dropdown menu for user row actions
 */
import React, { useState } from 'react';
import { MoreVertical, Eye, ToggleRight, UserCog, Key, Trash2 } from 'lucide-react';

interface UserActionMenuProps {
  userId: number;
  userName: string;
  userType: string;
  isActive: boolean;
  onViewProfile?: () => void;
  onToggleStatus?: () => void;
  onChangeRole?: () => void;
  onResetPassword?: () => void;
  onDelete?: () => void;
}

export function UserActionMenu({
  userId,
  userName,
  userType,
  isActive,
  onViewProfile,
  onToggleStatus,
  onChangeRole,
  onResetPassword,
  onDelete,
}: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-muted" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            {onViewProfile && (
              <button
                onClick={() => {
                  onViewProfile();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4 text-muted" />
                View Profile
              </button>
            )}

            {onToggleStatus && (
              <button
                onClick={() => {
                  onToggleStatus();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <ToggleRight className="w-4 h-4 text-muted" />
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}

            {onChangeRole && (
              <button
                onClick={() => {
                  onChangeRole();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <UserCog className="w-4 h-4 text-muted" />
                Change Role
              </button>
            )}

            {onResetPassword && (
              <button
                onClick={() => {
                  onResetPassword();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Key className="w-4 h-4 text-muted" />
                Reset Password
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-gray-200 text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
