import { Icon } from '../../components/Icon';
import { BudgetCheckCard } from '../../components/BudgetCheckCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { CATS, CAT_KEYS, total } from '../../lib/constants';
import { addDays, dayLabel, diffDays, fmt, fmt2, initial } from '../../lib/format';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { ActiveVac } from '../../state/derive';
import type { Item, Option, Vacation } from '../../lib/types';

export function ItineraryTab({ vac, opt, activeVac }: { vac: Vacation; opt: Option; activeVac: ActiveVac }) {
  const { updOpt, log, me } = useStore();
  const ui = useUi();
  const toast = useToast();

  const nDays = diffDays(vac.start, vac.end) + 1;
  const oTotal = total(opt);

  const byDate: Record<string, Item[]> = {};
  opt.items.forEach((i) => (byDate[i.date] = byDate[i.date] || []).push(i));

  const removeItem = (i: Item) => {
    updOpt(vac.id, opt.id, (x) => ({ ...x, items: x.items.filter((y) => y.id !== i.id) }));
    log(`${me.name} removed “${i.title}” from ${opt.name}`);
    toast(`Removed “${i.title}”`, 'critical');
  };

  const maxCat = Math.max(
    1,
    ...CAT_KEYS.map((k) => opt.items.filter((i) => i.cat === k).reduce((a, b) => a + Number(b.cost), 0)),
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(240px,320px)', gap: 'var(--s4)', alignItems: 'start' }} className="itin">
      <section className="card card-flush">
        {/* plan switcher */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
          {vac.options.map((op) => {
            const on = op.id === opt.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => ui.setActiveOpt(op.id)}
                aria-pressed={on}
                style={{
                  flex: 'none',
                  minWidth: 132,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                  padding: '10px 14px',
                  font: 'inherit',
                  textAlign: 'left',
                  color: on ? 'var(--accent-800)' : 'var(--text-2)',
                  background: on ? 'var(--accent-50)' : 'transparent',
                  border: 0,
                  borderRight: '1px solid var(--border)',
                  borderBottom: `2px solid ${on ? 'var(--accent-700)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{op.name}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>
                  {op.final ? `${op.items.length} items · merged` : `${op.author} · ${op.items.length} items`}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s3)',
            padding: 'var(--s3) var(--s4)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
        >
          <span className="muted" style={{ fontSize: 12 }}>
            {opt.final
              ? 'The merged plan — the budget uses this cost.'
              : `${opt.author}’s plan. Copy the good parts into Final.`}
          </span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flex: 'none' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                ui.setExportOptId(opt.id);
                ui.setTab('io');
              }}
            >
              <Icon name="upload" size={13} />
              Export
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: null })}
            >
              <Icon name="plus" size={13} />
              Add item
            </button>
          </div>
        </div>

        <div className="card-bd">
          {opt.items.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nothing planned yet"
              body={`Add flights, lodging and the things you want to do. Day 1 is ${dayLabel(vac.start)}.`}
              action={
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: null })}
                >
                  <Icon name="plus" size={14} />
                  Add the first item
                </button>
              }
            />
          ) : (
            Array.from({ length: nDays }, (_, k) => {
              const date = addDays(vac.start, k);
              // Timed items in clock order; untimed ones fall to the end.
              const items = (byDate[date] || []).slice().sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
              const dayTotal = items.reduce((a, b) => a + Number(b.cost), 0);
              return (
                <div key={date} className={`day${items.length ? ' day-has' : ''}`}>
                  <div className="day-rule" />
                  <div className="day-num">{k + 1}</div>
                  <div>
                    <div className="day-hd">
                      <span className="t">{dayLabel(date)}</span>
                      {items.length > 0 && (
                        <span className="subtle num" style={{ fontSize: 12 }}>
                          {fmt2(dayTotal)}
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: null, date })}
                        style={{ marginLeft: 'auto' }}
                      >
                        <Icon name="plus" size={12} />
                        Add
                      </button>
                    </div>

                    {items.map((i) => (
                      <div key={i.id} className="item">
                        <span className="item-cat">
                          <Icon d={CATS[i.cat].icon} size={15} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="item-title">{i.title}</span>
                            {i.time && (
                              <span className="subtle num" style={{ fontSize: 11 }}>
                                {i.time}
                              </span>
                            )}
                          </div>
                          {i.note && <div className="item-note">{i.note}</div>}
                          <div className="item-by">
                            <span className="chip">{initial(i.by)}</span>
                            {i.from ? `${i.by} · from ${i.from}` : i.by}
                          </div>
                        </div>
                        <div className="item-right">
                          <span className="item-cost">{fmt2(i.cost)}</span>
                          <div className="item-acts">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title="Copy to another plan"
                              onClick={() => ui.openPanel({ kind: 'copy', optId: opt.id, itemId: i.id })}
                            >
                              <Icon name="copy" size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title="Edit"
                              onClick={() => ui.openPanel({ kind: 'add', optId: opt.id, editId: i.id })}
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title="Remove"
                              onClick={() => removeItem(i)}
                              style={{ color: 'var(--critical-text)' }}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
          <section className="card card-tight">
            <span className="label">{opt.name} total</span>
            <span className="stat-value num">{fmt(oTotal)}</span>
            <span className="subtle" style={{ fontSize: 12 }}>
              {fmt(oTotal / 2)} each
            </span>
          </section>
          <section className="card card-tight">
            <span className="label">Per day</span>
            <span className="stat-value num">{fmt(oTotal / nDays)}</span>
            <span className="subtle" style={{ fontSize: 12 }}>
              over {activeVac.days} days
            </span>
          </section>
        </div>

        <section className="card card-flush">
          <header className="card-hd">
            <h3>Where the money goes</h3>
          </header>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CAT_KEYS.map((k) => {
              const v = opt.items.filter((i) => i.cat === k).reduce((a, b) => a + Number(b.cost), 0);
              return (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 'var(--s2)', alignItems: 'center' }}>
                  <Icon d={CATS[k].icon} size={14} stroke="var(--text-3)" />
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 3 }}>{CATS[k].label}</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${(v / maxCat) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--accent-500)' }} />
                    </div>
                  </div>
                  <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>
                    {fmt(v)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <BudgetCheckCard vac={activeVac} withVerdict />
      </div>
    </div>
  );
}
