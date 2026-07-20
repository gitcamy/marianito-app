import { create } from 'zustand';
import { friends as friendService } from '@/services';
import { Friend } from '@/types/models';

interface FriendState {
  friends: Friend[]; // visible friend list, nearby first
  blocked: Friend[];
  refresh: () => Promise<void>;
  search: (query: string) => Promise<Friend[]>;
  profiles: (ids: string[]) => Promise<Friend[]>;
  block: (id: string) => Promise<void>;
  unblock: (id: string) => Promise<void>;
  report: (subjectId: string | null, reason: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  blocked: [],

  refresh: async () => {
    const [friends, blocked] = await Promise.all([
      friendService.list(),
      friendService.listBlocked(),
    ]);
    set({ friends, blocked });
  },

  search: (query) => friendService.search(query),

  profiles: (ids) => friendService.profiles(ids),

  block: async (id) => {
    await friendService.block(id);
    await useFriendStore.getState().refresh();
  },

  unblock: async (id) => {
    await friendService.unblock(id);
    await useFriendStore.getState().refresh();
  },

  report: (subjectId, reason) => friendService.report(subjectId, reason),
}));
