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
  addAppend: (entryId: string, append: DistributiveOmit<EntryAppend, 'id' | 'createdAt'>) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set) => ({
  entries: [],
  loaded: false,

  refresh: async () => {
    const list = await entryService.list();
    set({ entries: list, loaded: true });
  },

  create: async (input) => {
    const entry = await entryService.create(input);
    // Journey step 11: co-authors auto-added to the friend list.
    await friendService.ensureFriends(input.participantIds);
    const list = await entryService.list();
    set({ entries: list, loaded: true });
    return entry;
  },

  addAppend: async (entryId, append) => {
    await entryService.addAppend(entryId, append);
    const list = await entryService.list();
    set({ entries: list, loaded: true });
  },
}));
