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

/** "07:15" -> "7:15 AM". Returns '' for an unset or malformed time. */
export const time12 = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  if (!m) return '';
  const h = Number(m[1]);
  if (h > 23 || Number(m[2]) > 59) return '';
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

/** 120 -> "2 hrs", 90 -> "1 hr 30 min", 45 -> "45 min". '' when unset. */
export const durationLabel = (min?: number) => {
  if (!min || min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const parts = [];
  if (h) parts.push(`${h} ${h === 1 ? 'hr' : 'hrs'}`);
  if (m) parts.push(`${m} min`);
  return parts.join(' ');
};

/** Reads a duration from imported JSON: 90, "90", "90 min", "2 hrs", "1h30m". */
export const parseDuration = (v: unknown): number | undefined => {
  if (typeof v === 'number') return v > 0 ? Math.round(v) : undefined;
  const t = String(v ?? '').trim().toLowerCase();
  if (!t) return undefined;
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(+t) || undefined;
  let total = 0;
  for (const [, n, unit] of t.matchAll(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/g)) {
    total += +n * (unit.startsWith('h') ? 60 : 1);
  }
  return total > 0 ? Math.round(total) : undefined;
};

/** Normalises an incoming time to 24h "HH:mm": "5:00 AM", "5 PM", "17:30". */
export const parseTime = (v: unknown): string => {
  const t = String(v ?? '').trim().toLowerCase();
  if (!t) return '';
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(t);
  if (!m) return '';
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (min > 59) return '';
  if (m[3]) {
    if (h < 1 || h > 12) return '';
    h = (h % 12) + (m[3] === 'pm' ? 12 : 0);
  } else if (h > 23) return '';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};
