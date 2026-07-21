export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string; // stored without the @
  avatarUri: string | null;
  createdAt: string; // ISO
}

export interface Friend {
  id: string;
  displayName: string;
  username: string;
  avatarUri: string | null;
  /** Simulated presence flag (C2) — real geo-presence comes later. */
  isNearby: boolean;
  /** false = discoverable person not yet in the friend list */
  isFriend: boolean;
  isBlocked: boolean;
  /** Manually added person with no account; owned by the user who created them. */
  isGuest?: boolean;
}

/** In-memory draft while the table modal flow is open. */
export interface TableDraft {
  openedAt: string; // ISO — captured on "+ Open a table"; drives E2
  participantIds: string[]; // tagged friends (excludes self)
}

/** Omit that distributes over union members (plain Omit collapses the union). */
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type EntryAppend =
  | { id: string; authorId: string; kind: 'comment'; text: string; createdAt: string }
  | { id: string; authorId: string; kind: 'photo'; photoUri: string; createdAt: string };

export interface Entry {
  id: string;
  photoUri: string; // the single v1 photo
  caption: string;
  location: string | null; // optional, never blocks posting (C5)
  initiatorId: string;
  participantIds: string[]; // ALL participants incl. initiator (C4, D1)
  appends: EntryAppend[]; // co-signer additions (C3)
  startedAt: string; // = TableDraft.openedAt
  isMarianitoHour: boolean; // E2, computed once at creation
  createdAt: string;
}

export interface Settings {
  discoverablePresence: boolean; // G1 — appear in others' "nearby" surfaces (not your own view)
  locationConsent: boolean; // G2
  notificationsEnabled: boolean; // G3 (UI only this iteration)
  /** Appear in other users' people lists (RLS-enforced). Off → friends/table-mates only. */
  discoverableToAll: boolean;
}
