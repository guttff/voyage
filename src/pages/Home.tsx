import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { ImageSlot } from '../components/ImageSlot';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ago, diffDays, fmt, today } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { budgetSummary, runSimulation, upcoming, vacRow } from '../state/derive';

export function Home() {
  const { data } = useStore();
  const ui = useUi();
  const sim = useMemo(() => runSimulation(data), [data]);

  const next = upcoming(data.vacations)[0] || data.vacations[0];
  const nextRow = next ? vacRow(next, sim) : null;
  const summary = budgetSummary(data, sim);
  const [p1, p2] = data.people;

  const target = next ? sim.perVac[next.id].cost : 0;
  const pct = target ? Math.min(1, data.budget.saved / target) : 0;
  const shortfall = Math.max(0, target - data.budget.saved);

  const hour = new Date().getHours();
  const greeting = `Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${p1.name}${p2 ? ' & ' + p2.name : ''}`;

  if (!next) {
    return (
      <div className="card">
        <EmptyState
          icon="trips"
          title="Nothing planned yet"
          body="Create your first trip. You'll each get your own plan to build, and a shared final itinerary to merge the best parts into."
          action={
            <button type="button" className="btn btn-primary" onClick={() => ui.openPanel({ kind: 'newvac' })}>
              <Icon name="plus" size={14} />
              New trip
            </button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>{greeting}</h1>
          <p>
            {next.name} is {Math.max(0, diffDays(today(), next.start))} days away.
          </p>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-kpi">
        <section className="card">
          <span className="label">Travel fund</span>
          <span className="stat-value num">{summary.saved}</span>
          <Meter pct={pct} tone={nextRow!.tone} />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {Math.round(pct * 100)}% of {fmt(target)} needed by {nextRow!.startShort}
            {shortfall > 0 && (
              <>
                {' · '}
                <strong style={{ color: 'var(--critical-text)' }}>{fmt(shortfall)} to go</strong>
              </>
            )}
          </span>
        </section>

        <section className="card">
          <span className="label">Contributions</span>
          <span className="stat-value num">{summary.couple}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>every 2 weeks · {summary.split}</span>
          <span className="card-meta" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 'auto' }}>
            Next payday {summary.nextPay}
          </span>
        </section>

        <section className="card">
          <span className="label">Per month</span>
          <span className="stat-value num">{summary.month}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>averaged across 26 pay cycles a year</span>
          <button type="button" className="btn btn-sm" onClick={() => ui.go('budget')} style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
            <Icon name="budget" size={13} />
            Manage fund
          </button>
        </section>

        <section className="card">
          <span className="label">Trips planned</span>
          <span className="stat-value num">{data.vacations.length}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {data.vacations.filter((v) => sim.perVac[v.id].after >= 0 && sim.perVac[v.id].cost > 0).length} covered by the
            fund
          </span>
          <button type="button" className="btn btn-sm" onClick={() => ui.go('trips')} style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
            <Icon name="trips" size={13} />
            All trips
          </button>
        </section>
      </div>

      {/* ── next trip ── */}
      <section className="hero" style={{ minHeight: 280 }}>
        <div className={`hero-media${data.duotone ? ' tint' : ''}`}>
          <ImageSlot id={`cover-${next.id}`} shape="rect" placeholder={`Add a photo of ${next.name}`} onDark />
        </div>
        <div className="hero-shade" />
        <div className="hero-body" style={{ minHeight: 280 }}>
          <div>
            <div className="hero-kicker">Next trip · in {nextRow!.daysUntil} days</div>
            <div className="hero-title">{next.name}</div>
            <div className="hero-meta">
              {nextRow!.range} · {nextRow!.days} days · {nextRow!.cost} planned
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <Badge tone={nextRow!.tone}>{nextRow!.verdict}</Badge>
            <button type="button" className="btn btn-primary" onClick={() => ui.openTrip(next.id)}>
              Open trip
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-2">
        {/* ── affordability by trip ── */}
        <section className="card card-flush">
          <header className="card-hd">
            <h3>Can we afford it?</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => ui.go('budget')}>
              Projection
            </button>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Departs</th>
                <th className="n">Planned</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {data.vacations.map((vac) => {
                const r = vacRow(vac, sim);
                return (
                  <tr key={vac.id} onClick={() => ui.openTrip(vac.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td className="muted">{r.startShort}</td>
                    <td className="n">{r.cost}</td>
                    <td>
                      <Badge tone={r.tone} small>
                        {r.verdictShort}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ── activity ── */}
        <section className="card card-flush">
          <header className="card-hd">
            <h3>Recent activity</h3>
          </header>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            {data.activity.length === 0 && <span className="muted">Nothing yet.</span>}
            {data.activity.slice(0, 7).map((a, i) => (
              <div key={`${a.t}-${i}`} style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'baseline', fontSize: 13 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    flex: 'none',
                    borderRadius: '50%',
                    background: 'var(--accent-500)',
                    transform: 'translateY(-1px)',
                  }}
                />
                <span style={{ flex: 1 }}>{a.text}</span>
                <span className="subtle" style={{ fontSize: 11, flex: 'none' }}>
                  {ago(a.t)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

/** Ratio against a limit — same-ramp track, severity in the fill. */
function Meter({ pct, tone }: { pct: number; tone: 'good' | 'critical' | 'neutral' }) {
  return (
    <div
      style={{ height: 8, borderRadius: 4, background: 'var(--accent-100)', overflow: 'hidden' }}
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          width: `${Math.max(2, pct * 100)}%`,
          height: '100%',
          borderRadius: 4,
          background: tone === 'critical' ? 'var(--critical)' : 'var(--accent-600)',
          transition: 'width .3s',
        }}
      />
    </div>
  );
}
