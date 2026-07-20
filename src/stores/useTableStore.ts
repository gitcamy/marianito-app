import { create } from 'zustand';
import { TableDraft } from '@/types/models';

interface TableState {
  draft: TableDraft | null;
  /** Captures openedAt the moment the table opens — this drives E2. */
  open: (openedAtOverride?: string) => void;
  toggleParticipant: (id: string) => void;
  reset: () => void;
}

export const useTableStore = create<TableState>((set) => ({
  draft: null,

  open: (openedAtOverride) =>
    set({ draft: { openedAt: openedAtOverride ?? new Date().toISOString(), participantIds: [] } }),

  toggleParticipant: (id) =>
    set((s) => {
      if (!s.draft) return s;
      const has = s.draft.participantIds.includes(id);
      return {
        draft: {
          ...s.draft,
          participantIds: has
            ? s.draft.participantIds.filter((p) => p !== id)
            : [...s.draft.participantIds, id],
        },
      };
    }),

  reset: () => set({ draft: null }),
}));
