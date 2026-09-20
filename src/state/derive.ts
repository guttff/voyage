import { simulate } from '../lib/budget';
import type { Simulation } from '../lib/budget';
import { diffDays, fmt, short, shortY, today } from '../lib/format';
import type { AppData, Vacation } from '../lib/types';

export type VacRow = {
  id: string;
  name: string;
  range: string;
  startShort: string;
  days: number;
  cost: string;
  optCount: number;
  daysUntil: number;
  /** "Covered · $1,200 left" / "Short by $340" / "Nothing planned" */
  verdict: string;
  /** The same call, short enough for a list row. */
  verdictShort: string;
  /** Badge tone. Status colour is never the only signal — the text says it too. */
  tone: 'good' | 'critical' | 'neutral';
};

export function vacRow(vac: Vacation, sim: Simulation): VacRow {
  const p = sim.perVac[vac.id];
  const ok = p.after >= 0;
  return {
    id: vac.id,
    name: vac.name,
    range: `${short(vac.start)} – ${short(vac.end)}`,
    startShort: short(vac.start),
    days: diffDays(vac.start, vac.end) + 1,
    cost: fmt(p.cost),
    optCount: vac.options.length,
    daysUntil: Math.max(0, diffDays(today(), vac.start)),
    verdict: p.cost ? (ok ? `Covered · ${fmt(p.after)} left` : `Short by ${fmt(-p.after)}`) : 'Nothing planned',
    verdictShort: p.cost ? (ok ? 'Covered' : `Short ${fmt(-p.after)}`) : 'No plan',
    tone: !p.cost ? 'neutral' : ok ? 'good' : 'critical',
  };
}

export type ActiveVac = VacRow & {
  balanceBefore: string;
  balanceAfter: string;
  /** Which plan the trip cost was taken from. */
  costSrc: string;
};

export function activeVacRow(vac: Vacation, sim: Simulation): ActiveVac {
  const pv = sim.perVac[vac.id];
  return {
    ...vacRow(vac, sim),
    range: `${shortY(vac.start)} – ${shortY(vac.end)}`,
    balanceBefore: fmt(pv.before),
    balanceAfter: fmt(pv.after),
    costSrc: pv.src,
  };
}

export type BudgetSummary = {
  saved: string;
  couple: string;
  month: string;
  split: string;
  nextPay: string;
};

/** Contributions land every 14 days, so a month is 26/12 of a cycle. */
export function budgetSummary(data: AppData, sim: Simulation): BudgetSummary {
  const cur = sim.cur;
  const couple = (Number(cur.p1) || 0) + (Number(cur.p2) || 0);
  const [p1, p2] = data.people;
  return {
    saved: fmt(data.budget.saved),
    couple: fmt(couple),
    month: fmt((couple * 26) / 12),
    split: `${p1.name} ${fmt(cur.p1)} · ${p2 ? p2.name + ' ' + fmt(cur.p2) : ''}`.trim(),
    nextPay: shortY(sim.nextPay),
  };
}

/** Trips that haven't finished yet, soonest first. */
export function upcoming(vacations: Vacation[]): Vacation[] {
  const t = today();
  return [...vacations].filter((v) => v.end >= t).sort((a, b) => a.start.localeCompare(b.start));
}

export const runSimulation = (data: AppData): Simulation => simulate(data.budget, data.vacations);
