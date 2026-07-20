import { DistributiveOmit, Entry, EntryAppend, Friend, Settings, User } from '@/types/models';

/**
 * Service interfaces — the seam where Supabase replaces the mocks.
 * Every method is async even though mocks resolve instantly, so the
 * Supabase implementations drop in without signature changes.
 */

export interface AuthService {
  /** Send a one-time sign-in code to the email (creates the account if new). */
  requestEmailCode(email: string): Promise<void>;
  /** Exchange the emailed code for a session. */
  verifyEmailCode(email: string, code: string): Promise<User>;
  restoreSession(): Promise<User | null>; // A2, A4
  updateProfile(patch: Partial<Pick<User, 'displayName' | 'username' | 'avatarUri'>>): Promise<User>;
  /** true once display name + username are set (gates profile-setup screen). */
  isProfileComplete(user: User): boolean;
  signOut(): Promise<void>;
}

export interface FriendService {
  list(): Promise<Friend[]>;
  search(query: string): Promise<Friend[]>;
  /** Resolve arbitrary profile ids (e.g. entry participants) for display. */
  profiles(ids: string[]): Promise<Friend[]>;
  /** Create a guest (no account) owned by the current user and befriend them. */
  addGuest(name: string): Promise<Friend>;
  /** Record the current user's location for nearby matching (server keeps it private). */
  updatePresence(lat: number, lng: number): Promise<void>;
  /** Remove the current user's stored location (called when consent is revoked). */
  clearPresence(): Promise<void>;
  /** Everyone (friend or not) currently near the user — never their coordinates. */
  nearbyPeople(): Promise<Friend[]>;
  /** Co-authors are added to the friend list if not already present. */
  ensureFriends(ids: string[]): Promise<void>;
  block(id: string): Promise<void>;
  unblock(id: string): Promise<void>;
  listBlocked(): Promise<Friend[]>; // H1
  report(subjectId: string | null, reason: string): Promise<void>; // H2
}

export interface EntryService {
  create(input: {
    photoUri: string;
    caption: string;
    location: string | null;
    participantIds: string[]; // excluding self
    startedAt: string;
  }): Promise<Entry>;
  list(): Promise<Entry[]>; // entries where current user ∈ participantIds (D1)
  get(id: string): Promise<Entry | null>;
  addAppend(entryId: string, append: DistributiveOmit<EntryAppend, 'id' | 'createdAt'>): Promise<Entry>;
}

export interface SettingsService {
  get(): Promise<Settings>;
  update(patch: Partial<Settings>): Promise<Settings>;
}
