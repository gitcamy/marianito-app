import { AuthService } from '@/services/types';
import { User } from '@/types/models';
import { supabase } from './client';
import { ProfileRow, toUser } from './mappers';
import { uploadPhoto } from './uploadPhoto';

async function fetchProfile(userId: string): Promise<User> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new Error(error?.message ?? 'Profile not found');
  return toUser(data as ProfileRow);
}

export class SupabaseAuthService implements AuthService {
  /** Magic-link (email OTP) auth: one flow for both sign-up and sign-in. */
  async requestEmailCode(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      // Supabase enforces a cooldown between OTP emails per address.
      const wait = /after (\d+) seconds/.exec(error.message);
      if (wait) {
        throw new Error(`Your last code is still valid — you can request a new one in ${wait[1]}s.`);
      }
      if (/rate limit/i.test(error.message)) {
        throw new Error('Too many codes requested — wait a minute and try again.');
      }
      throw new Error(error.message);
    }
  }

  async verifyEmailCode(email: string, code: string): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    if (error) {
      if (/expired|invalid/i.test(error.message)) {
        throw new Error('That code is wrong or expired — request a new one.');
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('No user in session');
    return fetchProfile(data.user.id);
  }

  async restoreSession(): Promise<User | null> {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;
    try {
      return await fetchProfile(data.session.user.id);
    } catch {
      return null;
    }
  }

  async updateProfile(
    patch: Partial<Pick<User, 'displayName' | 'username' | 'avatarUri'>>,
  ): Promise<User> {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) throw new Error('No session');

    let avatarUrl = patch.avatarUri;
    // Local picks (file:/data:/blob:) get uploaded; existing https urls pass through.
    if (avatarUrl && !/^https?:/.test(avatarUrl)) {
      avatarUrl = await uploadPhoto(avatarUrl, userId);
    }

    const row: Record<string, unknown> = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.username !== undefined) row.username = patch.username;
    if (patch.avatarUri !== undefined) row.avatar_url = avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(row)
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      if (/duplicate key|unique/i.test(error.message)) {
        throw new Error('That username is taken — try another.');
      }
      throw new Error(error.message);
    }
    return toUser(data as ProfileRow);
  }

  isProfileComplete(user: User): boolean {
    return user.displayName.length > 0 && user.username.length > 0;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
