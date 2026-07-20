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
    const { data: mine, error: mErr } = await supabase
      .from('entry_participants')
      .select('entry_id')
      .eq('user_id', userId);
    if (mErr) throw new Error(mErr.message);
    const ids = (mine ?? []).map((r) => r.entry_id as string);
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
    const { data, error } = await supabase
      .from('entries')
      .select(ENTRY_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toEntry(data as EntryRow) : null;
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
}
