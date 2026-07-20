import { isMarianitoHour } from '../marianitoHour';

// E2: a table opened between 13:00 (inclusive) and 14:00 (exclusive) local time
describe('isMarianitoHour', () => {
  it('is false just before 1pm', () => {
    expect(isMarianitoHour('2026-07-20T12:59:59')).toBe(false);
  });

  it('is true at exactly 1pm', () => {
    expect(isMarianitoHour('2026-07-20T13:00:00')).toBe(true);
  });

  it('is true just before 2pm', () => {
    expect(isMarianitoHour('2026-07-20T13:59:59')).toBe(true);
  });

  it('is false at exactly 2pm', () => {
    expect(isMarianitoHour('2026-07-20T14:00:00')).toBe(false);
  });
});
