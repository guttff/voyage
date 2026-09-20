import { useState } from 'react';
import { Dialog } from '../Dialog';
import { useToast } from '../ui/Toast';
import { addDays, diffDays, today } from '../../lib/format';
import { newVacation } from '../../lib/seed';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';

export function NewTripDialog() {
  const { data, setData, log, me } = useStore();
  const ui = useUi();
  const toast = useToast();
  const [nv, setNv] = useState({ name: '', start: addDays(today(), 90), end: addDays(today(), 97) });

  const [p1, p2] = data.people;
  const badRange = !!nv.start && !!nv.end && nv.end < nv.start;
  const invalid = !nv.name.trim() || !nv.start || !nv.end || badRange;
  const nights = badRange ? 0 : diffDays(nv.start, nv.end) + 1;

  const submit = () => {
    if (invalid) return;
    const vac = newVacation(nv.name.trim(), nv.start, nv.end, p1, p2);
    setData((s) => ({ ...s, vacations: [...s.vacations, vac] }));
    log(`${me.name} created the trip ${vac.name}`);
    toast(`${vac.name} created`, 'good');
    ui.openTrip(vac.id, 'plans');
  };

  return (
    <Dialog
      title="New trip"
      description={`You each get your own plan to build, plus a shared Final plan to merge into.`}
      onClose={ui.closePanel}
      footer={
        <>
          <span className="muted" style={{ fontSize: 12 }}>
            {nights > 0 ? `${nights} days` : 'Pick valid dates'}
          </span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={ui.closePanel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={invalid}>
            Create trip
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--s3)' }}>
        <div className="field">
          <label htmlFor="nv-name">Destination</label>
          <input
            id="nv-name"
            className="input"
            placeholder="Costa Rica"
            value={nv.name}
            onChange={(e) => setNv((s) => ({ ...s, name: e.target.value }))}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
          <div className="field">
            <label htmlFor="nv-start">Start</label>
            <input
              id="nv-start"
              className="input"
              type="date"
              value={nv.start}
              onChange={(e) => setNv((s) => ({ ...s, start: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="nv-end">End</label>
            <input
              id="nv-end"
              className="input"
              type="date"
              value={nv.end}
              onChange={(e) => setNv((s) => ({ ...s, end: e.target.value }))}
              aria-invalid={badRange}
            />
          </div>
        </div>
        {badRange && (
          <div style={{ fontSize: 12, color: 'var(--critical-text)' }}>The end date is before the start date.</div>
        )}
      </div>
    </Dialog>
  );
}
