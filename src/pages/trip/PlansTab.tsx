import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { BudgetCheckCard } from '../../components/BudgetCheckCard';
import { useToast } from '../../components/ui/Toast';
import { total } from '../../lib/constants';
import { ago, fmt, initial, uid } from '../../lib/format';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { ActiveVac } from '../../state/derive';
import type { Vacation } from '../../lib/types';

export function PlansTab({ vac, activeVac }: { vac: Vacation; activeVac: ActiveVac }) {
  const { data, updVac, log, me } = useStore();
  const ui = useUi();
  const toast = useToast();

  const biggest = Math.max(1, ...vac.options.map((o) => total(o)));

  const addOption = () => {
    const id = uid();
    updVac(vac.id, (v) => ({
      ...v,
      options: [...v.options, { id, name: 'Option ' + v.options.length, author: me.name, personId: me.id, items: [] }],
    }));
    log(`${me.name} created a new option in ${vac.name}`);
    toast('New option created');
    ui.openTrip(vac.id, 'itinerary', id);
  };

  const removeOption = (optId: string, name: string, count: number) =>
    ui.openPanel({
      kind: 'confirm',
      tone: 'danger',
      confirm: {
        title: `Delete ${name}?`,
        body: `${count} item${count === 1 ? '' : 's'} will be removed. The Final plan is not affected.`,
        label: 'Delete option',
        go: () => {
          updVac(vac.id, (v) => ({ ...v, options: v.options.filter((o) => o.id !== optId) }));
          log(`${me.name} deleted ${name} in ${vac.name}`);
          toast(`${name} deleted`, 'critical');
          if (ui.activeOptId === optId) ui.setActiveOpt(null);
          ui.closePanel();
        },
      },
    });

  return (
    <>
      <div className="page-hd">
        <div>
          <h2>Plan options</h2>
          <p>You each build your own plan. Copy the best parts into Final — that's the one the budget uses.</p>
        </div>
      </div>

      <div className="grid grid-cards">
        {vac.options.map((op) => {
          const t = total(op);
          const canDelete = !op.final && vac.options.length > 2;
          return (
            <section key={op.id} className={`card${op.final ? ' card-accent' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {op.final ? (
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 34,
                      height: 34,
                      flex: 'none',
                      color: 'var(--accent-700)',
                      background: 'var(--surface)',
                      border: '1px solid var(--accent-400)',
                      borderRadius: 'var(--r-md)',
                    }}
                  >
                    <Icon name="users" size={17} />
                  </span>
                ) : (
                  <Avatar personId={op.personId} initial={initial(op.author)} size={34} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{op.final ? 'Final plan' : `${op.author}’s plan`}</div>
                  <div className="subtle" style={{ fontSize: 12 }}>
                    {op.final ? 'Merged from your options' : op.name}
                  </div>
                </div>
              </div>

              <div>
                <div className="stat-value num">{fmt(t)}</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  {op.items.length} item{op.items.length === 1 ? '' : 's'} · {fmt(t / 2)} each
                </div>
              </div>

              {/* One bar per option against the priciest — comparing magnitude. */}
              <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(t / biggest) * 100}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: op.final ? 'var(--accent-700)' : 'var(--accent-400)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                <button type="button" className="btn btn-sm" onClick={() => ui.openTrip(vac.id, 'itinerary', op.id)}>
                  View plan
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeOption(op.id, op.name, op.items.length)}
                    style={{ color: 'var(--text-2)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </section>
          );
        })}

        <button type="button" className="add-tile" onClick={addOption}>
          <Icon name="plus" size={20} />
          <span>
            <strong>Add an option</strong>
            <span>blank, or import JSON</span>
          </span>
        </button>
      </div>

      <div className="grid grid-2">
        <BudgetCheckCard vac={activeVac} withVerdict />
        <section className="card card-flush">
          <header className="card-hd">
            <h3>Recent activity</h3>
          </header>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            {data.activity.length === 0 && <span className="muted">Nothing yet.</span>}
            {data.activity.slice(0, 6).map((a, i) => (
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
