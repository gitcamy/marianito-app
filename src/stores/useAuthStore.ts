import { create } from 'zustand';
import { auth } from '@/services';
import { User } from '@/types/models';

type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'signedIn';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  restore: () => Promise<void>;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
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

  requestCode: async (email) => {
    await auth.requestEmailCode(email);
  },

  verifyCode: async (email, code) => {
    const user = await auth.verifyEmailCode(email, code);
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
