import { SEED_FRIENDS } from '@/mocks/seed';
import { FriendService } from '@/services/types';
import { Friend } from '@/types/models';
import { newId } from '@/utils/id';
import { load, save } from './storage';

const KEY = 'friends';
const REPORTS_KEY = 'reports';

export class MockFriendService implements FriendService {
  private async all(): Promise<Friend[]> {
    const stored = await load<Friend[]>(KEY);
    if (stored) return stored;
    await save(KEY, SEED_FRIENDS);
    return SEED_FRIENDS;
  }

  /** Friends first (nearby before the rest), blocked hidden. */
  async list(): Promise<Friend[]> {
    const all = await this.all();
    return all
      .filter((f) => !f.isBlocked && f.isFriend)
      .sort((a, b) => Number(b.isNearby) - Number(a.isNearby));
  }

  /** Searches all discoverable people (not just friends) so auto-add is visible. */
  async search(query: string): Promise<Friend[]> {
    const q = query.trim().toLowerCase();
    const all = await this.all();
    const visible = all.filter((f) => !f.isBlocked);
    if (!q) return visible.sort((a, b) => Number(b.isNearby) - Number(a.isNearby));
    return visible.filter(
      (f) => f.displayName.toLowerCase().includes(q) || f.username.toLowerCase().includes(q),
    );
  }

  async profiles(ids: string[]): Promise<Friend[]> {
    const all = await this.all();
    return all.filter((f) => ids.includes(f.id));
  }

  async ensureFriends(ids: string[]): Promise<void> {
    const all = await this.all();
    const next = all.map((f) => (ids.includes(f.id) ? { ...f, isFriend: true } : f));
    await save(KEY, next);
  }

  async block(id: string): Promise<void> {
    const all = await this.all();
    await save(KEY, all.map((f) => (f.id === id ? { ...f, isBlocked: true } : f)));
  }

  async unblock(id: string): Promise<void> {
    const all = await this.all();
    await save(KEY, all.map((f) => (f.id === id ? { ...f, isBlocked: false } : f)));
  }

  async listBlocked(): Promise<Friend[]> {
    const all = await this.all();
    return all.filter((f) => f.isBlocked);
  }

  async report(subjectId: string | null, reason: string): Promise<void> {
    const reports = (await load<object[]>(REPORTS_KEY)) ?? [];
    reports.push({ id: newId(), subjectId, reason, createdAt: new Date().toISOString() });
    await save(REPORTS_KEY, reports);
  }
}
