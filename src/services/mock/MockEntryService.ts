import { ME_ID, SEED_ENTRIES } from '@/mocks/seed';
import { EntryService } from '@/services/types';
import { DistributiveOmit, Entry, EntryAppend } from '@/types/models';
import { newId } from '@/utils/id';
import { isMarianitoHour } from '@/utils/marianitoHour';
import { load, save } from './storage';

const KEY = 'entries';

export class MockEntryService implements EntryService {
  private async all(): Promise<Entry[]> {
    const stored = await load<Entry[]>(KEY);
    if (stored) return stored;
    await save(KEY, SEED_ENTRIES);
    return SEED_ENTRIES;
  }

  async create(input: {
    photoUri: string;
    caption: string;
    location: string | null;
    participantIds: string[];
    startedAt: string;
  }): Promise<Entry> {
    const now = new Date().toISOString();
    const entry: Entry = {
      id: newId(),
      photoUri: input.photoUri,
      caption: input.caption,
      location: input.location,
      initiatorId: ME_ID,
      participantIds: [ME_ID, ...input.participantIds],
      appends: [],
      startedAt: input.startedAt,
      isMarianitoHour: isMarianitoHour(input.startedAt), // E2 — computed once, stored
      createdAt: now,
    };
    const all = await this.all();
    await save(KEY, [entry, ...all]);
    return entry;
  }

  /** D1: the journal shows every entry the current user participates in. */
  async list(): Promise<Entry[]> {
    const all = await this.all();
    return all
      .filter((e) => e.participantIds.includes(ME_ID))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Entry | null> {
    const all = await this.all();
    return all.find((e) => e.id === id) ?? null;
  }

  async addAppend(entryId: string, append: DistributiveOmit<EntryAppend, 'id' | 'createdAt'>): Promise<Entry> {
    const all = await this.all();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Entry not found');
    const full = { ...append, id: newId(), createdAt: new Date().toISOString() } as EntryAppend;
    const next = { ...all[idx], appends: [...all[idx].appends, full] };
    const copy = [...all];
    copy[idx] = next;
    await save(KEY, copy);
    return next;
  }
}
