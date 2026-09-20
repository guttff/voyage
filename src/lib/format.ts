const DAY = 864e5;

export const uid = () => Math.random().toString(36).slice(2, 9);

/** Whole dollars, with a proper minus sign for negatives. */
export const fmt = (n: number) =>
  (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');

/** Exact dollars and cents — used wherever an item's own price is shown. */
export const fmt2 = (n: number | string) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** yyyy-mm-dd at local midnight, so day arithmetic never crosses a timezone. */
export const D = (isoDate: string) => new Date(isoDate + 'T00:00:00');

/** Local calendar date as yyyy-mm-dd (toISOString would shift east of UTC). */
export const iso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const addDays = (s: string, n: number) => {
  const d = D(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const diffDays = (a: string, b: string) => Math.round((D(b).getTime() - D(a).getTime()) / DAY);

export const short = (s: string) => D(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const shortY = (s: string) =>
  D(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const dayLabel = (s: string) =>
  D(s).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

/** Today, recomputed on read so a long-lived tab doesn't get stuck on yesterday. */
export const today = () => iso(new Date());

export const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return 'now';
  if (m < 60) return m + 'm ago';
  if (m < 1440) return Math.round(m / 60) + 'h ago';
  return Math.round(m / 1440) + 'd ago';
};

export const initial = (n: string | null | undefined) => (n || '?')[0].toUpperCase();

export const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
