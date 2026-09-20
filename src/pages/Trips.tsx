import { useMemo, useState } from 'react';
import { Corners } from '../components/Blueprint';
import { ImageSlot } from '../components/ImageSlot';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { runSimulation, vacRow } from '../state/derive';

export function Trips() {
  const { data } = useStore();
  const ui = useUi();
  const [search, setSearch] = useState('');
  const sim = useMemo(() => runSimulation(data), [data]);

  const duoClass = data.duotone ? 'duotone' : '';
  const rows = data.vacations
    .map((v) => vacRow(v, sim))
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ margin: 0 }}>My trips</h2>
          <div className="text-muted">Plan, compare and build each trip together.</div>
        </div>
        <button type="button" className="btn btn-primary blueprint" onClick={() => ui.openPanel({ kind: 'newvac' })}>
          <Corners />+ New trip
        </button>
      </div>

      <input
        className="input"
        placeholder="Search destinations…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 360 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 'var(--space-4)' }}>
        {rows.map((v) => (
          <div
            key={v.id}
            className="blueprint vy-tripcard"
            style={{ display: 'flex', flexDirection: 'column', background: 'transparent' }}
          >
            <Corners />
            <div className={duoClass} style={{ height: 150, background: 'var(--color-accent-100)' }}>
              <ImageSlot id={`cover-${v.id}`} shape="rect" placeholder={`Drop a photo of ${v.name}`} />
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, lineHeight: 1 }}>
                  {v.name}
                </span>
                <span style={{ fontWeight: 700 }}>{v.cost}</span>
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {v.range} · {v.days} days · {v.optCount} plans
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span className={`tag ${v.tagClass}`}>{v.verdict}</span>
                <button type="button" className="btn btn-secondary" onClick={() => ui.openTrip(v.id)}>
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => ui.openPanel({ kind: 'newvac' })}
          className="blueprint"
          style={{
            minHeight: 240,
            display: 'grid',
            placeItems: 'center',
            font: 'inherit',
            color: 'var(--color-accent-700)',
            background: 'transparent',
            borderStyle: 'dashed',
          }}
        >
          <Corners />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, lineHeight: 1 }}>+</div>
            <div style={{ fontWeight: 700 }}>Create new trip</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              or import one from JSON
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
