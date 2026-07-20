import { useTableStore } from '../useTableStore';

// The table draft: openedAt capture (drives E2), selection, and the
// no-draft edge case behind the "can't select anyone" bug.
describe('useTableStore', () => {
  beforeEach(() => {
    useTableStore.getState().reset();
  });

  it('open captures openedAt for Marianito Hour semantics', () => {
    useTableStore.getState().open('2026-07-20T13:30:00');
    expect(useTableStore.getState().draft).toEqual({
      openedAt: '2026-07-20T13:30:00',
      participantIds: [],
    });
  });

  it('toggleParticipant selects and deselects', () => {
    const store = useTableStore.getState();
    store.open('2026-07-20T18:00:00');
    useTableStore.getState().toggleParticipant('f1');
    useTableStore.getState().toggleParticipant('f2');
    expect(useTableStore.getState().draft?.participantIds).toEqual(['f1', 'f2']);
    useTableStore.getState().toggleParticipant('f1');
    expect(useTableStore.getState().draft?.participantIds).toEqual(['f2']);
  });

  it('toggling the same person from two list rows stays one selection', () => {
    useTableStore.getState().open('2026-07-20T18:00:00');
    useTableStore.getState().toggleParticipant('f1'); // tap in Nearby section
    useTableStore.getState().toggleParticipant('f1'); // tap the Friends copy
    // second tap deselects — same person, not a duplicate
    expect(useTableStore.getState().draft?.participantIds).toEqual([]);
  });

  it('toggleParticipant without a draft is a safe no-op (refresh bug)', () => {
    expect(useTableStore.getState().draft).toBeNull();
    useTableStore.getState().toggleParticipant('f1');
    expect(useTableStore.getState().draft).toBeNull();
  });

  it('reset discards the draft when the flow is abandoned', () => {
    useTableStore.getState().open();
    useTableStore.getState().toggleParticipant('f1');
    useTableStore.getState().reset();
    expect(useTableStore.getState().draft).toBeNull();
  });
});
