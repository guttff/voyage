import { useMemo, useState } from 'react';
import { FundChart } from '../components/FundChart';
import { Icon } from '../components/Icon';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { addDays, fmt, shortY, today, uid } from '../lib/format';
import { useStore } from '../state/store';
import { budgetSummary, runSimulation } from '../state/derive';

export function Budget() {
  const { data, setData, log, me } = useStore();
  const toast = useToast();
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
  const trough = sim.months.reduce((lo, m) => Math.min(lo, m.bal), Infinity);
  const shortMonths = sim.months.filter((m) => m.bal < 0);

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
    toast(`Contribution change scheduled for ${shortY(rule.from)}`, 'good');
  };

  const people: { key: 'p1' | 'p2'; name: string }[] = [
    { key: 'p1', name: p1.name },
    ...(p2 ? [{ key: 'p2' as const, name: p2.name }] : []),
  ];

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>Travel fund</h1>
          <p>Paid every 2 weeks, split between the two of you. Schedule a change ahead of time to see it land.</p>
        </div>
      </div>

      <div className="grid grid-kpi">
        <section className="card">
          <span className="label">Saved so far</span>
          <input
            className="input input-lg"
            type="number"
            value={data.budget.saved}
            onChange={(e) => setData((s) => ({ ...s, budget: { ...s.budget, saved: Number(e.target.value) || 0 } }))}
            aria-label="Amount saved so far"
          />
          <span className="subtle" style={{ fontSize: 12 }}>
            Match this to your real account balance.
          </span>
        </section>

        {people.map((c) => (
          <section className="card" key={c.key}>
            <span className="label">{c.name} · every 2 weeks</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setCur(c.key, String((Number(cur[c.key]) || 0) - 50))}
                aria-label={`Lower ${c.name}’s contribution by 50`}
              >
                <Icon name="minus" size={15} />
              </button>
              <input
                className="input input-lg"
                type="number"
                step={10}
                value={cur[c.key]}
                onChange={(e) => setCur(c.key, e.target.value)}
                style={{ textAlign: 'center' }}
                aria-label={`${c.name}’s contribution`}
              />
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setCur(c.key, String((Number(cur[c.key]) || 0) + 50))}
                aria-label={`Raise ${c.name}’s contribution by 50`}
              >
                <Icon name="plus" size={15} />
              </button>
            </div>
            <span className="subtle" style={{ fontSize: 12 }}>
              Current rule, from {shortY(cur.from)}
            </span>
          </section>
        ))}

        <section className="card">
          <span className="label">Together</span>
          <span className="stat-value num">{summary.couple}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>≈ {summary.month} / month</span>
          <span className="subtle" style={{ fontSize: 12, marginTop: 'auto' }}>
            Next payday {summary.nextPay}
          </span>
        </section>
      </div>

      <section className="card card-flush">
        <header className="card-hd">
          <div>
            <h3>12-month projection</h3>
            <p className="subtle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Month-end balance. Each trip is charged in its start month at the Final cost, or the priciest option while
              Final is empty.
            </p>
          </div>
          {shortMonths.length > 0 ? (
            <Badge tone="critical">Dips to {fmt(trough)}</Badge>
          ) : (
            <Badge tone="good">Stays positive</Badge>
          )}
        </header>
        <div className="card-bd">
          <FundChart months={sim.months} tripCost={(id) => sim.perVac[id]?.cost ?? 0} />
        </div>
      </section>

      <div className="grid grid-2">
        <section className="card card-flush">
          <header className="card-hd">
            <h3>Contribution rules</h3>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th className="n">{p1.name}</th>
                {p2 && <th className="n">{p2.name}</th>}
                <th className="n">Per month</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => (
                <tr key={r.id}>
                  <td>
                    {shortY(r.from)}
                    {r.from > today() && (
                      <span style={{ marginLeft: 6 }}>
                        <Badge tone="accent" small icon={null}>
                          scheduled
                        </Badge>
                      </span>
                    )}
                  </td>
                  <td className="n">{fmt(r.p1)}</td>
                  {p2 && <td className="n">{fmt(r.p2)}</td>}
                  <td className="n">≈ {fmt((((Number(r.p1) || 0) + (Number(r.p2) || 0)) * 26) / 12)}</td>
                  <td className="n">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      /* The earliest rule is the baseline — without it there is
                         nothing to project from. */
                      disabled={idx === 0}
                      title={idx === 0 ? 'The baseline rule cannot be removed' : 'Remove this rule'}
                      onClick={() =>
                        setData((s) => ({
                          ...s,
                          budget: { ...s.budget, rules: s.budget.rules.filter((x) => x.id !== r.id) },
                        }))
                      }
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h3>Schedule a change</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            “From March we each put in $600.” The projection updates immediately; nothing actually changes until that
            date.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 'var(--s2)' }}>
            <div className="field">
              <label htmlFor="r-from">From</label>
              <input
                id="r-from"
                className="input"
                type="date"
                value={rule.from}
                onChange={(e) => setRule((r) => ({ ...r, from: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="r-p1">{p1.name}</label>
              <input
                id="r-p1"
                className="input"
                type="number"
                value={rule.p1}
                onChange={(e) => setRule((r) => ({ ...r, p1: e.target.value }))}
              />
            </div>
            {p2 && (
              <div className="field">
                <label htmlFor="r-p2">{p2.name}</label>
                <input
                  id="r-p2"
                  className="input"
                  type="number"
                  value={rule.p2}
                  onChange={(e) => setRule((r) => ({ ...r, p2: e.target.value }))}
                />
              </div>
            )}
          </div>
          <button type="button" className="btn btn-primary" onClick={addRule} style={{ alignSelf: 'flex-start' }}>
            <Icon name="plus" size={14} />
            Add rule
          </button>
        </section>
      </div>
    </>
  );
}
