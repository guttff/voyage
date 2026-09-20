import { Fragment } from 'react';
import { Corners } from '../../components/Blueprint';
import { Icon } from '../../components/Icon';
import { CATS, total } from '../../lib/constants';
import { addDays, dayLabel, diffDays, fmt, uid } from '../../lib/format';
import { useStore } from '../../state/store';
import type { Item, Vacation } from '../../lib/types';

export function CompareTab({ vac }: { vac: Vacation }) {
  const { updOpt, log, me } = useStore();
  const nDays = diffDays(vac.start, vac.end) + 1;

  const finalItems = vac.options[0].items;
  // Same title on the same day is the same plan entry, however it got there.
  const inFinal = (i: Item) => finalItems.some((f) => f.title === i.title && f.date === i.date);

  const toFinal = (i: Item, fromName: string) => {
    updOpt(vac.id, 'final', (f) => ({ ...f, items: [...f.items, { ...i, id: uid(), from: fromName }] }));
    log(`${me.name} copied “${i.title}” to Final`);
  };

  return (
    <>
      <div className="text-muted" style={{ fontSize: 13 }}>
        Options side by side, aligned by day. Hover an item to send it to Final.
      </div>
      <div className="blueprint" style={{ overflowX: 'auto' }}>
        <Corners />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `120px repeat(${vac.options.length}, minmax(0,1fr))`,
            minWidth: 700,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--color-divider)',
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--color-neutral-700)',
              alignSelf: 'end',
            }}
          >
            Day
          </div>
          {vac.options.map((op) => (
            <div
              key={op.id}
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--color-divider)',
                borderLeft: '1px solid var(--color-divider)',
                background: op.final ? 'var(--color-accent-100)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 18, lineHeight: 1 }}>
                  {op.name}
                </div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {op.final ? 'merged' : op.author}
                </div>
              </div>
              <div style={{ fontWeight: 700 }}>{fmt(total(op))}</div>
            </div>
          ))}

          {Array.from({ length: nDays }, (_, k) => {
            const date = addDays(vac.start, k);
            return (
              <Fragment key={date}>
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>Day {k + 1}</span>
                  <span className="text-muted" style={{ fontSize: 11 }}>
                    {dayLabel(date)}
                  </span>
                </div>
                {vac.options.map((op) => (
                  <div
                    key={op.id}
                    style={{
                      padding: '6px 8px',
                      borderLeft: '1px solid var(--color-divider)',
                      borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)',
                      background: op.final ? 'color-mix(in srgb,var(--color-accent-100) 50%,transparent)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {op.items
                      .filter((i) => i.date === date)
                      .map((i) => {
                        const already = inFinal(i);
                        return (
                          <div
                            key={i.id}
                            className="vy-row"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '16px minmax(0,1fr) auto',
                              gap: 6,
                              alignItems: 'center',
                              padding: 4,
                              border: '1px solid var(--color-divider)',
                              fontSize: 12,
                            }}
                          >
                            <Icon d={CATS[i.cat].icon} size={14} />
                            <span
                              style={{
                                fontWeight: 700,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={i.title}
                            >
                              {i.title}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{fmt(i.cost)}</span>
                              {!op.final && !already && (
                                <button
                                  type="button"
                                  className="btn btn-ghost vy-act"
                                  onClick={() => toFinal(i, op.name)}
                                  style={{ padding: '0 4px', fontSize: 11 }}
                                >
                                  → Final
                                </button>
                              )}
                              {!op.final && already && (
                                <span className="tag tag-accent" style={{ padding: '0 5px', fontSize: 10 }}>
                                  in Final
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}
