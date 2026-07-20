import { monthKeyOf, monthKeys } from '../dates';

// D3: month filter chips are derived from real entry dates, newest first
describe('monthKeys', () => {
  it('derives distinct months newest-first', () => {
    const keys = monthKeys([
      '2026-06-21T13:30:00',
      '2026-07-05T13:12:00',
      '2026-07-12T18:35:00',
    ]);
    expect(keys.map((k) => k.label)).toEqual(['July', 'June']);
  });

  it('spans years correctly', () => {
    const keys = monthKeys(['2025-12-31T10:00:00', '2026-01-01T10:00:00']);
    expect(keys.map((k) => k.label)).toEqual(['January', 'December']);
    expect(keys[0].key).toBe('2026-0');
    expect(keys[1].key).toBe('2025-11');
  });

  it('is empty for no entries', () => {
    expect(monthKeys([])).toEqual([]);
  });
});

describe('monthKeyOf', () => {
  it('matches the keys produced by monthKeys', () => {
    const iso = '2026-07-05T13:12:00';
    expect(monthKeyOf(iso)).toBe(monthKeys([iso])[0].key);
  });
});
