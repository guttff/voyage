import { useState } from 'react';
import { Corners } from '../Blueprint';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { CATS, CAT_KEYS } from '../../lib/constants';
import { addDays, dayLabel, diffDays, uid } from '../../lib/format';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { CatKey, ItemForm, Vacation } from '../../lib/types';

type Props = {
  vac: Vacation;
  optId: string;
  /** null adds a new item; otherwise the id of the item being edited. */
  editId: string | null;
  /** Pre-selected day when the form was opened from a specific day row. */
  date?: string;
};

export function AddItemDialog({ vac, optId, editId, date }: Props) {
  const { updOpt, log, me } = useStore();
  const ui = useUi();

  const opt = vac.options.find((o) => o.id === optId) || vac.options[0];
  const editing = editId ? opt.items.find((i) => i.id === editId) : undefined;

  const clamp = (d: string | undefined) => (d && d >= vac.start && d <= vac.end ? d : vac.start);

  const [form, setForm] = useState<ItemForm>(() =>
    editing
      ? {
          date: editing.date,
          time: editing.time || '',
          cat: editing.cat,
          title: editing.title,
          note: editing.note || '',
          cost: String(editing.cost),
        }
      : { date: clamp(date), time: '', cat: ui.lastCat, title: '', note: '', cost: '' },
  );

  const set = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const nDays = diffDays(vac.start, vac.end) + 1;

  const submit = () => {
    if (!form.title.trim()) return;
    const base = {
      date: form.date,
      time: form.time,
      cat: form.cat,
      title: form.title.trim(),
      note: form.note.trim(),
      cost: Number(form.cost) || 0,
    };
    if (editing) {
      updOpt(vac.id, opt.id, (x) => ({
        ...x,
        items: x.items.map((i) => (i.id === editing.id ? { ...i, ...base } : i)),
      }));
      log(`${me.name} edited “${base.title}” in ${opt.name}`);
    } else {
      updOpt(vac.id, opt.id, (x) => ({ ...x, items: [...x.items, { id: uid(), by: me.name, ...base }] }));
      log(`${me.name} added “${base.title}” to ${opt.name}`);
    }
    ui.setLastCat(form.cat);
    ui.closePanel();
  };

  return (
    <Dialog onClose={ui.closePanel}>
      <div className="dialog-title">{editing ? 'Edit item' : `Add item to ${opt.name}`}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="field">
          <label>Day</label>
          <select className="input" value={form.date} onChange={(e) => set('date', e.target.value)}>
            {Array.from({ length: nDays }, (_, k) => {
              const d = addDays(vac.start, k);
              return (
                <option key={d} value={d}>
                  Day {k + 1} · {dayLabel(d)}
                </option>
              );
            })}
          </select>
        </div>
        <div className="field">
          <label>Time (optional)</label>
          <input className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
        </div>
        <div className="field" style={{ gridColumn: '1/-1' }}>
          <label>Category</label>
          <div className="seg" style={{ display: 'flex' }}>
            {CAT_KEYS.map((k: CatKey) => {
              const on = form.cat === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('cat', k)}
                  className="seg-opt"
                  aria-pressed={on}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    border: 0,
                    borderLeft: '1px solid var(--color-divider)',
                    font: 'inherit',
                    fontSize: 13,
                    background: on ? 'var(--color-accent)' : 'transparent',
                    color: on ? 'var(--color-bg)' : 'var(--color-text)',
                  }}
                >
                  <Icon d={CATS[k].icon} size={13} />
                  {CATS[k].label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="field" style={{ gridColumn: '1/-1' }}>
          <label>Title</label>
          <input
            className="input"
            placeholder="Flight FLL → Liberia"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Note</label>
          <input
            className="input"
            placeholder="Confirmation, address…"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Cost (total, USD)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.cost}
            onChange={(e) => set('cost', e.target.value)}
          />
        </div>
      </div>
      <div className="dialog-actions">
        <span className="text-muted" style={{ marginRight: 'auto', fontSize: 12, alignSelf: 'center' }}>
          As {me.name} · {opt.name}
        </span>
        <button type="button" className="btn btn-secondary" onClick={ui.closePanel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary blueprint" onClick={submit} disabled={!form.title.trim()}>
          <Corners />
          {editing ? 'Save' : 'Add item'}
        </button>
      </div>
    </Dialog>
  );
}
