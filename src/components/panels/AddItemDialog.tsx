import { useState } from 'react';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { useToast } from '../ui/Toast';
import { CATS, CAT_KEYS } from '../../lib/constants';
import { addDays, dayLabel, diffDays, uid } from '../../lib/format';
import { placeInDay } from '../../lib/order';
import { useStore } from '../../state/store';
import { useUi } from '../../state/ui';
import type { CatKey, ItemForm, Vacation } from '../../lib/types';

type Props = {
  vac: Vacation;
  optId: string;
  /** null adds a new item; otherwise the id of the item being edited. */
  editId: string | null;
  /** Pre-selected day when opened from a specific day row. */
  date?: string;
};

export function AddItemDialog({ vac, optId, editId, date }: Props) {
  const { updOpt, log, me } = useStore();
  const ui = useUi();
  const toast = useToast();

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
  const valid = form.title.trim() !== '';

  const submit = () => {
    if (!valid) return;
    const base = {
      date: form.date,
      time: form.time,
      cat: form.cat,
      title: form.title.trim(),
      note: form.note.trim(),
      cost: Number(form.cost) || 0,
    };
    if (editing) {
      const movedDay = editing.date !== base.date;
      updOpt(vac.id, opt.id, (x) => {
        const items = x.items.map((i) => (i.id === editing.id ? { ...i, ...base } : i));
        if (!movedDay) return { ...x, items };
        const next = items.find((i) => i.id === editing.id)!;
        return { ...x, items: placeInDay(items, next, base.date, 'byTime') };
      });
      log(`${me.name} edited “${base.title}” in ${opt.name}`);
      toast(`Saved “${base.title}”`, 'good');
    } else {
      const fresh = { id: uid(), by: me.name, ...base };
      updOpt(vac.id, opt.id, (x) => ({ ...x, items: placeInDay(x.items, fresh, base.date, 'byTime') }));
      log(`${me.name} added “${base.title}” to ${opt.name}`);
      toast(`Added “${base.title}” to ${opt.name}`, 'good');
    }
    ui.setLastCat(form.cat);
    ui.closePanel();
  };

  return (
    <Dialog
      title={editing ? 'Edit item' : `Add to ${opt.name}`}
      description={editing ? undefined : `Added as ${me.name}.`}
      onClose={ui.closePanel}
      footer={
        <>
          <span className="muted" style={{ fontSize: 12 }}>
            {opt.name}
          </span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={ui.closePanel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!valid}>
            {editing ? 'Save changes' : 'Add item'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--s3)' }}>
        <div className="field">
          <label>Category</label>
          <div className="seg">
            {CAT_KEYS.map((k: CatKey) => (
              <button
                key={k}
                type="button"
                className="seg-opt"
                aria-pressed={form.cat === k}
                onClick={() => set('cat', k)}
              >
                <Icon d={CATS[k].icon} size={13} />
                {CATS[k].label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="it-title">Title</label>
          <input
            id="it-title"
            className="input"
            placeholder="Flight FLL → Liberia"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--s3)' }}>
          <div className="field">
            <label htmlFor="it-day">Day</label>
            <select id="it-day" className="input" value={form.date} onChange={(e) => set('date', e.target.value)}>
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
            <label htmlFor="it-time">Time</label>
            <input id="it-time" className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="it-cost">Cost (USD)</label>
            <input
              id="it-cost"
              className="input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.cost}
              onChange={(e) => set('cost', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="it-note">Note</label>
          <input
            id="it-note"
            className="input"
            placeholder="Confirmation number, address, who booked it…"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}
