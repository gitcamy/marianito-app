import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockSettingsService } from '../MockSettingsService';

// G1–G3 + discoverableToAll, incl. the missing-key migration fix
describe('MockSettingsService', () => {
  let settings: MockSettingsService;

  beforeEach(async () => {
    await AsyncStorage.clear();
    settings = new MockSettingsService();
  });

  it('defaults everything to on', async () => {
    expect(await settings.get()).toEqual({
      discoverablePresence: true,
      locationConsent: true,
      notificationsEnabled: true,
      discoverableToAll: true,
    });
  });

  it('updates persist', async () => {
    await settings.update({ discoverablePresence: false });
    expect((await settings.get()).discoverablePresence).toBe(false);
    // untouched keys unchanged
    expect((await settings.get()).locationConsent).toBe(true);
  });

  it('toggles can be turned off and back on', async () => {
    await settings.update({ discoverableToAll: false });
    expect((await settings.get()).discoverableToAll).toBe(false);
    await settings.update({ discoverableToAll: true });
    expect((await settings.get()).discoverableToAll).toBe(true);
  });

  it('stored settings from before a new key existed get its default (migration)', async () => {
    // simulate settings saved before discoverableToAll shipped
    await AsyncStorage.setItem(
      'marianito:settings',
      JSON.stringify({ discoverablePresence: false, locationConsent: true, notificationsEnabled: true }),
    );
    const loaded = await settings.get();
    expect(loaded.discoverableToAll).toBe(true); // default merged in
    expect(loaded.discoverablePresence).toBe(false); // stored value kept
  });
});
