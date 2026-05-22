import React from 'react';
import { Plus } from 'lucide-react';
import { useParentStore } from '@/stores/parentStore';
import { getChildColor } from '@/lib/parentUtils';

interface FamilySwitcherProps {
  onNavigate: (path: string) => void;
}

export function FamilySwitcher({ onNavigate }: FamilySwitcherProps) {
  const { activeChildId, setActiveChild } = useParentStore();
  const children = useParentStore((s) => s.children);

  const handleSelectChild = (id: number | null) => {
    setActiveChild(id);
    if (id === null) {
      onNavigate('/dashboard/parent');
    } else {
      onNavigate(`/dashboard/parent/children/${id}`);
    }
  };

  return (
    <nav className="family-switcher px-3 py-4 border-b border-white/10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-cream/60 mb-3 px-2">
        Family
      </p>

      <button
        type="button"
        onClick={() => handleSelectChild(null)}
        className={`family-switcher-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          activeChildId == null
            ? 'bg-white/15 text-cream font-semibold'
            : 'text-cream/80 hover:bg-white/10'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-sage shrink-0" />
        All Members
      </button>

      {children.map((child) => {
        const color = getChildColor(child.adolescent_id);
        const active = activeChildId === child.adolescent_id;
        return (
          <button
            key={child.adolescent_id}
            type="button"
            onClick={() => handleSelectChild(child.adolescent_id)}
            className={`family-switcher-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mt-1 transition-colors ${
              active ? 'bg-white/15 text-cream font-semibold' : 'text-cream/80 hover:bg-white/10'
            }`}
          >
            <span
              className="switcher-avatar w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: color.bg, color: color.text }}
            >
              {child.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 text-left truncate">{child.name}</span>
            {!child.access_granted && <span className="text-xs">🔒</span>}
            {child.unread_notifications > 0 && (
              <span className="switcher-badge min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-cream text-[10px] font-bold flex items-center justify-center">
                {child.unread_notifications}
              </span>
            )}
          </button>
        );
      })}

      <button
        type="button"
        className="family-switcher-add w-full flex items-center gap-2 px-3 py-2 mt-3 text-sm text-cream/70 hover:text-cream hover:bg-white/10 rounded-lg transition-colors"
        onClick={() => onNavigate('/dashboard/parent/children/add')}
      >
        <Plus className="w-4 h-4" />
        Add member
      </button>
    </nav>
  );
}
