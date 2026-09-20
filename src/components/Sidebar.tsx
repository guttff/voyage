import { initial } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { Page } from '../lib/types';
import { Icon } from './Icon';
import { ImageSlot } from './ImageSlot';
import type { IconName } from './ui/icons';

type Entry = { key: Page | 'io'; label: string; icon: IconName };

const GROUPS: { label: string; items: Entry[] }[] = [
  {
    label: 'Plan',
    items: [
      { key: 'home', label: 'Overview', icon: 'home' },
      { key: 'trips', label: 'Trips', icon: 'trips' },
      { key: 'budget', label: 'Travel fund', icon: 'budget' },
    ],
  },
  {
    label: 'Data',
    items: [
      { key: 'io', label: 'Import / Export', icon: 'io' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export function Sidebar() {
  const { data, setUser } = useStore();
  const ui = useUi();
  const { route } = ui;

  // Import / Export is a tab of a trip, so the rail entry has to pick one.
  const ioVacId =
    route.vacId && data.vacations.some((v) => v.id === route.vacId) ? route.vacId : data.vacations[0]?.id;

  return (
    <aside className="rail">
      <div className="rail-brand">
        <span className="rail-mark">
          <Icon name="palm" size={19} width={1.7} />
        </span>
        <span>
          <span className="rail-name">Voyage</span>
          <span className="rail-tag" style={{ display: 'block' }}>
            Plan together
          </span>
        </span>
      </div>

      {GROUPS.map((g) => (
        <nav className="rail-group" key={g.label} aria-label={g.label}>
          <span className="rail-group-label">{g.label}</span>
          {g.items.map((it) => {
            const active =
              route.page === it.key ||
              (it.key === 'trips' && route.page === 'trip' && route.tab !== 'io') ||
              (it.key === 'io' && route.page === 'trip' && route.tab === 'io');
            return (
              <button
                key={it.key}
                type="button"
                className="rail-link"
                aria-current={active ? 'page' : undefined}
                disabled={it.key === 'io' && !ioVacId}
                onClick={() =>
                  it.key === 'io' ? ioVacId && ui.openTrip(ioVacId, 'io', ui.activeOptId) : ui.go(it.key as Page)
                }
              >
                <Icon name={it.icon} size={16} />
                {it.label}
                {it.key === 'trips' && data.vacations.length > 0 && (
                  <span className="rail-count">{data.vacations.length}</span>
                )}
              </button>
            );
          })}
        </nav>
      ))}

      <div className="rail-spacer" style={{ flex: 1 }} />

      <div className="rail-group">
        <span className="rail-group-label">Planning as</span>
        <div className="rail-people" style={{ display: 'contents' }}>
          {data.people.map((p) => {
            const active = p.id === data.user;
            return (
              <button
                key={p.id}
                type="button"
                className="rail-person"
                aria-pressed={active}
                onClick={() => setUser(p.id)}
                title={`Plan as ${p.name}`}
              >
                <span className="av" style={{ width: 28, height: 28, fontSize: 12 }}>
                  {initial(p.name)}
                  <span className="av-photo">
                    <ImageSlot id={`avatar-${p.id}`} shape="circle" placeholder="" />
                  </span>
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="rail-person-name" style={{ display: 'block' }}>
                    {p.name}
                  </span>
                  <span className="rail-person-role">{p.role}</span>
                </span>
                {active && <Icon name="check" size={14} stroke="var(--accent-300)" style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
