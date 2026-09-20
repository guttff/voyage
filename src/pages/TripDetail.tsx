import { useMemo } from 'react';
import { Corners } from '../components/Blueprint';
import { ImageSlot } from '../components/ImageSlot';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { activeVacRow, runSimulation } from '../state/derive';
import type { TripTab, Vacation } from '../lib/types';
import { PlansTab } from './trip/PlansTab';
import { ItineraryTab } from './trip/ItineraryTab';
import { CompareTab } from './trip/CompareTab';
import { IoTab } from './trip/IoTab';

const TABS: [TripTab, string][] = [
  ['plans', 'Plan options'],
  ['itinerary', 'Itinerary'],
  ['compare', 'Compare'],
  ['io', 'Import / Export'],
];

export function TripDetail({ vac }: { vac: Vacation }) {
  const { data, setData, log, me, clearImage } = useStore();
  const ui = useUi();
  const sim = useMemo(() => runSimulation(data), [data]);
  const activeVac = activeVacRow(vac, sim);
  const duoClass = data.duotone ? 'duotone' : '';

  // Falls back to Final whenever the selected plan isn't part of this trip.
  const opt = vac.options.find((o) => o.id === ui.activeOptId) || vac.options[0];

  const removeVac = () =>
    ui.openPanel({
      kind: 'confirm',
      confirm: {
        title: `Delete ${vac.name}?`,
        body: 'All options and items for this trip are removed. Export a backup first if unsure.',
        label: 'Delete trip',
        go: () => {
          const rest = data.vacations.filter((x) => x.id !== vac.id);
          setData((s) => ({ ...s, vacations: rest }));
          clearImage(`cover-${vac.id}`);
          log(`${me.name} deleted the trip ${vac.name}`);
          ui.closePanel();
          if (rest[0]) ui.openTrip(rest[0].id, 'plans');
          else ui.go('trips');
        },
      },
    });

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => ui.go('trips')}
        style={{ alignSelf: 'flex-start', margin: '-10px 0 -14px -6px' }}
      >
        ‹ Back to trips
      </button>

      <div className="blueprint" style={{ position: 'relative', height: 240, background: 'var(--color-accent-800)' }}>
        <Corners />
        <div className={duoClass} style={{ position: 'absolute', inset: 0 }}>
          <ImageSlot id={`cover-${vac.id}`} shape="rect" placeholder={`Drop a photo of ${vac.name}`} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, color-mix(in srgb,var(--color-accent-900) 85%,transparent) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 'var(--space-6)',
            right: 'var(--space-6)',
            bottom: 'var(--space-4)',
            color: 'var(--color-bg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 'var(--space-4)',
            pointerEvents: 'none',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 40, lineHeight: 1 }}>
              {vac.name}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {activeVac.range} · {activeVac.days} days
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', pointerEvents: 'auto' }}>
            <span className={`tag ${activeVac.tagClass}`} style={{ background: 'var(--color-bg)' }}>
              {activeVac.verdict}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={removeVac}
              style={{ color: 'var(--color-bg)', borderColor: 'var(--color-accent-400)' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-divider)', gap: 2, overflowX: 'auto' }}>
        {TABS.map(([key, label]) => {
          const on = ui.route.tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => ui.setTab(key)}
              aria-current={on ? 'true' : undefined}
              style={{
                flex: 'none',
                font: 'inherit',
                background: 'none',
                border: 0,
                borderBottom: `2px solid ${on ? 'var(--color-accent-700)' : 'transparent'}`,
                padding: '8px 14px',
                color: on ? 'var(--color-accent-800)' : 'var(--color-text)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {ui.route.tab === 'plans' && <PlansTab vac={vac} activeVac={activeVac} />}
      {ui.route.tab === 'itinerary' && <ItineraryTab vac={vac} opt={opt} activeVac={activeVac} />}
      {ui.route.tab === 'compare' && <CompareTab vac={vac} />}
      {ui.route.tab === 'io' && <IoTab vac={vac} />}
    </>
  );
}
