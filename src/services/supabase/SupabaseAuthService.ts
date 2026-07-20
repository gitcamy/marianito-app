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
  /** One form serves both: try sign-up, fall back to sign-in for existing accounts. */
  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      const alreadyExists = /already registered|already exists/i.test(error.message);
      if (!alreadyExists) throw new Error(error.message);
      const signIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signIn.error) throw new Error(signIn.error.message);
      return fetchProfile(signIn.data.user.id);
    }
    if (!data.user || !data.session) {
      throw new Error(
        'Sign-up needs email confirmation. Disable "Confirm email" in Supabase Auth settings for the MVP.',
      );
    }
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
