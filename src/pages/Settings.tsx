import { useState } from 'react';
import { Corners } from '../components/Blueprint';
import { ImageSlot } from '../components/ImageSlot';
import { seed } from '../lib/seed';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { Backup } from '../lib/types';

export function Settings() {
  const { data, setData, replaceData, images, restoreImages, me } = useStore();
  const ui = useUi();
  const [msg, setMsg] = useState('');

  const download = () => {
    const backup: Backup = {
      schema: 'voyage.backup.v1',
      exported: new Date().toISOString(),
      people: data.people,
      vacations: data.vacations,
      budget: data.budget,
      activity: data.activity,
      images,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voyage-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Backup downloaded.');
  };

  const restore = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result)) as Backup;
        if (j.schema !== 'voyage.backup.v1' || !Array.isArray(j.vacations)) throw new Error('not a Voyage backup');
        replaceData({
          people: j.people || data.people,
          user: (j.people || data.people)[0]?.id || 'p1',
          vacations: j.vacations,
          budget: j.budget || data.budget,
          duotone: data.duotone,
          activity: j.activity || [],
        });
        if (j.images) restoreImages(j.images);
        ui.resetRoute(j.vacations[0]?.id);
        setMsg(`Restored ${j.vacations.length} trips.`);
      } catch (err) {
        setMsg('Could not restore: ' + (err as Error).message);
      }
    };
    r.readAsText(file);
  };

  const reset = () =>
    ui.openPanel({
      kind: 'confirm',
      confirm: {
        title: 'Reset to sample data?',
        body: 'Your trips, options and budget rules in this browser are replaced with the demo set. Traveler photos are kept.',
        label: 'Reset',
        go: () => {
          const d = seed();
          replaceData(d);
          // Covers belong to trips that no longer exist; avatars survive.
          const keep = Object.fromEntries(
            Object.entries(images).filter(
              ([k]) => !k.startsWith('cover-') || d.vacations.some((v) => k === `cover-${v.id}`),
            ),
          );
          restoreImages(keep);
          ui.resetRoute(d.vacations[0].id);
          setMsg('Reset done.');
        },
      },
    });

  return (
    <>
      <div>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <div className="text-muted">Names, photos and your data. Everything is saved in this browser.</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 'var(--space-4)',
          alignItems: 'start',
        }}
      >
        {data.people.map((p, i) => (
          <TravelerCard key={p.id} id={p.id} n={i + 1} />
        ))}

        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Photos</div>
          <label className="radio">
            <input
              type="checkbox"
              checked={!!data.duotone}
              onChange={() => setData((s) => ({ ...s, duotone: !s.duotone }))}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span
              className="dot"
              style={{ borderRadius: 0, background: data.duotone ? 'var(--color-accent)' : 'transparent' }}
            />
            Tint trip photos in steel blue (the blueprint look)
          </label>

          <div className="card-kicker" style={{ marginTop: 'var(--space-3)' }}>
            Data
          </div>
          <div className="card-body">
            Full backup of every trip, option, budget rule and photo. Restore it on another device via Import.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={download}>
              Download backup
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Restore backup
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  restore(e.target.files?.[0]);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </label>
            <button type="button" className="btn btn-ghost" onClick={reset} style={{ color: 'var(--color-neutral-700)' }}>
              Reset to sample data
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-accent-700)' }}>{msg}</div>
          <div className="card-meta">Planning as {me.name}.</div>
        </div>
      </div>
    </>
  );
}

function TravelerCard({ id, n }: { id: string; n: number }) {
  const { data, setPerson } = useStore();
  const p = data.people.find((x) => x.id === id)!;
  return (
    <div className="card blueprint">
      <Corners />
      <div className="card-kicker">Traveler {n}</div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <ImageSlot
          id={`avatar-${p.id}`}
          shape="circle"
          placeholder="Drop a photo"
          style={{ width: 130, height: 130, flex: 'none' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="field">
            <label>Name</label>
            <input className="input" value={p.name} onChange={(e) => setPerson(p.id, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>Role</label>
            <input className="input" value={p.role} onChange={(e) => setPerson(p.id, { role: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="card-meta">Drop a photo on the circle; it shows in the sidebar and on plan cards.</div>
    </div>
  );
}
