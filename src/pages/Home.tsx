import { useMemo } from 'react';
import { Corners } from '../components/Blueprint';
import { ImageSlot } from '../components/ImageSlot';
import { ago, diffDays, fmt, today } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { budgetSummary, runSimulation, upcoming, vacRow } from '../state/derive';

/** Circumference of the r=52 progress ring: 2πr. */
const RING = 326.7;

export function Home() {
  const { data } = useStore();
  const ui = useUi();
  const sim = useMemo(() => runSimulation(data), [data]);

  const duoClass = data.duotone ? 'duotone' : '';
  const next = upcoming(data.vacations)[0] || data.vacations[0];
  const nextRow = next ? vacRow(next, sim) : null;
  const summary = budgetSummary(data, sim);
  const [p1, p2] = data.people;

  const target = next ? sim.perVac[next.id].cost : 0;
  const pct = target ? Math.min(1, data.budget.saved / target) : 0;

  const hour = new Date().getHours();
  const greeting = `Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${p1.name}${p2 ? ' & ' + p2.name : ''}`;
  const latest = data.activity[0];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ margin: 0 }}>{greeting}</h2>
          <div className="text-muted">
            {next
              ? `${next.name} is ${Math.max(0, diffDays(today(), next.start))} days away.`
              : 'No trips yet — create one.'}
          </div>
        </div>
        <button type="button" className="btn btn-primary blueprint" onClick={() => ui.openPanel({ kind: 'newvac' })}>
          <Corners />+ New trip
        </button>
      </div>

      {next && nextRow && (
        <div className="blueprint" style={{ position: 'relative', height: 300, background: 'var(--color-accent-800)' }}>
          <Corners />
          <div className={duoClass} style={{ position: 'absolute', inset: 0 }}>
            <ImageSlot id={`cover-${next.id}`} shape="rect" placeholder={`Drop a photo of ${next.name}`} />
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, color-mix(in srgb,var(--color-accent-900) 85%,transparent) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 'var(--space-6)',
              right: 'var(--space-6)',
              bottom: 'var(--space-6)',
              color: 'var(--color-bg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 'var(--space-4)',
              pointerEvents: 'none',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent-200)',
                }}
              >
                Next trip · in {nextRow.daysUntil} days
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 44, lineHeight: 1 }}>
                {next.name}
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {nextRow.range} · {nextRow.days} days · {nextRow.cost} planned
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary blueprint"
              onClick={() => ui.openTrip(next.id)}
              style={{ pointerEvents: 'auto' }}
            >
              <Corners />
              Open trip
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--space-4)' }}>
        <div className="card blueprint" style={{ alignItems: 'center', textAlign: 'center', gap: 'var(--space-3)' }}>
          <Corners />
          <div className="card-kicker" style={{ alignSelf: 'flex-start' }}>
            Travel fund
          </div>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-accent-200)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="10"
                strokeDasharray={`${(pct * RING).toFixed(1)} ${RING}`}
                strokeLinecap="butt"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 26, lineHeight: 1 }}>
                  {Math.round(pct * 100)}%
                </div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  of next trip
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, lineHeight: 1 }}>
              {summary.saved}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              saved · {fmt(target)} needed by {nextRow ? nextRow.startShort : '—'}
            </div>
          </div>
        </div>

        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Contribution plan</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 30, lineHeight: 1 }}>
            {summary.couple}
          </div>
          <div className="card-body">every 2 weeks · {summary.split}</div>
          <div className="card-meta">Next payday {summary.nextPay}</div>
          <button type="button" className="btn btn-ghost" onClick={() => ui.go('budget')} style={{ alignSelf: 'flex-start' }}>
            Manage
          </button>
        </div>

        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Budget check</div>
          {data.vacations.map((vac) => {
            const r = vacRow(vac, sim);
            return (
              <div
                key={vac.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  padding: '4px 0',
                  borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)',
                }}
              >
                <span style={{ fontWeight: 700 }}>{r.name}</span>
                <span className="text-muted" style={{ fontSize: 11, marginRight: 'auto' }}>
                  {r.startShort}
                </span>
                <span className={`tag ${r.tagClass}`} style={{ fontSize: 10, padding: '1px 7px' }}>
                  {r.verdictShort}
                </span>
              </div>
            );
          })}
          <div className="card-meta">{latest ? `${latest.text} · ${ago(latest.t)}` : ''}</div>
        </div>
      </div>
    </>
  );
}
