import { ME_ID } from '@/mocks/seed';
import { AuthService } from '@/services/types';
import { User } from '@/types/models';
import { load, remove, save } from './storage';

const KEY = 'user';

export class MockAuthService implements AuthService {
  async signUp(email: string, _password: string): Promise<User> {
    const user: User = {
      id: ME_ID,
      email: email.trim().toLowerCase(),
      displayName: '',
      username: '',
      avatarUri: null,
      createdAt: new Date().toISOString(),
    };
    await save(KEY, user);
    return user;
  }

  async restoreSession(): Promise<User | null> {
    return load<User>(KEY);
  }

  async updateProfile(patch: Partial<Pick<User, 'displayName' | 'username' | 'avatarUri'>>): Promise<User> {
    const user = await load<User>(KEY);
    if (!user) throw new Error('No session');
    const next = { ...user, ...patch };
    await save(KEY, next);
    return next;
  }

  isProfileComplete(user: User): boolean {
    return user.displayName.length > 0 && user.username.length > 0;
  }

  async signOut(): Promise<void> {
    // Only the session is cleared — journal/friends survive for the same mock user.
    await remove(KEY);
  }
}
