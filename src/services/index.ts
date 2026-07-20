/**
 * The swap point. With EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY set in .env the
 * app runs against the real backend; without them it falls back to the local
 * mocks so the offline demo keeps working. Screens never import services
 * directly; stores are the only callers.
 */
import { AuthService, EntryService, FriendService, SettingsService } from './types';
import { MockAuthService } from './mock/MockAuthService';
import { MockEntryService } from './mock/MockEntryService';
import { MockFriendService } from './mock/MockFriendService';
import { MockSettingsService } from './mock/MockSettingsService';
import { supabaseConfigured } from './supabase/client';
import { SupabaseAuthService } from './supabase/SupabaseAuthService';
import { SupabaseEntryService } from './supabase/SupabaseEntryService';
import { SupabaseFriendService } from './supabase/SupabaseFriendService';
import { SupabaseSettingsService } from './supabase/SupabaseSettingsService';

/** Set EXPO_PUBLIC_USE_MOCKS=1 to force the offline mock backend (demo mode). */
export const usingSupabase =
  supabaseConfigured && process.env.EXPO_PUBLIC_USE_MOCKS !== '1';

export const auth: AuthService = usingSupabase ? new SupabaseAuthService() : new MockAuthService();
export const friends: FriendService = usingSupabase
  ? new SupabaseFriendService()
  : new MockFriendService();
export const entries: EntryService = usingSupabase
  ? new SupabaseEntryService()
  : new MockEntryService();
export const settings: SettingsService = usingSupabase
  ? new SupabaseSettingsService()
  : new MockSettingsService();
