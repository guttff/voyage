import { addDays, iso, today } from './format';
import { total } from './constants';
import type { Budget, Rule, Vacation } from './types';

export type PlanCost = { cost: number; src: string };

export type VacBalance = {
  /** Fund balance the day the trip starts, before it is charged. */
  before: number;
  cost: number;
  after: number;
  src: string;
};

export type MonthPoint = {
  key: string;
  label: string;
  bal: number;
  trip?: Vacation;
};

export type Simulation = {
  months: MonthPoint[];
  perVac: Record<string, VacBalance>;
  /** The contribution rule in force today. */
  cur: Rule;
  nextPay: string;
};

/**
 * What a trip actually costs the fund: the Final plan once it has anything in
 * it, otherwise the priciest option, so the check errs on the expensive side.
 */
export function planCost(v: Vacation): PlanCost {
  const f = v.options[0];
  if (f && f.items.length) return { cost: total(f), src: 'Final' };
  const best = v.options
    .slice(1)
    .filter((o) => o.items.length)
    .sort((a, b) => total(b) - total(a))[0];
  return best ? { cost: total(best), src: best.name + ' (Final is empty)' } : { cost: 0, src: 'nothing planned' };
}

const FALLBACK_RULE: Rule = { id: 'r0', from: '2020-01-01', p1: 0, p2: 0 };

/**
 * Walks the fund forward day by day in events: a contribution every 14 days at
 * whatever rule is in force, and every trip charged in full on its start date.
 * Past contributions are assumed to be inside `budget.saved` already, so the
 * run starts at the next payday on or after today.
 */
export function simulate(budget: Budget, vacations: Vacation[]): Simulation {
  const TODAY = today();
  const rules = [...budget.rules].sort((a, b) => a.from.localeCompare(b.from));
  if (!rules.length) rules.push(FALLBACK_RULE);

  const start = new Date();
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 12);

  const lastTrip = vacations.map((v) => v.start).sort().pop() || TODAY;
  const simEnd = lastTrip > iso(end) ? lastTrip : iso(end);

  type Event = { date: string; amt: number; vac?: Vacation; src?: string };
  const events: Event[] = [];

  let d = rules[0].from;
  while (d < TODAY) d = addDays(d, 14);
  const nextPay = d;

  for (; d <= simEnd; d = addDays(d, 14)) {
    const r = rules.filter((x) => x.from <= d).pop() || rules[0];
    events.push({ date: d, amt: (Number(r.p1) || 0) + (Number(r.p2) || 0) });
  }

  vacations.forEach((v) => {
    const pc = planCost(v);
    events.push({ date: v.start, amt: -pc.cost, vac: v, src: pc.src });
  });

  // Same-day ties resolve spend-first, so a trip is never paid for by a
  // contribution that lands the morning it starts.
  events.sort((a, b) => a.date.localeCompare(b.date) || a.amt - b.amt);

  let bal = Number(budget.saved) || 0;
  const perVac: Record<string, VacBalance> = {};
  const monthEnd: Record<string, number> = {};

  events.forEach((e) => {
    if (e.vac) perVac[e.vac.id] = { before: bal, cost: -e.amt, after: bal + e.amt, src: e.src || '' };
    bal += e.amt;
    monthEnd[e.date.slice(0, 7)] = bal;
  });

  const months: MonthPoint[] = [];
  let run = Number(budget.saved) || 0;
  const m = new Date(start);
  for (let i = 0; i < 12; i++) {
    const key = iso(m).slice(0, 7);
    if (monthEnd[key] !== undefined) run = monthEnd[key];
    months.push({
      key,
      label: m.toLocaleDateString('en-US', { month: 'short' }) + (m.getMonth() === 0 ? ' ' + key.slice(2, 4) : ''),
      bal: run,
      trip: vacations.find((v) => v.start.slice(0, 7) === key),
    });
    m.setMonth(m.getMonth() + 1);
  }

  // Trips beyond the simulated window still need a verdict.
  vacations.forEach((v) => {
    if (!perVac[v.id]) perVac[v.id] = { before: bal, cost: 0, after: bal, src: 'nothing planned' };
  });

  const cur = rules.filter((r) => r.from <= TODAY).pop() || rules[0];
  return { months, perVac, cur, nextPay };
}
