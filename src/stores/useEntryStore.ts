import { create } from 'zustand';
import { entries as entryService, friends as friendService } from '@/services';
import { DistributiveOmit, Entry, EntryAppend } from '@/types/models';

interface EntryState {
  entries: Entry[];
  loaded: boolean;
  refresh: () => Promise<void>;
  create: (input: {
    photoUri: string;
    caption: string;
    location: string | null;
    participantIds: string[];
    startedAt: string;
  }) => Promise<Entry>;
  update: (
    entryId: string,
    patch: Partial<Pick<Entry, 'caption' | 'location' | 'photoUri'>>,
  ) => Promise<void>;
  hide: (entryId: string) => Promise<void>;
  leave: (entryId: string) => Promise<void>;
  addAppend: (entryId: string, append: DistributiveOmit<EntryAppend, 'id' | 'createdAt'>) => Promise<void>;
  updateAppend: (
    entryId: string,
    appendId: string,
    patch: { text?: string; photoUri?: string },
  ) => Promise<void>;
  deleteAppend: (entryId: string, appendId: string) => Promise<void>;
}

async function reload(set: (partial: Partial<EntryState>) => void) {
  const list = await entryService.list();
  set({ entries: list, loaded: true });
}

export const useEntryStore = create<EntryState>((set) => ({
  entries: [],
  loaded: false,

  refresh: async () => {
    await reload(set);
  },

  create: async (input) => {
    const entry = await entryService.create(input);
    // Journey step 11: co-authors auto-added to the friend list.
    await friendService.ensureFriends(input.participantIds);
    await reload(set);
    return entry;
  },

  update: async (entryId, patch) => {
    await entryService.update(entryId, patch);
    await reload(set);
  },

  hide: async (entryId) => {
    await entryService.hide(entryId);
    await reload(set);
  },

  leave: async (entryId) => {
    await entryService.leave(entryId);
    await reload(set);
  },

  addAppend: async (entryId, append) => {
    await entryService.addAppend(entryId, append);
    await reload(set);
  },

  updateAppend: async (entryId, appendId, patch) => {
    await entryService.updateAppend(entryId, appendId, patch);
    await reload(set);
  },

  deleteAppend: async (entryId, appendId) => {
    await entryService.deleteAppend(entryId, appendId);
    await reload(set);
  },
}));
