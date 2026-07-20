import { FriendService } from '@/services/types';
import { Friend } from '@/types/models';
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
  async list(): Promise<Friend[]> {
    const userId = await requireUserId();
    const { friendIds, blockedIds } = await myEdges(userId);
    if (friendIds.size === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [...friendIds]);
    if (error) throw new Error(error.message);
    return (data as ProfileRow[])
      .filter((p) => !blockedIds.has(p.id))
      .map((p) => toFriend(p, { isFriend: true, isBlocked: false }))
      .sort(nearbyFirst);
  }

  async search(query: string): Promise<Friend[]> {
    const userId = await requireUserId();
    const { friendIds, blockedIds } = await myEdges(userId);
    let q = supabase.from('profiles').select('*').neq('id', userId).limit(50);
    const trimmed = query.trim();
    if (trimmed) q = q.or(`display_name.ilike.%${trimmed}%,username.ilike.%${trimmed}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as ProfileRow[])
      .filter((p) => !blockedIds.has(p.id) && (p.username ?? '').length > 0)
      .map((p) => toFriend(p, { isFriend: friendIds.has(p.id), isBlocked: false }))
      .sort(nearbyFirst);
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
