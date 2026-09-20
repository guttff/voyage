import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { ImageSlot } from '../components/ImageSlot';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
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
  const toast = useToast();
  const sim = useMemo(() => runSimulation(data), [data]);
  const activeVac = activeVacRow(vac, sim);

  // Falls back to Final whenever the selected plan isn't part of this trip.
  const opt = vac.options.find((o) => o.id === ui.activeOptId) || vac.options[0];

  const removeVac = () =>
    ui.openPanel({
      kind: 'confirm',
      tone: 'danger',
      confirm: {
        title: `Delete ${vac.name}?`,
        body: 'Every option and item for this trip is removed. Download a backup from Settings first if you are unsure.',
        label: 'Delete trip',
        go: () => {
          const rest = data.vacations.filter((x) => x.id !== vac.id);
          setData((s) => ({ ...s, vacations: rest }));
          clearImage(`cover-${vac.id}`);
          log(`${me.name} deleted the trip ${vac.name}`);
          toast(`${vac.name} deleted`, 'critical');
          ui.closePanel();
          if (rest[0]) ui.openTrip(rest[0].id, 'plans');
          else ui.go('trips');
        },
      },
    });

  return (
    <>
      <section className="hero" style={{ minHeight: 210 }}>
        <div className={`hero-media${data.duotone ? ' tint' : ''}`}>
          <ImageSlot id={`cover-${vac.id}`} shape="rect" placeholder={`Add a photo of ${vac.name}`} onDark />
        </div>
        <div className="hero-shade" />
        <div className="hero-body" style={{ minHeight: 210 }}>
          <div>
            <div className="hero-kicker">{activeVac.daysUntil > 0 ? `In ${activeVac.daysUntil} days` : 'Under way'}</div>
            <div className="hero-title">{vac.name}</div>
            <div className="hero-meta">
              {activeVac.range} · {activeVac.days} days · {activeVac.cost} planned
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <Badge tone={activeVac.tone}>{activeVac.verdict}</Badge>
            <button type="button" className="btn btn-danger" onClick={removeVac}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </div>
      </section>

      <div className="tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className="tab"
            aria-selected={ui.route.tab === key}
            onClick={() => ui.setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {ui.route.tab === 'plans' && <PlansTab vac={vac} activeVac={activeVac} />}
      {ui.route.tab === 'itinerary' && <ItineraryTab vac={vac} opt={opt} activeVac={activeVac} />}
      {ui.route.tab === 'compare' && <CompareTab vac={vac} />}
      {ui.route.tab === 'io' && <IoTab vac={vac} />}
    </>
  );
}
