import { Badge } from './ui/Badge';
import type { ActiveVac } from '../state/derive';

/**
 * "Can we afford this trip by its date?" — the fund balance the morning the trip
 * starts, less what the plan costs.
 */
export function BudgetCheckCard({ vac, withVerdict = false }: { vac: ActiveVac; withVerdict?: boolean }) {
  return (
    <section className="card card-flush">
      <header className="card-hd">
        <h3>Budget check</h3>
        {withVerdict && <Badge tone={vac.tone}>{vac.verdict}</Badge>}
      </header>
      <div className="card-bd">
        <table className="table" style={{ marginTop: -4 }}>
          <tbody>
            <tr>
              <td className="muted">Saved by {vac.startShort}</td>
              <td className="n">{vac.balanceBefore}</td>
            </tr>
            <tr>
              <td className="muted">
                Trip cost <span className="subtle">({vac.costSrc})</span>
              </td>
              <td className="n">−{vac.cost}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Left after trip</td>
              <td
                className="n"
                style={{ fontWeight: 700, color: vac.tone === 'critical' ? 'var(--critical-text)' : 'var(--teal-text)' }}
              >
                {vac.balanceAfter}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
