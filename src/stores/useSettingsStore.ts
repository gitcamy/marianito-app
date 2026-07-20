import { create } from 'zustand';
import { settings as settingsService } from '@/services';
import { Settings } from '@/types/models';

interface SettingsState {
  settings: Settings;
  refresh: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { discoverablePresence: true, locationConsent: true, notificationsEnabled: true },

  refresh: async () => {
    set({ settings: await settingsService.get() });
  },

  update: async (patch) => {
    set({ settings: await settingsService.update(patch) });
  },
}));
