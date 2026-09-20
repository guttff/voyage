import { CHECK_ICON, COMPASS_ICON, NAV_ICONS } from '../lib/constants';
import { initial } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { Page } from '../lib/types';
import { Corners } from './Blueprint';
import { Icon } from './Icon';
import { ImageSlot } from './ImageSlot';

const NAV: [Page | 'io', string][] = [
  ['home', 'Home'],
  ['trips', 'Trips'],
  ['budget', 'Budget'],
  ['io', 'Import / Export'],
  ['settings', 'Settings'],
];

export function Sidebar() {
  const { data, setUser } = useStore();
  const ui = useUi();
  const { route } = ui;

  // Import / Export is a tab of a trip, so the rail entry has to pick one.
  const ioVacId = route.vacId && data.vacations.some((v) => v.id === route.vacId)
    ? route.vacId
    : data.vacations[0]?.id;

  return (
    <aside
      className="vy-sidebar"
      style={{
        background: 'var(--color-accent-900)',
        color: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-4) var(--space-3)',
        gap: 'var(--space-4)',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
        <div
          className="blueprint"
          style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderColor: 'var(--color-accent-500)' }}
        >
          <Corners style={{ color: 'var(--color-accent-400)' }} />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent-300)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d={COMPASS_ICON} />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 20,
              lineHeight: 1,
              letterSpacing: '.03em',
            }}
          >
            Voyage
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-300)',
            }}
          >
            Plan · Travel · Together
          </div>
        </div>
      </div>

      <nav className="vy-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(([key, label]) => {
          const active =
            route.page === key ||
            (key === 'trips' && route.page === 'trip') ||
            (key === 'io' && route.page === 'trip' && route.tab === 'io');
          return (
            <button
              key={key}
              type="button"
              className="vy-nav"
              onClick={() => (key === 'io' ? ioVacId && ui.openTrip(ioVacId, 'io', ui.activeOptId) : ui.go(key as Page))}
              disabled={key === 'io' && !ioVacId}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                font: 'inherit',
                fontSize: 14,
                color: 'inherit',
                textAlign: 'left',
                padding: '9px 10px',
                border: 0,
                background: active ? 'var(--color-accent-800)' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--color-accent-300)' : 'transparent'}`,
              }}
            >
              <Icon d={NAV_ICONS[key]} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="vy-spacer" style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-300)',
            padding: '0 4px',
          }}
        >
          Planning as
        </div>
        <div className="vy-people" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.people.map((p) => {
            const active = p.id === data.user;
            return (
              <button
                key={p.id}
                type="button"
                className="vy-nav"
                onClick={() => setUser(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  font: 'inherit',
                  color: 'inherit',
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: 0,
                  background: active ? 'var(--color-accent-800)' : 'transparent',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 32,
                    height: 32,
                    flex: 'none',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--color-accent-600)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--color-bg)',
                  }}
                >
                  <span>{initial(p.name)}</span>
                  <div className="vy-av" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <ImageSlot id={`avatar-${p.id}`} shape="circle" placeholder="" />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-accent-300)' }}>{p.role}</div>
                </div>
                {active && (
                  <Icon d={CHECK_ICON} size={14} stroke="var(--color-accent-300)" style={{ marginLeft: 'auto' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="vy-tagline"
        style={{ fontSize: 12, color: 'var(--color-accent-300)', fontStyle: 'italic', padding: '0 4px' }}
      >
        “Better trips, together.”
      </div>
    </aside>
  );
}
