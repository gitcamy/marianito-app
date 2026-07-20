import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockAuthService } from '../MockAuthService';

// A1–A4 + magic-code flow: passwordless sign-in, session persistence,
// profile-completeness gating, sign-out keeps journal data.
describe('MockAuthService (magic-code auth)', () => {
  let auth: MockAuthService;

  beforeEach(async () => {
    await AsyncStorage.clear();
    auth = new MockAuthService();
  });

  it('requestEmailCode resolves without sending anything', async () => {
    await expect(auth.requestEmailCode('cam@test.dev')).resolves.toBeUndefined();
  });

  it('verifyEmailCode creates a session for a new user (any code)', async () => {
    const user = await auth.verifyEmailCode('Cam@Test.dev', '000000');
    expect(user.email).toBe('cam@test.dev'); // normalised
    expect(user.displayName).toBe('');
    expect(auth.isProfileComplete(user)).toBe(false); // → needsProfile gate
  });

  it('session persists across service instances (A2/A4)', async () => {
    await auth.verifyEmailCode('cam@test.dev', '123456');
    const restored = await new MockAuthService().restoreSession();
    expect(restored?.email).toBe('cam@test.dev');
  });

  it('returning user with a completed profile skips profile setup', async () => {
    await auth.verifyEmailCode('cam@test.dev', '123456');
    await auth.updateProfile({ displayName: 'Cam', username: 'cam' });
    const again = await auth.verifyEmailCode('cam@test.dev', '999999');
    expect(auth.isProfileComplete(again)).toBe(true);
  });

  it('signOut clears only the session', async () => {
    await auth.verifyEmailCode('cam@test.dev', '123456');
    await AsyncStorage.setItem('marianito:entries', '[]'); // journal data survives
    await auth.signOut();
    expect(await auth.restoreSession()).toBeNull();
    expect(await AsyncStorage.getItem('marianito:entries')).toBe('[]');
  });

  it('updateProfile without a session throws', async () => {
    await expect(auth.updateProfile({ displayName: 'X' })).rejects.toThrow('No session');
  });
});
