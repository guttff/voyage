import { Icon } from '../../components/Icon';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { CATS, total } from '../../lib/constants';
import { addDays, dayLabel, diffDays, fmt, short, uid } from '../../lib/format';
import { useStore } from '../../state/store';
import type { Item, Vacation } from '../../lib/types';

export function CompareTab({ vac }: { vac: Vacation }) {
  const { updOpt, log, me } = useStore();
  const toast = useToast();
  const nDays = diffDays(vac.start, vac.end) + 1;

  const finalItems = vac.options[0].items;
  // Same title on the same day is the same plan entry, however it got there.
  const inFinal = (i: Item) => finalItems.some((f) => f.title === i.title && f.date === i.date);

  const toFinal = (i: Item, fromName: string) => {
    updOpt(vac.id, 'final', (f) => ({ ...f, items: [...f.items, { ...i, id: uid(), from: fromName }] }));
    log(`${me.name} copied “${i.title}” to Final`);
    toast(`“${i.title}” added to Final`, 'good');
  };

  return (
    <>
      <div className="page-hd">
        <div>
          <h2>Compare</h2>
          <p>Every option side by side, aligned by day. Send anything straight into the Final plan.</p>
        </div>
      </div>

      <section className="card card-flush">
        <div style={{ overflowX: 'auto' }}>
          <table className="cmp" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th className="cmp-day">Day</th>
                {vac.options.map((op) => (
                  <th key={op.id} className={op.final ? 'cmp-final' : undefined}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <span>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {op.name}
                        </span>
                        <span className="subtle" style={{ fontSize: 11, textTransform: 'none', letterSpacing: 0 }}>
                          {op.final ? 'merged' : op.author}
                        </span>
                      </span>
                      <span className="num" style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {fmt(total(op))}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: nDays }, (_, k) => {
                const date = addDays(vac.start, k);
                return (
                  <tr key={date}>
                    <td className="cmp-day">
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Day {k + 1}</div>
                      <div className="subtle" style={{ fontSize: 11 }}>
                        {short(date)}
                      </div>
                    </td>
                    {vac.options.map((op) => {
                      const items = op.items.filter((i) => i.date === date);
                      return (
                        <td key={op.id} className={op.final ? 'cmp-final' : undefined}>
                          {items.length === 0 && (
                            <span className="subtle" style={{ fontSize: 11, paddingLeft: 2 }}>
                              —
                            </span>
                          )}
                          {items.map((i) => {
                            const already = inFinal(i);
                            return (
                              <div key={i.id} className="cmp-item" title={`${i.title} · ${dayLabel(i.date)}`}>
                                <Icon d={CATS[i.cat].icon} size={13} stroke="var(--text-3)" />
                                <span className="nm">{i.title}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className="num">{fmt(i.cost)}</span>
                                  {!op.final && !already && (
                                    <span className="item-acts">
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => toFinal(i, op.name)}
                                        title="Copy to the Final plan"
                                      >
                                        <Icon name="arrowRight" size={12} />
                                        Final
                                      </button>
                                    </span>
                                  )}
                                  {!op.final && already && (
                                    <Badge tone="good" small icon="check">
                                      Final
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
