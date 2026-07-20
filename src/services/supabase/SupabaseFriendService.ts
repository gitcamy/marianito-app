import { FriendService } from '@/services/types';
import { Friend } from '@/types/models';
import { newId } from '@/utils/id';
import { supabase } from './client';
import { ProfileRow, toFriend } from './mappers';

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('No session');
  return id;
}

async function myEdges(userId: string) {
  const [friendsRes, blocksRes] = await Promise.all([
    supabase.from('friendships').select('friend_id').eq('user_id', userId),
    supabase.from('blocks').select('blocked_id').eq('user_id', userId),
  ]);
  return {
    friendIds: new Set((friendsRes.data ?? []).map((r) => r.friend_id as string)),
    blockedIds: new Set((blocksRes.data ?? []).map((r) => r.blocked_id as string)),
  };
}

const nearbyFirst = (a: Friend, b: Friend) => Number(b.isNearby) - Number(a.isNearby);

export class SupabaseFriendService implements FriendService {
  /** Geo-matched ids from the server RPC — never coordinates. */
  private async nearbyIds(): Promise<string[]> {
    const { data, error } = await supabase.rpc('nearby_user_ids');
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) return [];
    return data
      .map((row: unknown) =>
        typeof row === 'string'
          ? row
          : String((row as Record<string, unknown>).nearby_user_ids ?? ''),
      )
      .filter(Boolean);
  }

  /**
   * Live nearby-ness: geo-matched ids from the server (never coordinates) merged
   * over the static demo flag, so seeded demo people keep working.
   */
  private async markNearby(rows: ProfileRow[], mapped: Friend[]): Promise<Friend[]> {
    const nearbySet = new Set(await this.nearbyIds().catch(() => []));
    return mapped.map((f, i) => ({
      ...f,
      isNearby: nearbySet.has(f.id) || rows[i].nearby,
    }));
  }

  async list(): Promise<Friend[]> {
    const userId = await requireUserId();
    const { friendIds, blockedIds } = await myEdges(userId);
    if (friendIds.size === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [...friendIds]);
    if (error) throw new Error(error.message);
    const rows = (data as ProfileRow[]).filter((p) => !blockedIds.has(p.id));
    const mapped = rows.map((p) => toFriend(p, { isFriend: true, isBlocked: false }));
    return (await this.markNearby(rows, mapped)).sort(nearbyFirst);
  }

  async search(query: string): Promise<Friend[]> {
    const userId = await requireUserId();
    const { friendIds, blockedIds } = await myEdges(userId);
    let q = supabase.from('profiles').select('*').neq('id', userId).limit(50);
    const trimmed = query.trim();
    if (trimmed) q = q.or(`display_name.ilike.%${trimmed}%,username.ilike.%${trimmed}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data as ProfileRow[]).filter(
      (p) =>
        !blockedIds.has(p.id) &&
        // real people need a username; guests only show to their creator
        (p.is_guest ? p.created_by === userId : (p.username ?? '').length > 0),
    );
    const mapped = rows.map((p) => toFriend(p, { isFriend: friendIds.has(p.id), isBlocked: false }));
    return (await this.markNearby(rows, mapped)).sort(nearbyFirst);
  }

  async updatePresence(lat: number, lng: number): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('presence')
      .upsert({ user_id: userId, lat, lng, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }

  async clearPresence(): Promise<void> {
    const userId = await requireUserId();
    await supabase.from('presence').delete().eq('user_id', userId);
  }

  /** Everyone nearby (friends and strangers), resolved to visible profiles. */
  async nearbyPeople(): Promise<Friend[]> {
    const userId = await requireUserId();
    const { friendIds, blockedIds } = await myEdges(userId);
    const geoIds = await this.nearbyIds().catch(() => [] as string[]);

    // Static demo-nearby profiles + live geo matches, deduped. Profiles RLS
    // already hides anyone who isn't visible to this caller.
    const byId = new Map<string, ProfileRow>();
    const { data: staticRows } = await supabase
      .from('profiles')
      .select('*')
      .eq('nearby', true)
      .neq('id', userId);
    for (const p of (staticRows ?? []) as ProfileRow[]) byId.set(p.id, p);
    if (geoIds.length) {
      const { data: geoRows } = await supabase.from('profiles').select('*').in('id', geoIds);
      for (const p of (geoRows ?? []) as ProfileRow[]) byId.set(p.id, p);
    }

    return [...byId.values()]
      .filter((p) => !blockedIds.has(p.id) && !(p.is_guest && p.created_by !== userId))
      .map((p) => ({
        ...toFriend(p, { isFriend: friendIds.has(p.id), isBlocked: false }),
        isNearby: true,
      }));
  }

  async addGuest(name: string): Promise<Friend> {
    const userId = await requireUserId();
    // Insert without returning (avoids RLS returning-visibility pitfalls);
    // we know every field, so build the Friend locally.
    const guestId = newId();
    const { error } = await supabase
      .from('profiles')
      .insert({ id: guestId, display_name: name.trim(), is_guest: true, created_by: userId });
    if (error) throw new Error(error.message);
    await this.ensureFriends([guestId]);
    return {
      id: guestId,
      displayName: name.trim(),
      username: '',
      avatarUri: null,
      isNearby: false,
      isFriend: true,
      isBlocked: false,
      isGuest: true,
    };
  }

  async profiles(ids: string[]): Promise<Friend[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
    if (error) throw new Error(error.message);
    return (data as ProfileRow[]).map((p) => toFriend(p, { isFriend: false, isBlocked: false }));
  }

  async ensureFriends(ids: string[]): Promise<void> {
    const userId = await requireUserId();
    if (ids.length === 0) return;
    const rows = ids.filter((id) => id !== userId).map((id) => ({ user_id: userId, friend_id: id }));
    if (rows.length === 0) return;
    const { error } = await supabase
      .from('friendships')
      .upsert(rows, { onConflict: 'user_id,friend_id', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  async block(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('blocks')
      .upsert({ user_id: userId, blocked_id: id }, { onConflict: 'user_id,blocked_id', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  async unblock(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('blocks').delete().match({ user_id: userId, blocked_id: id });
    if (error) throw new Error(error.message);
  }

  async listBlocked(): Promise<Friend[]> {
    const userId = await requireUserId();
    const { blockedIds } = await myEdges(userId);
    if (blockedIds.size === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [...blockedIds]);
    if (error) throw new Error(error.message);
    return (data as ProfileRow[]).map((p) => toFriend(p, { isFriend: false, isBlocked: true }));
  }

  async report(subjectId: string | null, reason: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from('reports')
      .insert({ reporter_id: userId, subject_id: subjectId, reason });
    if (error) throw new Error(error.message);
  }
}
