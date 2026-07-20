const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(iso: string): string {
  return MONTHS[new Date(iso).getMonth()];
}

/** e.g. "Sunday 20 July, 13:24" */
export function entryDateLabel(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/** Distinct month chips for the journal, newest first, keyed "YYYY-M". */
export function monthKeys(isos: string[]): { key: string; label: string }[] {
  const seen = new Map<string, number>();
  for (const iso of isos) {
    const d = new Date(iso);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const sort = d.getFullYear() * 12 + d.getMonth();
    if (!seen.has(key)) seen.set(key, sort);
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => {
      const [, m] = key.split('-');
      return { key, label: MONTHS[Number(m)] };
    });
}

export function monthKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}
