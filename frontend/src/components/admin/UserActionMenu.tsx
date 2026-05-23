/**
 * User Action Menu Component
 * 3-dot dropdown menu for user row actions (portal avoids table overflow clipping)
 */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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

const MENU_WIDTH = 192;

export function UserActionMenu({
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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
    let top = rect.bottom + 4;
    const menuHeight = menuRef.current?.offsetHeight ?? 220;
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 4;
    }
    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuContent = isOpen ? (
    <div
      ref={menuRef}
      role="menu"
      className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[200] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {onViewProfile && (
        <button
          type="button"
          role="menuitem"
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
          type="button"
          role="menuitem"
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
          type="button"
          role="menuitem"
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
          type="button"
          role="menuitem"
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
          type="button"
          role="menuitem"
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
  ) : null;

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${userName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4 text-muted" />
      </button>
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}
