/**
 * Admin Layout Component
 * Main layout for admin dashboard with sidebar and top bar
 */
import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  pageTitle?: string;
  onNavigate: (path: string) => void;
}

export function AdminLayout({
  children,
  currentPath,
  pageTitle,
  onNavigate,
}: AdminLayoutProps) {
  return (
    <div className="flex bg-cream min-h-screen">
      {/* Sidebar */}
      <AdminSidebar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <AdminTopBar pageTitle={pageTitle} />

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
