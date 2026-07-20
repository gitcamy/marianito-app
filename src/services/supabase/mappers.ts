import { Entry, EntryAppend, Friend, User } from '@/types/models';

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  nearby: boolean;
  created_at: string;
}

export function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.display_name,
    username: row.username ?? '',
    avatarUri: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function toFriend(row: ProfileRow, opts: { isFriend: boolean; isBlocked: boolean }): Friend {
  return {
    id: row.id,
    displayName: row.display_name || (row.username ?? 'Someone'),
    username: row.username ?? '',
    avatarUri: row.avatar_url,
    isNearby: row.nearby,
    isFriend: opts.isFriend,
    isBlocked: opts.isBlocked,
  };
}

export interface AppendRow {
  id: string;
  entry_id: string;
  author_id: string;
  kind: 'comment' | 'photo';
  text: string | null;
  photo_url: string | null;
  created_at: string;
}

export function toAppend(row: AppendRow): EntryAppend {
  return row.kind === 'comment'
    ? { id: row.id, authorId: row.author_id, kind: 'comment', text: row.text ?? '', createdAt: row.created_at }
    : { id: row.id, authorId: row.author_id, kind: 'photo', photoUri: row.photo_url ?? '', createdAt: row.created_at };
}

export interface EntryRow {
  id: string;
  photo_url: string;
  caption: string;
  location: string | null;
  initiator_id: string;
  started_at: string;
  is_marianito_hour: boolean;
  created_at: string;
  entry_participants?: { user_id: string }[];
  entry_appends?: AppendRow[];
}

export function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    photoUri: row.photo_url,
    caption: row.caption,
    location: row.location,
    initiatorId: row.initiator_id,
    participantIds: (row.entry_participants ?? []).map((p) => p.user_id),
    appends: (row.entry_appends ?? [])
      .map(toAppend)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    startedAt: row.started_at,
    isMarianitoHour: row.is_marianito_hour,
    createdAt: row.created_at,
  };
}
