import { Corners } from './Blueprint';
import type { ActiveVac } from '../state/derive';

/**
 * "Can we afford this trip by its date?" — the fund balance the morning the
 * trip starts, less what the plan costs.
 */
export function BudgetCheckCard({ vac, withVerdict = false }: { vac: ActiveVac; withVerdict?: boolean }) {
  return (
    <div className="card blueprint">
      <Corners />
      <div className="card-kicker">Budget check</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', fontSize: 13 }}>
        <span className="text-muted">Saved by {vac.startShort}</span>
        <span style={{ fontWeight: 700, textAlign: 'right' }}>{vac.balanceBefore}</span>
        <span className="text-muted">Trip cost ({vac.costSrc})</span>
        <span style={{ fontWeight: 700, textAlign: 'right' }}>−{vac.cost}</span>
        <span style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 4 }}>Left after trip</span>
        <span
          style={{
            borderTop: '1px solid var(--color-divider)',
            paddingTop: 4,
            fontWeight: 700,
            textAlign: 'right',
          }}
        >
          {vac.balanceAfter}
        </span>
      </div>
      {withVerdict && (
        <span className={`tag ${vac.tagClass}`} style={{ alignSelf: 'flex-start' }}>
          {vac.verdict}
        </span>
      )}
    </div>
  );
}
