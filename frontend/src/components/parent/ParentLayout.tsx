import React from 'react';
import { ParentSidebar } from './ParentSidebar';
import { TopBar } from '@/components/layout/TopBar';

interface ParentLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  pageTitle?: string;
  onNavigate: (path: string) => void;
  parentUnread?: number;
}

export function ParentLayout({
  children,
  currentPath,
  pageTitle,
  onNavigate,
  parentUnread = 0,
}: ParentLayoutProps) {
  return (
    <div className="parent-shell flex bg-cream min-h-screen">
      <ParentSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        unreadCount={parentUnread}
      />
      <div className="parent-main flex-1 flex flex-col min-w-0">
        <TopBar onNavigate={onNavigate} />
        {pageTitle && (
          <div className="px-6 pt-4 pb-0 border-b border-border bg-surface">
            <h2 className="text-xl font-heading font-bold text-ink">{pageTitle}</h2>
          </div>
        )}
        <main className="parent-content flex-1 p-4 md:p-6 overflow-auto bg-surface">
          <div className="max-w-6xl mx-auto animate-[fadeInUp_0.15s_ease-out]">{children}</div>
        </main>
      </div>
    </div>
  );
}
