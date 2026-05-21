import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-cream/10 relative">
      
      {/* Decorative Warm Accent Blobs */}
      <div className="organic-bg-blob w-80 h-80 bg-terracotta top-[-100px] left-[-100px]" />
      <div className="organic-bg-blob w-96 h-96 bg-sage bottom-[-150px] right-[-150px]" />

      {/* Side collapsible nav panel */}
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main app panel wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Dynamic header navigation */}
        <TopBar onNavigate={onNavigate} />

        {/* Content body with responsive pads & scrolls */}
        <main className="flex-grow overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8 flex flex-col">
          <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
