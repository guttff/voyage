import { useMemo, useState } from 'react';
import { Corners } from '../components/Blueprint';
import { addDays, fmt, shortY, today, uid } from '../lib/format';
import { useStore } from '../state/store';
import { budgetSummary, runSimulation } from '../state/derive';

/** Tallest a bar may draw inside the 190px plot, leaving room for callouts. */
const BAR_MAX = 96;

export function Budget() {
  const { data, setData, log, me } = useStore();
  const sim = useMemo(() => runSimulation(data), [data]);
  const summary = budgetSummary(data, sim);
  const [p1, p2] = data.people;

  const [rule, setRule] = useState({ from: addDays(today(), 180), p1: '600', p2: '600' });

  const cur = sim.cur;

  const setCur = (key: 'p1' | 'p2', val: string) => {
    const amount = Math.max(0, Number(val) || 0);
    setData((s) => ({
      ...s,
      budget: { ...s.budget, rules: s.budget.rules.map((r) => (r.id === cur.id ? { ...r, [key]: amount } : r)) },
    }));
    log(`${me.name} set ${key === 'p1' ? p1.name : p2?.name}’s contribution to ${fmt(amount)}`);
  };

  const rules = [...data.budget.rules].sort((a, b) => a.from.localeCompare(b.from));
  const maxBal = Math.max(1, ...sim.months.map((m) => Math.abs(m.bal)));

  const addRule = () => {
    if (!rule.from) return;
    setData((s) => ({
      ...s,
      budget: {
        ...s.budget,
        rules: [...s.budget.rules, { id: uid(), from: rule.from, p1: Number(rule.p1) || 0, p2: Number(rule.p2) || 0 }],
      },
    }));
    log(`${me.name} scheduled a contribution change from ${shortY(rule.from)}`);
  };

  const contribCards: { key: 'p1' | 'p2'; name: string }[] = [
    { key: 'p1', name: p1.name },
    ...(p2 ? [{ key: 'p2' as const, name: p2.name }] : []),
  ];

  return (
    <>
      <div>
        <h2 style={{ margin: 0 }}>Budget &amp; contributions</h2>
        <div className="text-muted">
          Paid every 2 weeks, split between the two of you. Add a rule with a future date to see a change before it
          happens.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--space-4)' }}>
        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Saved so far</div>
          <input
            className="input"
            type="number"
            value={data.budget.saved}
            onChange={(e) =>
              setData((s) => ({ ...s, budget: { ...s.budget, saved: Number(e.target.value) || 0 } }))
            }
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 26, background: 'transparent' }}
          />
          <div className="card-meta">Edit to match your real account balance.</div>
        </div>

        {contribCards.map((c) => (
          <div className="card blueprint" key={c.key}>
            <Corners />
            <div className="card-kicker">{c.name} · every 2 weeks</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setCur(c.key, String((Number(cur[c.key]) || 0) - 50))}
                aria-label={`Lower ${c.name}’s contribution`}
              >
                −
              </button>
              <input
                className="input"
                type="number"
                step={10}
                value={cur[c.key]}
                onChange={(e) => setCur(c.key, e.target.value)}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: 26,
                  textAlign: 'center',
                  background: 'transparent',
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setCur(c.key, String((Number(cur[c.key]) || 0) + 50))}
                aria-label={`Raise ${c.name}’s contribution`}
              >
                +
              </button>
            </div>
            <div className="card-meta">Current rule, from {shortY(cur.from)}</div>
          </div>
        ))}

        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Together</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 30, lineHeight: 1 }}>
            {summary.couple}
          </div>
          <div className="card-body">≈ {summary.month} / month</div>
          <div className="card-meta">Next payday {summary.nextPay}</div>
        </div>
      </div>

      <div className="blueprint" style={{ padding: 'var(--space-3) var(--space-4) var(--space-2)' }}>
        <Corners />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 'var(--space-3)',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <h6 style={{ margin: 0, color: 'var(--color-accent-700)' }}>12‑month projection</h6>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Month-end balance. Trips charged in their start month at the Final cost (or the largest option while Final
            is empty).
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
            gap: 6,
            alignItems: 'end',
            height: 190,
            borderBottom: '1px solid var(--color-text)',
            overflow: 'visible',
          }}
        >
          {sim.months.map((m) => {
            const h = Math.max(3, (Math.abs(m.bal) / maxBal) * BAR_MAX);
            const neg = m.bal < 0;
            return (
              <div
                key={m.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  minWidth: 0,
                  textAlign: 'center',
                }}
              >
                {m.trip && (
                  <>
                    <div
                      style={{
                        background: 'var(--color-accent-900)',
                        color: 'var(--color-bg)',
                        padding: '3px 6px',
                        fontSize: 10,
                        lineHeight: 1.25,
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <div style={{ color: 'var(--color-accent-200)' }}>{m.trip.name}</div>
                      <div style={{ fontWeight: 700, fontSize: 11 }}>−{fmt(sim.perVac[m.trip.id].cost)}</div>
                    </div>
                    <div
                      style={{ flex: 1, width: 0, borderLeft: '1px dashed var(--color-accent-700)', minHeight: 6 }}
                    />
                  </>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, marginBottom: 3 }}>{fmt(m.bal)}</div>
                <div
                  style={{
                    width: '70%',
                    height: h,
                    background: neg
                      ? 'var(--color-accent-900)'
                      : m.trip
                        ? 'var(--color-accent-300)'
                        : 'var(--color-accent-100)',
                    border: '1px solid var(--color-accent-700)',
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 6, marginTop: 4 }}>
          {sim.months.map((m) => (
            <div key={m.key} style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-neutral-700)' }}>
              {m.label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 'var(--space-4)',
          alignItems: 'start',
        }}
      >
        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Contribution rules</div>
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>{p1.name}</th>
                <th>{p2?.name}</th>
                <th>Per month</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => (
                <tr key={r.id}>
                  <td>{shortY(r.from)}</td>
                  <td>{fmt(r.p1)}</td>
                  <td>{fmt(r.p2)}</td>
                  <td>≈ {fmt(((Number(r.p1) || 0) + (Number(r.p2) || 0)) * 26 / 12)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      /* The earliest rule is the baseline — without it there's
                         nothing to project from. */
                      disabled={idx === 0}
                      onClick={() =>
                        setData((s) => ({
                          ...s,
                          budget: { ...s.budget, rules: s.budget.rules.filter((x) => x.id !== r.id) },
                        }))
                      }
                      style={{ fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card blueprint">
          <Corners />
          <div className="card-kicker">Plan a future change</div>
          <div className="card-body">
            “From March we each put in $600.” The projection updates immediately; nothing changes until that date.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
            <div className="field">
              <label>From</label>
              <input
                className="input"
                type="date"
                value={rule.from}
                onChange={(e) => setRule((r) => ({ ...r, from: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>{p1.name}</label>
              <input
                className="input"
                type="number"
                value={rule.p1}
                onChange={(e) => setRule((r) => ({ ...r, p1: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>{p2?.name}</label>
              <input
                className="input"
                type="number"
                value={rule.p2}
                onChange={(e) => setRule((r) => ({ ...r, p2: e.target.value }))}
              />
            </div>
          </div>
          <button type="button" className="btn btn-primary blueprint" onClick={addRule} style={{ alignSelf: 'flex-start' }}>
            <Corners />
            Add rule
          </button>
        </div>
      </div>
    </>
  );
}
