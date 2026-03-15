import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'tr' | 'en';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  language: Language;
  
  toggleSound: () => void;
  toggleHaptics: () => void;
  setLanguage: (lang: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      language: 'tr',
      
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'grid-logic-settings',
    }
  )
);
