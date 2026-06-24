import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UmwariState, UmwariLanguageCode } from '../types/umwari';

export const useUmwariStore = create<UmwariState>()(
  persist(
    (set) => ({
      // Setup state
      isConfigured: false,
      apiKey: null,
      language: 'rw', // default to Kinyarwanda as requested or English, can be customized

      // Chat state (NOT persisted — cleared on session/browser close or programmatically)
      messages: [],
      isStreaming: false,
      isLoadingContext: false,
      error: null,
      isOpen: false,

      // Actions
      completeOnboarding: () => set({ isConfigured: true }),
      setApiKey: (key) => {
        const trimmedKey = key.trim();
        localStorage.setItem('umwari_gemini_key', trimmedKey);
        set({ apiKey: trimmedKey, isConfigured: trimmedKey.length > 0 });
      },

      setLanguage: (lang) => set({ language: lang }),

      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      updateLastMessage: (chunk) =>
        set((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === 'umwari') {
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: msgs[msgs.length - 1].content + chunk,
            };
          }
          return { messages: msgs };
        }),

      setStreaming: (val) => set({ isStreaming: val }),
      clearChat: () => set({ messages: [] }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (val) => set({ isOpen: val }),
    }),
    {
      name: 'umwari-config-v2', // unique name
      partialize: (state) => ({
        // Persist config
        isConfigured: state.isConfigured,
        apiKey: state.apiKey,
        language: state.language,
        // Persist recent messages (last 20) so chat survives page refresh
        messages: state.messages.slice(-20),
      }),
      // Only rehydrate messages on initial load; streaming state is session-only
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<typeof current>),
        // Never rehydrate streaming state
        isStreaming: false,
        isLoadingContext: false,
        // Merge persisted messages if current is empty (new session)
        messages: current.messages.length > 0
          ? current.messages
          : (persisted as any).messages ?? [],
      }),
    }
  )
);
export default useUmwariStore;
