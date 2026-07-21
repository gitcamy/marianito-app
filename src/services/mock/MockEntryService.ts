import { ME_ID, SEED_ENTRIES } from '@/mocks/seed';
import { EntryService } from '@/services/types';
import { DistributiveOmit, Entry, EntryAppend } from '@/types/models';
import { newId } from '@/utils/id';
import { isMarianitoHour } from '@/utils/marianitoHour';
import { load, save } from './storage';

const KEY = 'entries';
const HIDES_KEY = 'entry_hides';

export class MockEntryService implements EntryService {
  private async all(): Promise<Entry[]> {
    const stored = await load<Entry[]>(KEY);
    if (stored) return stored;
    await save(KEY, SEED_ENTRIES);
    return SEED_ENTRIES;
  }

  private async write(all: Entry[]): Promise<void> {
    await save(KEY, all);
  }

  private async hiddenIds(): Promise<Set<string>> {
    return new Set((await load<string[]>(HIDES_KEY)) ?? []);
  }

  private async addHide(entryId: string): Promise<void> {
    const hides = await this.hiddenIds();
    hides.add(entryId);
    await save(HIDES_KEY, [...hides]);
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
    await this.write([entry, ...all]);
    return entry;
  }

  /** D1: journal = participant + not soft-deleted for me. */
  async list(): Promise<Entry[]> {
    const [all, hides] = await Promise.all([this.all(), this.hiddenIds()]);
    return all
      .filter((e) => e.participantIds.includes(ME_ID) && !hides.has(e.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Entry | null> {
    const [all, hides] = await Promise.all([this.all(), this.hiddenIds()]);
    const entry = all.find((e) => e.id === id);
    if (!entry) return null;
    if (hides.has(id)) return null;
    if (!entry.participantIds.includes(ME_ID)) return null;
    return entry;
  }

  async update(
    entryId: string,
    patch: Partial<Pick<Entry, 'caption' | 'location' | 'photoUri'>>,
  ): Promise<Entry> {
    const all = await this.all();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Entry not found');
    if (!all[idx].participantIds.includes(ME_ID)) throw new Error('Not a participant');
    const next = {
      ...all[idx],
      ...(patch.caption !== undefined ? { caption: patch.caption } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.photoUri !== undefined ? { photoUri: patch.photoUri } : {}),
    };
    const copy = [...all];
    copy[idx] = next;
    await this.write(copy);
    return next;
  }

  async hide(entryId: string): Promise<void> {
    const entry = (await this.all()).find((e) => e.id === entryId);
    if (!entry) throw new Error('Entry not found');
    if (!entry.participantIds.includes(ME_ID)) throw new Error('Not a participant');
    await this.addHide(entryId);
  }

  async leave(entryId: string): Promise<void> {
    const all = await this.all();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Entry not found');
    if (!all[idx].participantIds.includes(ME_ID)) throw new Error('Not a participant');
    const next = {
      ...all[idx],
      participantIds: all[idx].participantIds.filter((id) => id !== ME_ID),
    };
    const copy = [...all];
    copy[idx] = next;
    await this.write(copy);
  }

  async addAppend(
    entryId: string,
    append: DistributiveOmit<EntryAppend, 'id' | 'createdAt'>,
  ): Promise<Entry> {
    const all = await this.all();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Entry not found');
    const full = { ...append, id: newId(), createdAt: new Date().toISOString() } as EntryAppend;
    const next = { ...all[idx], appends: [...all[idx].appends, full] };
    const copy = [...all];
    copy[idx] = next;
    await this.write(copy);
    return next;
  }

  async updateAppend(
    entryId: string,
    appendId: string,
    patch: { text?: string; photoUri?: string },
  ): Promise<Entry> {
    const all = await this.all();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Entry not found');
    const target = all[idx].appends.find((a) => a.id === appendId);
    if (!target) throw new Error('Append not found');
    if (target.authorId !== ME_ID) throw new Error('Not your append');
    const appends = all[idx].appends.map((a) => {
      if (a.id !== appendId) return a;
      if (a.kind === 'comment') return { ...a, text: patch.text ?? a.text };
      return { ...a, photoUri: patch.photoUri ?? a.photoUri };
    });
    const next = { ...all[idx], appends };
    const copy = [...all];
    copy[idx] = next;
    await this.write(copy);
    return next;
  }

  async deleteAppend(entryId: string, appendId: string): Promise<Entry> {
    const all = await this.all();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Entry not found');
    const target = all[idx].appends.find((a) => a.id === appendId);
    if (!target) throw new Error('Append not found');
    if (target.authorId !== ME_ID) throw new Error('Not your append');
    const next = {
      ...all[idx],
      appends: all[idx].appends.filter((a) => a.id !== appendId),
    };
    const copy = [...all];
    copy[idx] = next;
    await this.write(copy);
    return next;
  }
}
