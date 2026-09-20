import type { AppData, Item } from './types';

/**
 * Position of an item within its day.
 *
 * The prototype derived order purely from `time`, which leaves a manual
 * reorder nowhere to live. Items now carry an explicit `order`, seeded from
 * time — so an existing plan, a fresh import and the sample data all read
 * exactly as they did — and a drag sets it outright. Time still decides where
 * a newly added item lands; after that the position is the user's.
 */

/** Untimed items fall to the end of the day. */
export const byTime = (a: Item, b: Item) => (a.time || '99').localeCompare(b.time || '99');

export const sortDay = (items: Item[]) =>
  items.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || byTime(a, b));

const groupByDate = (items: Item[]) => {
  const m = new Map<string, Item[]>();
  items.forEach((i) => {
    const l = m.get(i.date);
    if (l) l.push(i);
    else m.set(i.date, [i]);
  });
  return m;
};

/** Give every item an explicit position, derived from the time-based order. */
export function withOrders(items: Item[]): Item[] {
  const out: Item[] = [];
  for (const list of groupByDate(items).values()) {
    list.sort(byTime).forEach((i, idx) => out.push({ ...i, order: idx }));
  }
  return out;
}

/**
 * Put `item` into `date` at `index`, or at its time position when the index is
 * 'byTime'. Returns the whole list with that day renumbered 0..n, which keeps
 * the orders integral no matter how many times something is dragged.
 */
export function placeInDay(all: Item[], item: Item, date: string, index: number | 'byTime'): Item[] {
  const rest = all.filter((i) => i.id !== item.id);
  const day = sortDay(rest.filter((i) => i.date === date));
  const moved = { ...item, date };

  const at =
    index === 'byTime'
      ? (() => {
          const found = day.findIndex((i) => byTime(moved, i) < 0);
          return found === -1 ? day.length : found;
        })()
      : Math.max(0, Math.min(index, day.length));

  day.splice(at, 0, moved);
  return [...rest.filter((i) => i.date !== date), ...day.map((i, idx) => ({ ...i, order: idx }))];
}

/** Append imported items after whatever already sits on each of their days. */
export function appendItems(existing: Item[], incoming: Item[]): Item[] {
  let out = existing;
  for (const i of withOrders(incoming)) out = placeInDay(out, i, i.date, 'byTime');
  return out;
}

/** One-time upgrade for data saved before items carried a position. */
export const normalizeData = (d: AppData): AppData => ({
  ...d,
  vacations: d.vacations.map((v) => ({
    ...v,
    options: v.options.map((o) => ({ ...o, items: withOrders(o.items) })),
  })),
});
