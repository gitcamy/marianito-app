import { SettingsService } from '@/services/types';
import { Settings } from '@/types/models';
import { load, save } from './storage';

const KEY = 'settings';

const DEFAULTS: Settings = {
  discoverablePresence: true,
  locationConsent: true,
  notificationsEnabled: true,
  discoverableToAll: true,
};

export class MockSettingsService implements SettingsService {
  async get(): Promise<Settings> {
    const stored = await load<Partial<Settings>>(KEY);
    return { ...DEFAULTS, ...stored }; // merge so newly added settings get defaults
  }

  async update(patch: Partial<Settings>): Promise<Settings> {
    const next = { ...(await this.get()), ...patch };
    await save(KEY, next);
    return next;
  }
}
