import { SettingsService } from '@/services/types';
import { Settings } from '@/types/models';
import { supabase } from './client';

const DEFAULTS: Settings = {
  discoverablePresence: true,
  locationConsent: true,
  notificationsEnabled: true,
};

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('No session');
  return id;
}

export class SupabaseSettingsService implements SettingsService {
  async get(): Promise<Settings> {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return DEFAULTS;
    const { data } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle();
    if (!data) return DEFAULTS;
    return {
      discoverablePresence: data.discoverable_presence,
      locationConsent: data.location_consent,
      notificationsEnabled: data.notifications_enabled,
    };
  }

  async update(patch: Partial<Settings>): Promise<Settings> {
    const userId = await requireUserId();
    const current = await this.get();
    const next = { ...current, ...patch };
    const { error } = await supabase.from('settings').upsert({
      user_id: userId,
      discoverable_presence: next.discoverablePresence,
      location_consent: next.locationConsent,
      notifications_enabled: next.notificationsEnabled,
    });
    if (error) throw new Error(error.message);
    return next;
  }
}
