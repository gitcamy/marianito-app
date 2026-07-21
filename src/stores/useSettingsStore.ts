import { create } from 'zustand';
import { friends as friendService, settings as settingsService } from '@/services';
import { Settings } from '@/types/models';

interface SettingsState {
  settings: Settings;
  refresh: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    discoverablePresence: true,
    locationConsent: true,
    notificationsEnabled: true,
    discoverableToAll: true,
  },

  refresh: async () => {
    set({ settings: await settingsService.get() });
  },

  update: async (patch) => {
    const next = await settingsService.update(patch);
    set({ settings: next });
    // Revoking location consent wipes the stored location immediately.
    // (Discoverable presence off does NOT clear it — the server just stops
    // showing you to others; your own nearby view keeps working.)
    if (patch.locationConsent === false) {
      friendService.clearPresence().catch(() => {});
    }
  },
}));
