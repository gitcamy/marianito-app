import AsyncStorage from '@react-native-async-storage/async-storage';
import { ME_ID } from '@/mocks/seed';
import { MockEntryService } from '../MockEntryService';

// C1–C4, D1, E2: co-authored entries, appends, journal filtering, MH flag
describe('MockEntryService', () => {
  let entries: MockEntryService;

  beforeEach(async () => {
    await AsyncStorage.clear();
    entries = new MockEntryService();
  });

  const input = {
    photoUri: 'file:///photo.jpg',
    caption: 'Vermut!',
    location: null,
    participantIds: ['f1', 'f2'],
    startedAt: '2026-07-20T18:00:00',
  };

  it('creates an entry with the initiator included in participants (C4)', async () => {
    const entry = await entries.create(input);
    expect(entry.initiatorId).toBe(ME_ID);
    expect(entry.participantIds).toEqual([ME_ID, 'f1', 'f2']);
  });

  it('stamps isMarianitoHour from the table-open time, not post time (E2)', async () => {
    const outside = await entries.create(input);
    const during = await entries.create({ ...input, startedAt: '2026-07-20T13:30:00' });
    expect(outside.isMarianitoHour).toBe(false);
    expect(during.isMarianitoHour).toBe(true);
  });

  it('location is optional and never blocks posting (C5)', async () => {
    const entry = await entries.create({ ...input, location: 'Plaza Nueva' });
    expect(entry.location).toBe('Plaza Nueva');
    const bare = await entries.create({ ...input, location: null });
    expect(bare.location).toBeNull();
  });

  it('list returns only entries the current user participates in (D1)', async () => {
    const listed = await entries.list();
    // every seeded + created entry must include ME_ID
    expect(listed.length).toBeGreaterThan(0);
    for (const e of listed) expect(e.participantIds).toContain(ME_ID);
  });

  it('newest entries come first', async () => {
    const created = await entries.create(input);
    const listed = await entries.list();
    expect(listed[0].id).toBe(created.id);
  });

  it('addAppend attaches a comment with author attribution (C3)', async () => {
    const entry = await entries.create(input);
    const updated = await entries.addAppend(entry.id, {
      authorId: 'f1',
      kind: 'comment',
      text: 'Unbeatable olives',
    });
    expect(updated.appends).toHaveLength(1);
    expect(updated.appends[0]).toMatchObject({ authorId: 'f1', kind: 'comment' });
  });

  it('addAppend on a missing entry throws', async () => {
    await expect(
      entries.addAppend('nope', { authorId: ME_ID, kind: 'comment', text: 'x' }),
    ).rejects.toThrow();
  });

  it('hide removes the entry from my journal only (soft delete)', async () => {
    const entry = await entries.create(input);
    await entries.hide(entry.id);
    const listed = await entries.list();
    expect(listed.some((e) => e.id === entry.id)).toBe(false);
    expect(await entries.get(entry.id)).toBeNull();
    // Co-authors would still see it — the entry row itself remains with all participants.
    const allStored = JSON.parse((await AsyncStorage.getItem('marianito:entries'))!) as {
      id: string;
      participantIds: string[];
    }[];
    const stored = allStored.find((e) => e.id === entry.id);
    expect(stored?.participantIds).toEqual([ME_ID, 'f1', 'f2']);
  });

  it('leave removes me from participants and the journal', async () => {
    const entry = await entries.create(input);
    await entries.leave(entry.id);
    expect(await entries.get(entry.id)).toBeNull();
    expect((await entries.list()).some((e) => e.id === entry.id)).toBe(false);
    const allStored = JSON.parse((await AsyncStorage.getItem('marianito:entries'))!) as {
      id: string;
      participantIds: string[];
    }[];
    const stored = allStored.find((e) => e.id === entry.id);
    expect(stored?.participantIds).toEqual(['f1', 'f2']);
  });

  it('update edits caption and location', async () => {
    const entry = await entries.create(input);
    const updated = await entries.update(entry.id, {
      caption: 'Updated caption',
      location: 'Plaza Nueva',
    });
    expect(updated.caption).toBe('Updated caption');
    expect(updated.location).toBe('Plaza Nueva');
  });

  it('updateAppend and deleteAppend work for my comments', async () => {
    const entry = await entries.create(input);
    const withComment = await entries.addAppend(entry.id, {
      authorId: ME_ID,
      kind: 'comment',
      text: 'First take',
    });
    const appendId = withComment.appends[0].id;
    const edited = await entries.updateAppend(entry.id, appendId, { text: 'Second take' });
    expect(edited.appends[0]).toMatchObject({ kind: 'comment', text: 'Second take' });
    const cleared = await entries.deleteAppend(entry.id, appendId);
    expect(cleared.appends).toHaveLength(0);
  });
});
