import { useCallback, useMemo } from 'react';
import { Icon } from '../../components/Icon';
import { BudgetCheckCard } from '../../components/BudgetCheckCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { useItemDrag, stepTarget } from '../../components/itinerary/useItemDrag';
import type { DayLayout, DropTarget } from '../../components/itinerary/useItemDrag';
import { CATS, CAT_KEYS, total } from '../../lib/constants';
import { addDays, dayLabel, diffDays, fmt, fmt2, initial, short } from '../../lib/format';
import { placeInDay, sortDay } from '../../lib/order';
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

  const days = useMemo(() => {
    const byDate: Record<string, Item[]> = {};
    opt.items.forEach((i) => (byDate[i.date] = byDate[i.date] || []).push(i));
    return Array.from({ length: nDays }, (_, k) => {
      const date = addDays(vac.start, k);
      return { date, n: k + 1, items: sortDay(byDate[date] || []) };
    });
  }, [opt.items, vac.start, nDays]);

  const layout: DayLayout[] = useMemo(
    () => days.map((d) => ({ date: d.date, itemIds: d.items.map((i) => i.id) })),
    [days],
  );

  const moveItem = useCallback(
    (itemId: string, t: DropTarget) => {
      const item = opt.items.find((i) => i.id === itemId);
      if (!item) return;
      const current = layout.find((d) => d.itemIds.includes(itemId));
      const atSamePlace = current?.date === t.date && current.itemIds.indexOf(itemId) === t.index;
      if (atSamePlace) return;

      updOpt(vac.id, opt.id, (o) => ({ ...o, items: placeInDay(o.items, item, t.date, t.index) }));
      if (item.date !== t.date) {
        const day = days.find((d) => d.date === t.date);
        log(`${me.name} moved “${item.title}” to day ${day?.n ?? '?'} in ${opt.name}`);
        toast(`Moved to ${short(t.date)}`);
      }
    },
    [opt.items, opt.id, opt.name, vac.id, layout, days, updOpt, log, me.name, toast],
  );

  const drag = useItemDrag(layout, moveItem);

  const nudge = (itemId: string, dir: -1 | 1) => {
    const t = stepTarget(layout, itemId, dir);
    if (t) moveItem(itemId, t);
  };

  const removeItem = (i: Item) => {
    updOpt(vac.id, opt.id, (x) => ({ ...x, items: x.items.filter((y) => y.id !== i.id) }));
    log(`${me.name} removed “${i.title}” from ${opt.name}`);
    toast(`Removed “${i.title}”`, 'critical');
  };

  const maxCat = Math.max(
    1,
    ...CAT_KEYS.map((k) => opt.items.filter((i) => i.cat === k).reduce((a, b) => a + Number(b.cost), 0)),
  );

  const dragged = drag.dragId ? opt.items.find((i) => i.id === drag.dragId) : undefined;

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(240px,320px)', gap: 'var(--s4)', alignItems: 'start' }}
      className="itin"
    >
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

        <div className={`card-bd${drag.dragId ? ' is-dragging' : ''}`}>
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
            days.map(({ date, n, items }) => {
              const dayTotal = items.reduce((a, b) => a + Number(b.cost), 0);
              const isTargetDay = drag.target?.date === date;
              return (
                <div
                  key={date}
                  className={`day${items.length ? ' day-has' : ''}${isTargetDay ? ' day-target' : ''}`}
                  ref={(el) => drag.registerDay(date, el)}
                >
                  <div className="day-rule" />
                  <div className="day-num">{n}</div>
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

                    <div className="day-items">
                      {items.map((i, idx) => (
                        <div key={i.id}>
                          {isTargetDay && drag.target?.index === idx && <div className="drop-line" />}
                          <div
                            className={`item${drag.dragId === i.id ? ' item-ghosted' : ''}`}
                            ref={(el) => drag.registerItem(i.id, el)}
                          >
                            <button
                              type="button"
                              className="grip"
                              aria-label={`Reorder ${i.title}. Drag, or use arrow keys.`}
                              title="Drag to another day, or use ↑ ↓"
                              onPointerDown={(e) => drag.onGripPointerDown(e, i.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  nudge(i.id, e.key === 'ArrowUp' ? -1 : 1);
                                }
                              }}
                            >
                              <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
                                <g fill="currentColor">
                                  {[3, 8, 13].map((cy) =>
                                    [3, 9].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.35" />),
                                  )}
                                </g>
                              </svg>
                            </button>
                            <span className={`item-cat cat-${i.cat}`}>
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
                        </div>
                      ))}

                      {isTargetDay && drag.target!.index >= items.filter((i) => i.id !== drag.dragId).length && (
                        <div className="drop-line" />
                      )}

                      {/* An empty day needs something to aim at. */}
                      {drag.dragId && items.filter((i) => i.id !== drag.dragId).length === 0 && (
                        <div className={`drop-zone${isTargetDay ? ' is-over' : ''}`}>Drop here</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* the row travelling with the pointer */}
      {drag.ghost && dragged && (
        <div
          className="drag-ghost"
          style={{ left: drag.ghost.x, top: drag.ghost.y, width: drag.ghost.w, height: drag.ghost.h }}
        >
          <span className={`item-cat cat-${dragged.cat}`}>
            <Icon d={CATS[dragged.cat].icon} size={15} />
          </span>
          <span className="item-title">{dragged.title}</span>
          <span className="item-cost">{fmt2(dragged.cost)}</span>
        </div>
      )}

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
                <div key={k} className={`cat-${k}`} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 'var(--s2)', alignItems: 'center' }}>
                  <Icon d={CATS[k].icon} size={14} stroke="var(--cat)" />
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 3 }}>{CATS[k].label}</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${(v / maxCat) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--cat)' }} />
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
