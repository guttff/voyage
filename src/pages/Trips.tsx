import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ImageSlot } from '../components/ImageSlot';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { runSimulation, vacRow } from '../state/derive';

export function Trips() {
  const { data } = useStore();
  const ui = useUi();
  const [search, setSearch] = useState('');
  const sim = useMemo(() => runSimulation(data), [data]);

  const rows = data.vacations
    .map((v) => vacRow(v, sim))
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>Trips</h1>
          <p>Plan, compare and build each trip together.</p>
        </div>
        <div style={{ position: 'relative', width: 280, maxWidth: '45vw' }}>
          <Icon
            name="search"
            size={15}
            stroke="var(--text-3)"
            style={{ position: 'absolute', left: 10, top: 10, pointerEvents: 'none' }}
          />
          <input
            className="input"
            placeholder="Search destinations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
            aria-label="Search destinations"
          />
        </div>
      </div>

      {rows.length === 0 && search.trim() !== '' && (
        <div className="card">
          <EmptyState icon="search" title={`No trips match “${search.trim()}”`} body="Try a different destination name." />
        </div>
      )}

      <div className="grid grid-cards">
        {rows.map((v) => (
          <article key={v.id} className="trip-card">
            <div className={`trip-card-media${data.duotone ? ' tint' : ''}`}>
              <ImageSlot id={`cover-${v.id}`} shape="rect" placeholder={`Add a photo of ${v.name}`} onDark />
            </div>
            <div className="trip-card-bd">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--s2)' }}>
                <h3 style={{ fontSize: 16 }}>{v.name}</h3>
                <span className="num" style={{ fontWeight: 700 }}>
                  {v.cost}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {v.range} · {v.days} days · {v.optCount} plans
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 'var(--s2)' }}>
                <Badge tone={v.tone} small>
                  {v.verdictShort}
                </Badge>
                <button type="button" className="btn btn-sm" onClick={() => ui.openTrip(v.id)}>
                  Open
                  <Icon name="chevronRight" size={13} />
                </button>
              </div>
            </div>
          </article>
        ))}

        <button type="button" className="add-tile" onClick={() => ui.openPanel({ kind: 'newvac' })}>
          <Icon name="plus" size={20} />
          <span>
            <strong>Create a trip</strong>
            <span>or import one from JSON</span>
          </span>
        </button>
      </div>
    </>
  );
}
