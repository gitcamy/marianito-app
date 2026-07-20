import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockFriendService } from '../MockFriendService';

// Guests, blocking, nearby section, co-author auto-add
describe('MockFriendService', () => {
  let friends: MockFriendService;

  beforeEach(async () => {
    await AsyncStorage.clear();
    friends = new MockFriendService();
  });

  it('list returns only friends, nearby first', async () => {
    const list = await friends.list();
    expect(list.every((f) => f.isFriend)).toBe(true);
    const firstNonNearby = list.findIndex((f) => !f.isNearby);
    const lastNearby = list.map((f) => f.isNearby).lastIndexOf(true);
    if (firstNonNearby !== -1) expect(lastNearby).toBeLessThan(firstNonNearby);
  });

  it('search finds non-friends by name (only findable via search)', async () => {
    const results = await friends.search('oier');
    expect(results.some((f) => f.username === 'oier' && !f.isFriend)).toBe(true);
  });

  it('nearbyPeople includes nearby non-friends (Nearby section)', async () => {
    const nearby = await friends.nearbyPeople();
    expect(nearby.every((f) => f.isNearby)).toBe(true);
    expect(nearby.some((f) => !f.isFriend)).toBe(true); // Nerea
    expect(nearby.some((f) => f.isFriend)).toBe(true); // Ana etc.
  });

  it('ensureFriends promotes tagged people to friends (co-author auto-add)', async () => {
    await friends.ensureFriends(['f7']); // Oier, seeded non-friend
    const list = await friends.list();
    expect(list.some((f) => f.id === 'f7')).toBe(true);
  });

  it('addGuest creates a persistent friend without an account', async () => {
    const guest = await friends.addGuest('  Aunt Maribel  ');
    expect(guest).toMatchObject({
      displayName: 'Aunt Maribel',
      isFriend: true,
      isGuest: true,
      isNearby: false,
    });
    // persists into the friend list for future tables
    const list = await friends.list();
    expect(list.some((f) => f.id === guest.id && f.isGuest)).toBe(true);
  });

  it('blocked people vanish from list, search and nearby (H1)', async () => {
    await friends.block('f1'); // Ana: nearby friend
    expect((await friends.list()).some((f) => f.id === 'f1')).toBe(false);
    expect((await friends.search('ana')).some((f) => f.id === 'f1')).toBe(false);
    expect((await friends.nearbyPeople()).some((f) => f.id === 'f1')).toBe(false);
    expect((await friends.listBlocked()).some((f) => f.id === 'f1')).toBe(true);
  });

  it('unblock restores them', async () => {
    await friends.block('f1');
    await friends.unblock('f1');
    expect((await friends.list()).some((f) => f.id === 'f1')).toBe(true);
    expect((await friends.listBlocked())).toHaveLength(0);
  });

  it('profiles resolves arbitrary ids for entry detail display', async () => {
    const people = await friends.profiles(['f1', 'f7']);
    expect(people.map((p) => p.id).sort()).toEqual(['f1', 'f7']);
  });

  it('report is stored (H2)', async () => {
    await friends.report('f7', 'spam');
    const raw = await AsyncStorage.getItem('marianito:reports');
    expect(JSON.parse(raw!)).toHaveLength(1);
  });
});
