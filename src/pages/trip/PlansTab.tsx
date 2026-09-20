import { Corners } from '../../components/Blueprint';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { BudgetCheckCard } from '../../components/BudgetCheckCard';
import { PEOPLE_ICON, total } from '../../lib/constants';
import { ago, fmt, initial, uid } from '../../lib/format';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { ActiveVac } from '../../state/derive';
import type { Vacation } from '../../lib/types';

export function PlansTab({ vac, activeVac }: { vac: Vacation; activeVac: ActiveVac }) {
  const { data, updVac, log, me } = useStore();
  const ui = useUi();

  const addOption = () => {
    const id = uid();
    updVac(vac.id, (v) => ({
      ...v,
      options: [...v.options, { id, name: 'Option ' + v.options.length, author: me.name, personId: me.id, items: [] }],
    }));
    log(`${me.name} created a new option in ${vac.name}`);
    ui.openTrip(vac.id, 'itinerary', id);
  };

  const removeOption = (optId: string, name: string, count: number) =>
    ui.openPanel({
      kind: 'confirm',
      confirm: {
        title: `Delete ${name}?`,
        body: `${count} items will be removed. Final is not affected.`,
        label: 'Delete option',
        go: () => {
          updVac(vac.id, (v) => ({ ...v, options: v.options.filter((o) => o.id !== optId) }));
          log(`${me.name} deleted ${name} in ${vac.name}`);
          if (ui.activeOptId === optId) ui.setActiveOpt(null);
          ui.closePanel();
        },
      },
    });

  return (
    <>
      <div>
        <h4 style={{ margin: 0 }}>Plan options</h4>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Each of you builds your own plan. Copy the best parts into Final.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 'var(--space-4)' }}>
        {vac.options.map((op) => {
          const t = total(op);
          const canDelete = !op.final && vac.options.length > 2;
          return (
            <div
              key={op.id}
              className="card blueprint"
              style={{ background: op.final ? 'var(--color-accent-100)' : 'transparent' }}
            >
              <Corners />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!op.final && op.personId && <Avatar personId={op.personId} initial={initial(op.author)} size={36} />}
                {op.final && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      display: 'grid',
                      placeItems: 'center',
                      border: '1px solid var(--color-accent)',
                      color: 'var(--color-accent-700)',
                    }}
                  >
                    <Icon d={PEOPLE_ICON} size={18} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700 }}>{op.final ? 'Combined plan' : `${op.author}’s plan`}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {op.final ? 'Final · merged from options' : op.name}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 30, lineHeight: 1 }}>
                {fmt(t)}
              </div>
              <div className="card-body">
                {op.items.length} items · {fmt(t / 2)} each
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => ui.openTrip(vac.id, 'itinerary', op.id)}
                >
                  View plan
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeOption(op.id, op.name, op.items.length)}
                    style={{ color: 'var(--color-neutral-700)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addOption}
          className="blueprint"
          style={{
            minHeight: 180,
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
            <div style={{ fontWeight: 700 }}>Create new option</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              blank, or import JSON
            </div>
          </div>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--space-4)' }}>
        <BudgetCheckCard vac={activeVac} />
        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Recent activity</div>
          {data.activity.slice(0, 6).map((a, i) => (
            <div key={`${a.t}-${i}`} style={{ display: 'flex', gap: 8, fontSize: 13, alignItems: 'baseline' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  flex: 'none',
                  transform: 'translateY(-2px)',
                }}
              />
              <span style={{ flex: 1 }}>{a.text}</span>
              <span className="text-muted" style={{ fontSize: 11, flex: 'none' }}>
                {ago(a.t)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
