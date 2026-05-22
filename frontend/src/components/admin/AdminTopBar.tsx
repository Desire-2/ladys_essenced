/**
 * Admin Top Bar Component
 * Top navigation bar with broadcast button, notifications, and profile
 */
import React, { useState } from 'react';
import { Bell, Send, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { BroadcastModal } from './BroadcastModal';
import { useAdminStats } from '@/hooks/admin';

interface AdminTopBarProps {
  pageTitle?: string;
  onBroadcast?: () => void;
}

function displayUserName(user: { first_name?: string; last_name?: string; name?: string } | null) {
  if (!user) return 'Admin';
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return fromParts || user.name || 'Admin';
}

export function AdminTopBar({ pageTitle = 'Admin Dashboard', onBroadcast }: AdminTopBarProps) {
  const { user, logout } = useAuthStore();
  const { stats } = useAdminStats();
  const userLabel = displayUserName(user);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.hash = '/login';
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Page Title */}
          <div>
            <h1 className="text-xl font-bold font-heading text-ink">{pageTitle}</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Broadcast Button */}
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terracotta text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
              title="Send platform-wide notification"
            >
              <Send className="w-4 h-4" />
              <span className="hidden md:inline">Broadcast</span>
            </button>

            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-muted" />
              {stats && stats.pending_content > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-terracotta" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-ink">{userLabel}</p>
                  <p className="text-xs text-muted">Admin</p>
                </div>
              </button>

              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs text-muted font-semibold uppercase">Account</p>
                      <p className="text-sm font-semibold text-ink mt-1">{userLabel}</p>
                    </div>

                    <button className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <Settings className="w-4 h-4 text-muted" />
                      Account Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors border-t border-gray-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        totalUsers={stats?.total_users || 0}
      />
    </>
  );
}
