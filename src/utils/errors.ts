/**
 * Turn backend/internal errors into copy fit for humans. The raw error is
 * logged (dev only) so debugging info is never lost — it just stays out of
 * the UI. Messages we authored in the service layer (short, no jargon) pass
 * through untouched; anything database-flavoured gets the fallback.
 */
const JARGON = [
  'row-level security',
  'violates',
  'policy',
  'constraint',
  'duplicate key',
  'column',
  'relation',
  'schema',
  'sql',
  'pgrst',
  'jwt',
  'supabase',
  'rpc',
  'upstream',
  'gateway',
];

export function friendlyMessage(e: unknown, fallback: string): string {
  const raw = e instanceof Error ? e.message : String(e ?? '');
  if (__DEV__ && raw) console.warn('[marianito] error:', raw);

  const lower = raw.toLowerCase();
  if (!raw) return fallback;
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('timeout')) {
    return 'Network hiccup — check your connection and try again.';
  }
  if (JARGON.some((word) => lower.includes(word))) return fallback;
  if (raw.length > 100) return fallback;
  return raw; // our own service-layer messages are already human
}
