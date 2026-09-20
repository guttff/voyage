import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { useToast } from '../ui/Toast';
import { dayLabel, fmt2, uid } from '../../lib/format';
import { placeInDay } from '../../lib/order';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { Vacation } from '../../lib/types';

/** "Copy this item to my option" — the flow the whole two-plan model hangs on. */
export function CopyItemDialog({ vac, optId, itemId }: { vac: Vacation; optId: string; itemId: string }) {
  const { updOpt, log, me } = useStore();
  const ui = useUi();
  const toast = useToast();

  const src = vac.options.find((x) => x.id === optId);
  const item = src?.items.find((y) => y.id === itemId);
  if (!src || !item) return null;

  const targets = vac.options
    .filter((x) => x.id !== src.id)
    .map((t) => ({ option: t, exists: t.items.some((f) => f.title === item.title && f.date === item.date) }));

  return (
    <Dialog
      title={`Copy “${item.title}”`}
      description={`${fmt2(item.cost)} · ${dayLabel(item.date)}. The copy records who added it and where it came from.`}
      onClose={ui.closePanel}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-primary" onClick={ui.closePanel}>
            Done
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {targets.map(({ option, exists }) => (
          <button
            key={option.id}
            type="button"
            className="btn"
            disabled={exists}
            onClick={() => {
              const copy = { ...item, id: uid(), from: src.name };
              updOpt(vac.id, option.id, (x) => ({ ...x, items: placeInDay(x.items, copy, copy.date, 'byTime') }));
              log(`${me.name} copied “${item.title}” to ${option.name}`);
              toast(`Copied to ${option.name}`, 'good');
            }}
            style={{ justifyContent: 'space-between', height: 44, padding: '0 var(--s3)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <Icon name={exists ? 'check' : 'arrowRight'} size={14} stroke={exists ? 'var(--good-text)' : undefined} />
              {option.name}
            </span>
            <span className="subtle" style={{ fontSize: 12, fontWeight: 400 }}>
              {exists ? 'already there' : option.final ? 'merged plan' : option.author}
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
