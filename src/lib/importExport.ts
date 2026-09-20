import { ALIAS, CATS } from './constants';
import { addDays, diffDays, fmt2, shortY, uid } from './format';
import type { CatKey, Item, Option, OptionJson, Vacation } from './types';

export function toOptionJson(v: Vacation, o: Option): OptionJson {
  return {
    schema: 'voyage.option.v1',
    vacation: v.name,
    name: o.name,
    author: o.author || 'Both',
    start: v.start,
    end: v.end,
    currency: 'USD',
    items: o.items.map((i) => ({
      day: diffDays(v.start, i.date) + 1,
      date: i.date,
      time: i.time || '',
      category: i.cat,
      title: i.title,
      note: i.note || '',
      cost: Number(i.cost) || 0,
    })),
  };
}

export type ImportResult =
  | { ok: false; msg: string; count: 0; items?: undefined; name?: undefined; author?: undefined }
  | { ok: true; msg: string; count: number; items: Item[]; name?: string; author: string };

type Loose = Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * Reads the export schema, plus the looser shapes a chat model tends to
 * produce: a bare array, `itinerary` instead of `items`, `name`/`description`/
 * `price` instead of `title`/`note`/`cost`, `"$1,200"` instead of 1200, and
 * category words the app doesn't use. Anything it can't place lands in
 * Activities on a day inside the trip, and the message says how many.
 */
export function parseImport(text: string, v: Vacation): ImportResult {
  const t = text.trim();
  if (!t) return { ok: false, msg: 'Waiting for JSON…', count: 0 };

  let j: unknown;
  try {
    j = JSON.parse(t);
  } catch (e) {
    return { ok: false, msg: 'Not valid JSON: ' + (e as Error).message, count: 0 };
  }

  const root = (j || {}) as Loose;
  if (root.schema === 'voyage.backup.v1')
    return { ok: false, msg: 'This is a full backup — restore it from Settings.', count: 0 };

  const list = Array.isArray(j)
    ? (j as Loose[])
    : Array.isArray(root.items)
      ? (root.items as Loose[])
      : Array.isArray(root.itinerary)
        ? (root.itinerary as Loose[])
        : null;
  if (!list) return { ok: false, msg: 'Expected an "items" array.', count: 0 };

  const days = diffDays(v.start, v.end) + 1;
  let clamped = 0;
  let unknown = 0;

  const items: Item[] = list
    .filter((x) => x && (x.title || x.name))
    .map((x) => {
      let date = typeof x.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) ? x.date : null;
      if (!date) {
        let day = Number(x.day) || 1;
        if (day < 1 || day > days) {
          clamped++;
          day = Math.min(Math.max(day, 1), days);
        }
        date = addDays(v.start, day - 1);
      }

      const raw = String(x.category ?? x.type ?? 'activity').toLowerCase();
      let cat: CatKey;
      if (raw in CATS) cat = raw as CatKey;
      else if (ALIAS[raw]) cat = ALIAS[raw];
      else {
        unknown++;
        cat = 'activity';
      }

      return {
        id: uid(),
        date,
        time: str(x.time),
        cat,
        title: str(x.title) || str(x.name),
        note: str(x.note) || str(x.description),
        cost: Number(String(x.cost ?? x.price ?? 0).replace(/[^0-9.]/g, '')) || 0,
        by: str(root.author) || str(x.author) || 'Import',
      };
    });

  const notes = [
    clamped && `${clamped} moved into trip dates`,
    unknown && `${unknown} unknown categories → Activities`,
  ]
    .filter(Boolean)
    .join(' · ');

  if (!items.length) return { ok: false, msg: 'No items with a title.', count: 0 };

  return {
    ok: true,
    items,
    name: str(root.name) || undefined,
    author: str(root.author) || 'Import',
    count: items.length,
    msg: `${items.length} items · ${fmt2(items.reduce((a, b) => a + b.cost, 0))} total${notes ? ' · ' + notes : ''}`,
  };
}

/** The copy-ready brief that makes a chat model answer in the import schema. */
export function chatPrompt(v: Vacation): string {
  const nDays = diffDays(v.start, v.end) + 1;
  const schema = JSON.stringify({
    schema: 'voyage.option.v1',
    name: 'Option 3',
    author: 'ChatGPT',
    items: [
      {
        day: 1,
        time: '07:15',
        category: 'flight|hotel|transport|food|activity',
        title: 'string',
        note: 'string',
        cost: 0,
      },
    ],
  });
  return `Plan a ${nDays}-day trip to ${v.name} for two adults, ${shortY(v.start)} to ${shortY(v.end)}. Include flights, lodging, transport, notable meals and activities with realistic USD costs for both people combined. Return ONLY JSON in this exact shape (day 1 = ${shortY(v.start)}): ${schema}`;
}
