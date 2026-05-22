import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChildProfile, ParentStoreState } from '@/types/parent';

export const useParentStore = create<ParentStoreState>()(
  persist(
    (set) => ({
      activeChildId: null,
      children: [],
      setActiveChild: (id) => set({ activeChildId: id }),
      setChildren: (children) => set({ children }),
    }),
    {
      name: 'parent-family-state',
      partialize: (state) => ({ activeChildId: state.activeChildId }),
    }
  )
);
