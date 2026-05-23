import { ProviderSidebar } from './ProviderSidebar';
import { TopBar } from '@/components/layout/TopBar';

interface ProviderLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  pageTitle?: string;
  onNavigate: (path: string) => void;
  badges?: { pending?: number; unassigned?: number; unread?: number };
}

export function ProviderLayout({
  children,
  currentPath,
  pageTitle,
  onNavigate,
  badges,
}: ProviderLayoutProps) {
  return (
    <div className="provider-shell flex bg-cream min-h-screen">
      <ProviderSidebar currentPath={currentPath} onNavigate={onNavigate} badges={badges} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onNavigate={onNavigate} />
        {pageTitle && (
          <div className="px-6 pt-4 pb-0 border-b border-border bg-surface">
            <h2 className="text-xl font-heading font-bold text-ink">{pageTitle}</h2>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-surface">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
