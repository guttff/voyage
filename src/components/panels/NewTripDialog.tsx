import { useState } from 'react';
import { Corners } from '../Blueprint';
import { Dialog } from '../Dialog';
import { addDays, today } from '../../lib/format';
import { newVacation } from '../../lib/seed';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';

export function NewTripDialog() {
  const { data, setData, log, me } = useStore();
  const ui = useUi();
  const [nv, setNv] = useState({ name: '', start: addDays(today(), 90), end: addDays(today(), 97) });

  const [p1, p2] = data.people;
  const invalid = !nv.name.trim() || !nv.start || !nv.end || nv.end < nv.start;

  const submit = () => {
    if (invalid) return;
    const vac = newVacation(nv.name.trim(), nv.start, nv.end, p1, p2);
    setData((s) => ({ ...s, vacations: [...s.vacations, vac] }));
    log(`${me.name} created the trip ${vac.name}`);
    ui.openTrip(vac.id, 'plans');
  };

  return (
    <Dialog onClose={ui.closePanel}>
      <div className="dialog-title">New trip</div>
      <div className="dialog-body">
        Creates a Final plan plus one option for each of you. You can add a photo on the trip page.
      </div>
      <div className="field">
        <label>Destination</label>
        <input
          className="input"
          placeholder="Costa Rica"
          value={nv.name}
          onChange={(e) => setNv((s) => ({ ...s, name: e.target.value }))}
          autoFocus
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="field">
          <label>Start</label>
          <input
            className="input"
            type="date"
            value={nv.start}
            onChange={(e) => setNv((s) => ({ ...s, start: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>End</label>
          <input
            className="input"
            type="date"
            value={nv.end}
            onChange={(e) => setNv((s) => ({ ...s, end: e.target.value }))}
          />
        </div>
      </div>
      {nv.end && nv.start && nv.end < nv.start && (
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>The end date is before the start date.</div>
      )}
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={ui.closePanel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary blueprint" onClick={submit} disabled={invalid}>
          <Corners />
          Create trip
        </button>
      </div>
    </Dialog>
  );
}
