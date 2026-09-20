import { Icon } from '../components/Icon';
import { ImageSlot } from '../components/ImageSlot';
import { useToast } from '../components/ui/Toast';
import { normalizeData } from '../lib/order';
import { seed } from '../lib/seed';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { Backup } from '../lib/types';

export function Settings() {
  const { data, setData, replaceData, images, restoreImages } = useStore();
  const ui = useUi();
  const toast = useToast();

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
    toast('Backup downloaded', 'good');
  };

  const restore = (file: File | undefined) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result)) as Backup;
        if (j.schema !== 'voyage.backup.v1' || !Array.isArray(j.vacations)) throw new Error('not a Voyage backup');
        replaceData(normalizeData({
          people: j.people || data.people,
          user: (j.people || data.people)[0]?.id || 'p1',
          vacations: j.vacations,
          budget: j.budget || data.budget,
          duotone: data.duotone,
          activity: j.activity || [],
        }));
        if (j.images) restoreImages(j.images);
        ui.resetRoute(j.vacations[0]?.id);
        toast(`Restored ${j.vacations.length} trips`, 'good');
      } catch (err) {
        toast('Could not restore: ' + (err as Error).message, 'critical');
      }
    };
    r.readAsText(file);
  };

  const reset = () =>
    ui.openPanel({
      kind: 'confirm',
      tone: 'danger',
      confirm: {
        title: 'Reset to sample data?',
        body: 'Your trips, options and contribution rules in this browser are replaced with the demo set. Traveler photos are kept.',
        label: 'Reset',
        go: () => {
          const d = normalizeData(seed());
          replaceData(d);
          // Covers belong to trips that no longer exist; avatars survive.
          const keep = Object.fromEntries(
            Object.entries(images).filter(
              ([k]) => !k.startsWith('cover-') || d.vacations.some((v) => k === `cover-${v.id}`),
            ),
          );
          restoreImages(keep);
          ui.resetRoute(d.vacations[0].id);
          toast('Reset to sample data');
        },
      },
    });

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>Settings</h1>
          <p>Names, photos and your data. Everything is stored in this browser.</p>
        </div>
      </div>

      <div className="grid grid-2">
        {data.people.map((p, i) => (
          <TravelerCard key={p.id} id={p.id} n={i + 1} />
        ))}
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h3>Photos</h3>
          <label className="choice" style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={!!data.duotone}
              onChange={() => setData((s) => ({ ...s, duotone: !s.duotone }))}
            />
            <span>
              <span style={{ display: 'block', fontWeight: 600 }}>Tint trip photography</span>
              <span className="subtle" style={{ fontSize: 12 }}>
                A steel-blue wash over covers, so text on top always reads.
              </span>
            </span>
          </label>
        </section>

        <section className="card">
          <h3>Your data</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            A backup holds every trip, option, contribution rule and photo. It is also how you hand the plan to each
            other — there is no server behind this app.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={download}>
              <Icon name="download" size={14} />
              Download backup
            </button>
            <label className="btn" style={{ cursor: 'pointer' }}>
              <Icon name="upload" size={14} />
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
            <button type="button" className="btn btn-danger" onClick={reset}>
              <Icon name="trash" size={14} />
              Reset to sample data
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function TravelerCard({ id, n }: { id: string; n: number }) {
  const { data, setPerson } = useStore();
  const p = data.people.find((x) => x.id === id)!;
  return (
    <section className="card">
      <span className="label">Traveler {n}</span>
      <div style={{ display: 'flex', gap: 'var(--s4)', alignItems: 'center' }}>
        <ImageSlot
          id={`avatar-${p.id}`}
          shape="circle"
          placeholder="Photo"
          style={{ width: 104, height: 104, flex: 'none' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s2)', minWidth: 0 }}>
          <div className="field">
            <label htmlFor={`nm-${p.id}`}>Name</label>
            <input
              id={`nm-${p.id}`}
              className="input"
              value={p.name}
              onChange={(e) => setPerson(p.id, { name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor={`rl-${p.id}`}>Role</label>
            <input
              id={`rl-${p.id}`}
              className="input"
              value={p.role}
              onChange={(e) => setPerson(p.id, { role: e.target.value })}
            />
          </div>
        </div>
      </div>
      <span className="subtle" style={{ fontSize: 12 }}>
        Drop a photo on the circle; it shows in the sidebar and on plan cards.
      </span>
    </section>
  );
}
