import { Dialog } from '../Dialog';
import { dayLabel, fmt2, uid } from '../../lib/format';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { Vacation } from '../../lib/types';

/** "Copy this item to my option" — the flow the whole two-plan model hangs on. */
export function CopyItemDialog({ vac, optId, itemId }: { vac: Vacation; optId: string; itemId: string }) {
  const { updOpt, log, me } = useStore();
  const ui = useUi();

  const src = vac.options.find((x) => x.id === optId);
  const item = src?.items.find((y) => y.id === itemId);
  if (!src || !item) return null;

  const targets = vac.options
    .filter((x) => x.id !== src.id)
    .map((t) => ({
      option: t,
      exists: t.items.some((f) => f.title === item.title && f.date === item.date),
    }));

  return (
    <Dialog onClose={ui.closePanel}>
      <div className="dialog-title">Copy “{item.title}”</div>
      <div className="dialog-body">
        {fmt2(item.cost)} · {dayLabel(item.date)}. The copy keeps who added it and where it came from.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {targets.map(({ option, exists }) => (
          <button
            key={option.id}
            type="button"
            className="btn btn-secondary"
            disabled={exists}
            onClick={() => {
              updOpt(vac.id, option.id, (x) => ({ ...x, items: [...x.items, { ...item, id: uid(), from: src.name }] }));
              log(`${me.name} copied “${item.title}” to ${option.name}`);
            }}
            style={{ justifyContent: 'space-between', padding: '10px 12px' }}
          >
            <span style={{ fontSize: 15 }}>{option.name}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {exists ? 'already there' : option.final ? 'merged plan' : option.author}
            </span>
          </button>
        ))}
      </div>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={ui.closePanel}>
          Done
        </button>
      </div>
    </Dialog>
  );
}
