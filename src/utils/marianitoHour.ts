/** E2: a table started between 13:00 (incl.) and 14:00 (excl.) device-local is Marianito Hour. */
export function isMarianitoHour(startedAtIso: string): boolean {
  return new Date(startedAtIso).getHours() === 13;
}
