import { addDays, uid } from './format';
import type { AppData, CatKey, Item, Option, Vacation } from './types';

/** The demo set the design was built around. "Reset to sample data" restores it. */
export function seed(): AppData {
  const P1 = { id: 'p1', name: 'John', role: 'Planner & Traveler' };
  const P2 = { id: 'p2', name: 'Sarah', role: 'Planner & Traveler' };

  const it = (
    date: string,
    cat: CatKey,
    title: string,
    cost: number,
    by: string,
    extra: Partial<Item> = {},
  ): Item => ({ id: uid(), date, time: '', note: '', cat, title, cost, by, ...extra });

  const cr = '2026-11-28';

  const o1: Item[] = [
    it(cr, 'flight', 'Flight FLL → Liberia (LIR)', 789.98, 'John', { time: '07:15', note: 'Round trip for two' }),
    it(cr, 'transport', 'Uber Liberia airport → hotel', 12.45, 'John'),
    it(cr, 'hotel', 'Hotel Capitán Suizo, Tamarindo · 5 nights', 640, 'John', { note: 'Beachfront, breakfast included' }),
    it(addDays(cr, 1), 'activity', 'Surf lesson, Playa Tamarindo', 85, 'John', { time: '09:00' }),
    it(addDays(cr, 3), 'food', 'Dinner at Pangas Beach Club', 110, 'John', { time: '19:30' }),
  ];

  const o2: Item[] = [
    it(cr, 'flight', 'Flight FLL → San José (SJO)', 812, 'Sarah', { time: '10:40' }),
    it(cr, 'transport', 'Rental car, 13 days (4x4)', 310, 'Sarah', { note: 'Needed for Monteverde roads' }),
    it(addDays(cr, 2), 'hotel', 'Eco-lodge Monteverde · 4 nights', 720, 'Sarah'),
    it(addDays(cr, 3), 'activity', 'Zip-line canopy tour', 75, 'Sarah', { time: '08:00' }),
    it(addDays(cr, 6), 'hotel', 'Casa Chameleon, Las Catalinas · 5 nights', 1450, 'Sarah'),
  ];

  const fin: Item[] = [
    { ...o1[0], id: uid(), from: 'Option 1' },
    { ...o2[1], id: uid(), from: 'Option 2' },
    { ...o2[2], id: uid(), from: 'Option 2' },
    { ...o1[3], id: uid(), from: 'Option 1' },
  ];

  const mk = (name: string, start: string, end: string, a: Item[], b: Item[]): Vacation => ({
    id: uid(),
    name,
    start,
    end,
    options: [
      { id: 'final', name: 'Final', author: null, final: true, items: [] },
      { id: uid(), name: 'Option 1', author: 'John', personId: 'p1', items: a },
      { id: uid(), name: 'Option 2', author: 'Sarah', personId: 'p2', items: b },
    ],
  });

  const v1 = mk('Costa Rica', cr, '2026-12-11', o1, o2);
  v1.options[0].items = fin;

  const v2 = mk(
    'New York',
    '2027-03-12',
    '2027-03-15',
    [
      it('2027-03-12', 'flight', 'Flight FLL → JFK', 320, 'John'),
      it('2027-03-12', 'hotel', 'Hotel, Midtown · 3 nights', 980, 'John'),
    ],
    [],
  );

  const v3 = mk('Italy', '2027-06-05', '2027-06-19', [], []);

  return {
    people: [P1, P2],
    user: 'p1',
    vacations: [v1, v2, v3],
    budget: { saved: 6300, rules: [{ id: 'r1', from: '2026-01-09', p1: 450, p2: 450 }] },
    duotone: true,
    activity: [
      { t: Date.now() - 2 * 36e5, text: 'Sarah added a hotel to Option 2' },
      { t: Date.now() - 5 * 36e5, text: 'John copied “Surf lesson” to Final' },
      { t: Date.now() - 864e5, text: 'Sarah updated the budget' },
    ],
  };
}

/** A fresh trip always starts with a Final plan plus one option per traveler. */
export const newVacation = (
  name: string,
  start: string,
  end: string,
  p1: { id: string; name: string },
  p2: { id: string; name: string } | undefined,
): Vacation => {
  const options: Option[] = [
    { id: 'final', name: 'Final', author: null, final: true, items: [] },
    { id: uid(), name: 'Option 1', author: p1.name, personId: p1.id, items: [] },
  ];
  if (p2) options.push({ id: uid(), name: 'Option 2', author: p2.name, personId: p2.id, items: [] });
  return { id: uid(), name, start, end, options };
};
