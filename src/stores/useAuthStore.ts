import { create } from 'zustand';
import { auth } from '@/services';
import { User } from '@/types/models';

type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'signedIn';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  restore: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  completeProfile: (patch: { displayName: string; username: string; avatarUri: string | null }) => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'displayName' | 'username' | 'avatarUri'>>) => Promise<void>;
  signOut: () => Promise<void>;
}

function statusFor(user: User | null): AuthStatus {
  if (!user) return 'signedOut';
  return auth.isProfileComplete(user) ? 'signedIn' : 'needsProfile';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  restore: async () => {
    const user = await auth.restoreSession();
    set({ user, status: statusFor(user) });
  },

  signUp: async (email, password) => {
    const user = await auth.signUp(email, password);
    set({ user, status: statusFor(user) });
  },

  completeProfile: async (patch) => {
    const user = await auth.updateProfile(patch);
    set({ user, status: statusFor(user) });
  },

  updateProfile: async (patch) => {
    const user = await auth.updateProfile(patch);
    set({ user, status: statusFor(user) });
  },

  signOut: async () => {
    await auth.signOut();
    set({ user: null, status: 'signedOut' });
  },
}));
