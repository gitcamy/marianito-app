import { friendlyMessage } from '../errors';

// Fix: technical backend errors must never reach the UI verbatim
describe('friendlyMessage', () => {
  const FALLBACK = 'Something went wrong.';

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // silence dev logging
  });
  afterEach(() => jest.restoreAllMocks());

  it('replaces RLS violations with the fallback', () => {
    expect(
      friendlyMessage(
        new Error('new row violates row-level security policy for table "entry_participants"'),
        FALLBACK,
      ),
    ).toBe(FALLBACK);
  });

  it('replaces schema-cache errors with the fallback', () => {
    expect(
      friendlyMessage(
        new Error("Could not find the 'created_by' column of 'profiles' in the schema cache"),
        FALLBACK,
      ),
    ).toBe(FALLBACK);
  });

  it('replaces constraint errors with the fallback', () => {
    expect(
      friendlyMessage(
        new Error('duplicate key value violates unique constraint "profiles_username_key"'),
        FALLBACK,
      ),
    ).toBe(FALLBACK);
  });

  it('maps network failures to the connection message', () => {
    expect(friendlyMessage(new Error('Failed to fetch'), FALLBACK)).toMatch(/connection/i);
    expect(friendlyMessage(new Error('Network request failed'), FALLBACK)).toMatch(/connection/i);
  });

  it('passes through our own human-authored messages', () => {
    const msg = 'That username is taken — try another.';
    expect(friendlyMessage(new Error(msg), FALLBACK)).toBe(msg);
  });

  it('falls back for empty or non-Error input', () => {
    expect(friendlyMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(friendlyMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it('falls back for overly long raw messages', () => {
    expect(friendlyMessage(new Error('x'.repeat(200)), FALLBACK)).toBe(FALLBACK);
  });
});
