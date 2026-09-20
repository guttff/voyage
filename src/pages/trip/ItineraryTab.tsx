import { Corners } from '../../components/Blueprint';
import { Icon } from '../../components/Icon';
import { BudgetCheckCard } from '../../components/BudgetCheckCard';
import { CATS, CAT_KEYS, total } from '../../lib/constants';
import { addDays, dayLabel, diffDays, fmt, fmt2, initial } from '../../lib/format';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { ActiveVac } from '../../state/derive';
import type { Item, Option, Vacation } from '../../lib/types';

export function ItineraryTab({
  vac,
  opt,
  activeVac,
}: {
  vac: Vacation;
  opt: Option;
  activeVac: ActiveVac;
}) {
  const { updOpt, log, me } = useStore();
  const ui = useUi();

  const nDays = diffDays(vac.start, vac.end) + 1;
  const oTotal = total(opt);

  const byDate: Record<string, Item[]> = {};
  opt.items.forEach((i) => (byDate[i.date] = byDate[i.date] || []).push(i));

  const removeItem = (i: Item) => {
    updOpt(vac.id, opt.id, (x) => ({ ...x, items: x.items.filter((y) => y.id !== i.id) }));
    log(`${me.name} removed “${i.title}” from ${opt.name}`);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(220px,300px)',
        gap: 'var(--space-4)',
        alignItems: 'start',
      }}
      className="vy-itinerary"
    >
      <div className="blueprint" style={{ display: 'flex', flexDirection: 'column' }}>
        <Corners />

        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-divider)', overflowX: 'auto' }}>
          {vac.options.map((op) => {
            const on = op.id === opt.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => ui.setActiveOpt(op.id)}
                aria-current={on ? 'true' : undefined}
                style={{
                  font: 'inherit',
                  background: on ? 'var(--color-accent-100)' : 'transparent',
                  border: 0,
                  borderRight: '1px solid var(--color-divider)',
                  borderBottom: `2px solid ${on ? 'var(--color-accent-700)' : 'transparent'}`,
                  padding: '10px 16px',
                  color: on ? 'var(--color-accent-800)' : 'var(--color-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                  minWidth: 110,
                }}
              >
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16, lineHeight: 1 }}>
                  {op.name}
                </span>
                <span style={{ fontSize: 11, opacity: 0.75 }}>
                  {op.final ? `${op.items.length} items · merged` : `${op.author} · ${op.items.length} items`}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-3) var(--space-4) 0',
            gap: 'var(--space-3)',
          }}
        >
          <div className="text-muted" style={{ fontSize: 12 }}>
            {opt.final
              ? 'The merged plan. Copy items here from any option; the budget uses this cost.'
              : `${opt.author}’s plan. Anyone can add here; copy the good parts into Final.`}
          </div>
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                ui.setExportOptId(opt.id);
                ui.setTab('io');
              }}
            >
              Export
            </button>
            <button
              type="button"
              className="btn btn-primary blueprint"
              onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: null })}
            >
              <Corners />+ Add item
            </button>
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: nDays }, (_, k) => {
            const date = addDays(vac.start, k);
            // Timed items first in clock order; untimed ones fall to the end.
            const items = (byDate[date] || [])
              .slice()
              .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
            const dayTotal = items.reduce((a, b) => a + Number(b.cost), 0);
            return (
              <div
                key={date}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px minmax(0,1fr)',
                  gap: 'var(--space-3)',
                  position: 'relative',
                  paddingBottom: 'var(--space-3)',
                }}
              >
                <div style={{ position: 'absolute', left: 15, top: 30, bottom: 0, width: 1, background: 'var(--color-text)' }} />
                <div
                  style={{
                    width: 30,
                    height: 30,
                    border: '1px solid var(--color-text)',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    background: 'var(--color-bg)',
                    position: 'relative',
                  }}
                >
                  {String(k + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', height: 30 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{dayLabel(date)}</span>
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {items.length ? fmt2(dayTotal) : ''}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: null, date })}
                      style={{ fontSize: 12, padding: '0 6px', marginLeft: 'auto' }}
                    >
                      + Add to this day
                    </button>
                  </div>

                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="vy-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '20px minmax(0,1fr) auto',
                        gap: 10,
                        alignItems: 'start',
                        padding: '7px 6px',
                        borderTop: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)',
                      }}
                    >
                      <Icon d={CATS[i.cat].icon} size={17} style={{ marginTop: 1 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{i.title}</span>
                          <span className="text-muted" style={{ fontSize: 11 }}>
                            {i.time}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {i.note}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: 'var(--color-accent-800)',
                              color: 'var(--color-bg)',
                              fontSize: 9,
                              fontWeight: 700,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {initial(i.by)}
                          </span>
                          <span className="text-muted" style={{ fontSize: 11 }}>
                            {i.from ? `${i.by} · from ${i.from}` : i.by}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt2(i.cost)}</span>
                        <div className="vy-act" style={{ display: 'flex', gap: 2 }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => ui.openPanel({ kind: 'copy', optId: opt.id, itemId: i.id })}
                            style={{ fontSize: 11, padding: '0 5px' }}
                          >
                            Copy to…
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: i.id })}
                            style={{ fontSize: 11, padding: '0 5px' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => removeItem(i)}
                            style={{ fontSize: 11, padding: '0 5px', color: 'var(--color-neutral-700)' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="card blueprint">
            <Corners />
            <div className="card-kicker">Cost · {opt.name}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 600, lineHeight: 1 }}>
              {fmt(oTotal)}
            </div>
            <div className="card-meta">{fmt(oTotal / 2)} each</div>
          </div>
          <div className="card blueprint">
            <Corners />
            <div className="card-kicker">Days</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 600, lineHeight: 1 }}>
              {activeVac.days}
            </div>
            <div className="card-meta">{fmt(oTotal / nDays)} / day</div>
          </div>
        </div>

        <div className="blueprint" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
          <Corners />
          {CAT_KEYS.map((k) => (
            <div
              key={k}
              style={{
                padding: '10px 6px',
                borderRight: '1px solid var(--color-divider)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Icon d={CATS[k].icon} />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-neutral-700)',
                }}
              >
                {CATS[k].label}
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>
                {fmt(opt.items.filter((i) => i.cat === k).reduce((a, b) => a + Number(b.cost), 0))}
              </span>
            </div>
          ))}
        </div>

        <BudgetCheckCard vac={activeVac} withVerdict />
      </div>
    </div>
  );
}
