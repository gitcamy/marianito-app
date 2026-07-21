import { EntryService } from '@/services/types';
import { DistributiveOmit, Entry, EntryAppend } from '@/types/models';
import { newId } from '@/utils/id';
import { isMarianitoHour } from '@/utils/marianitoHour';
import { supabase } from './client';
import { EntryRow, toEntry } from './mappers';
import { uploadPhoto } from './uploadPhoto';

const ENTRY_SELECT = '*, entry_participants(user_id), entry_appends(*)';

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('No session');
  return id;
}

export class SupabaseEntryService implements EntryService {
  async create(input: {
    photoUri: string;
    caption: string;
    location: string | null;
    participantIds: string[];
    startedAt: string;
  }): Promise<Entry> {
    const userId = await requireUserId();
    const photoUrl = await uploadPhoto(input.photoUri, userId);

    // RLS gotcha: an entry is only SELECT-visible once its participants exist,
    // so we can't insert-and-return in one call. Generate the id client-side,
    // insert blind, write participants, THEN fetch.
    const entryId = newId();
    const { error } = await supabase.from('entries').insert({
      id: entryId,
      photo_url: photoUrl,
      caption: input.caption,
      location: input.location,
      initiator_id: userId,
      started_at: input.startedAt,
      is_marianito_hour: isMarianitoHour(input.startedAt),
    });
    if (error) throw new Error(error.message);

    const participantRows = [userId, ...input.participantIds.filter((id) => id !== userId)].map(
      (id) => ({ entry_id: entryId, user_id: id }),
    );
    const { error: pErr } = await supabase.from('entry_participants').insert(participantRows);
    if (pErr) throw new Error(pErr.message);

    const full = await this.get(entryId);
    if (!full) throw new Error('Entry vanished after create');
    return full;
  }

  async list(): Promise<Entry[]> {
    const userId = await requireUserId();
    const [{ data: mine, error: mErr }, { data: hidden, error: hErr }] = await Promise.all([
      supabase.from('entry_participants').select('entry_id').eq('user_id', userId),
      supabase.from('entry_hides').select('entry_id').eq('user_id', userId),
    ]);
    if (mErr) throw new Error(mErr.message);
    if (hErr) throw new Error(hErr.message);

    const hiddenSet = new Set((hidden ?? []).map((r) => r.entry_id as string));
    const ids = (mine ?? [])
      .map((r) => r.entry_id as string)
      .filter((id) => !hiddenSet.has(id));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('entries')
      .select(ENTRY_SELECT)
      .in('id', ids)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as EntryRow[]).map(toEntry);
  }

  async get(id: string): Promise<Entry | null> {
    const userId = await requireUserId();
    const { data: hide } = await supabase
      .from('entry_hides')
      .select('entry_id')
      .eq('entry_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (hide) return null;

    const { data, error } = await supabase
      .from('entries')
      .select(ENTRY_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const entry = toEntry(data as EntryRow);
    // Left the table → treat as gone for this user (initiator RLS may still allow select).
    if (!entry.participantIds.includes(userId)) return null;
    return entry;
  }

  async update(
    entryId: string,
    patch: Partial<Pick<Entry, 'caption' | 'location' | 'photoUri'>>,
  ): Promise<Entry> {
    const userId = await requireUserId();
    const row: Record<string, unknown> = {};
    if (patch.caption !== undefined) row.caption = patch.caption;
    if (patch.location !== undefined) row.location = patch.location;
    if (patch.photoUri !== undefined) {
      row.photo_url = /^https?:/.test(patch.photoUri)
        ? patch.photoUri
        : await uploadPhoto(patch.photoUri, userId);
    }
    if (Object.keys(row).length === 0) {
      const existing = await this.get(entryId);
      if (!existing) throw new Error('Entry not found');
      return existing;
    }
    const { error } = await supabase.from('entries').update(row).eq('id', entryId);
    if (error) throw new Error(error.message);
    const full = await this.get(entryId);
    if (!full) throw new Error('Entry not found');
    return full;
  }

  async hide(entryId: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('entry_hides')
      .upsert({ entry_id: entryId, user_id: userId }, { onConflict: 'entry_id,user_id' });
    if (error) throw new Error(error.message);
  }

  async leave(entryId: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('entry_participants')
      .delete()
      .eq('entry_id', entryId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  }

  async addAppend(
    entryId: string,
    append: DistributiveOmit<EntryAppend, 'id' | 'createdAt'>,
  ): Promise<Entry> {
    const userId = await requireUserId();
    let photoUrl: string | null = null;
    if (append.kind === 'photo') {
      photoUrl = await uploadPhoto(append.photoUri, userId);
    }
    const { error } = await supabase.from('entry_appends').insert({
      entry_id: entryId,
      author_id: userId,
      kind: append.kind,
      text: append.kind === 'comment' ? append.text : null,
      photo_url: photoUrl,
    });
    if (error) throw new Error(error.message);
    const full = await this.get(entryId);
    if (!full) throw new Error('Entry not found');
    return full;
  }

  async updateAppend(
    entryId: string,
    appendId: string,
    patch: { text?: string; photoUri?: string },
  ): Promise<Entry> {
    const userId = await requireUserId();
    const row: Record<string, unknown> = {};
    if (patch.text !== undefined) row.text = patch.text;
    if (patch.photoUri !== undefined) {
      row.photo_url = /^https?:/.test(patch.photoUri)
        ? patch.photoUri
        : await uploadPhoto(patch.photoUri, userId);
    }
    const { error } = await supabase
      .from('entry_appends')
      .update(row)
      .eq('id', appendId)
      .eq('entry_id', entryId)
      .eq('author_id', userId);
    if (error) throw new Error(error.message);
    const full = await this.get(entryId);
    if (!full) throw new Error('Entry not found');
    return full;
  }

  async deleteAppend(entryId: string, appendId: string): Promise<Entry> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('entry_appends')
      .delete()
      .eq('id', appendId)
      .eq('entry_id', entryId)
      .eq('author_id', userId);
    if (error) throw new Error(error.message);
    const full = await this.get(entryId);
    if (!full) throw new Error('Entry not found');
    return full;
  }
}
