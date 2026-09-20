import { useId, useMemo, useState } from 'react';
import type { MonthPoint } from '../lib/budget';
import { fmt } from '../lib/format';
import { Icon } from './Icon';

type Props = {
  months: MonthPoint[];
  /** Trip id -> what it costs the fund, for the annotations. */
  tripCost: (id: string) => number;
};

const W = 960;
const H = 260;
const PAD = { t: 34, r: 18, b: 34, l: 62 };

/** Round a scale bound out to a clean number so the axis reads 0 / 5,000 / … */
function niceStep(range: number) {
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/**
 * Month-end balance of the travel fund over the next year — one series, so it
 * reads as a trend line rather than a bar per month. Zero is drawn as a real
 * baseline because the whole question is whether the line ever goes under it;
 * anything below zero is filled in the critical tone and labelled.
 */
export function FundChart({ months, tripCost }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const uid = useId().replace(/:/g, '');

  const geo = useMemo(() => {
    const vals = months.map((m) => m.bal);
    const hi = Math.max(0, ...vals);
    const lo = Math.min(0, ...vals);
    const step = niceStep(hi - lo || 1);
    const top = Math.ceil(hi / step) * step;
    const bottom = Math.floor(lo / step) * step;
    const span = top - bottom || 1;

    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;
    const x = (i: number) => PAD.l + (months.length === 1 ? plotW / 2 : (i * plotW) / (months.length - 1));
    const y = (v: number) => PAD.t + ((top - v) / span) * plotH;

    const ticks: number[] = [];
    for (let v = bottom; v <= top + 0.001; v += step) ticks.push(Math.round(v));

    const pts = months.map((m, i) => ({ x: x(i), y: y(m.bal), m, i }));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const zeroY = y(0);
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${zeroY.toFixed(1)} L${pts[0].x.toFixed(1)},${zeroY.toFixed(1)} Z`;

    return { pts, line, area, ticks, y, x, zeroY, plotH, plotW };
  }, [months]);

  const hasNegative = months.some((m) => m.bal < 0);
  const active = hover === null ? null : geo.pts[hover];

  if (asTable) {
    return (
      <>
        <ChartToolbar asTable={asTable} onToggle={() => setAsTable(false)} />
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="n">Balance at month end</th>
                <th>Trip that month</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key}>
                  <td>{m.label}</td>
                  <td className="n" style={{ color: m.bal < 0 ? 'var(--critical-text)' : undefined }}>
                    {fmt(m.bal)}
                  </td>
                  <td className="muted">{m.trip ? `${m.trip.name} · −${fmt(tripCost(m.trip.id))}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <ChartToolbar asTable={asTable} onToggle={() => setAsTable(true)} />
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Projected travel fund balance by month">
          <defs>
            <clipPath id={`pos-${uid}`}>
              <rect x="0" y={PAD.t - 6} width={W} height={Math.max(0, geo.zeroY - PAD.t + 6)} />
            </clipPath>
            <clipPath id={`neg-${uid}`}>
              <rect x="0" y={geo.zeroY} width={W} height={Math.max(0, H - geo.zeroY)} />
            </clipPath>
          </defs>

          {/* gridlines + y ticks */}
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--grid)" strokeWidth="1" />
              <text
                x={PAD.l - 10}
                y={geo.y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="11"
                fill="var(--text-3)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {t === 0 ? '0' : Math.abs(t) >= 1000 ? `${(t / 1000).toFixed(0)}k` : String(t)}
              </text>
            </g>
          ))}

          {/* the fund, split at zero so a shortfall reads as a shortfall */}
          <path d={geo.area} fill="var(--series-wash)" clipPath={`url(#pos-${uid})`} />
          {hasNegative && <path d={geo.area} fill="var(--series-negative-wash)" clipPath={`url(#neg-${uid})`} />}
          <path d={geo.line} fill="none" stroke="var(--series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#pos-${uid})`} />
          {hasNegative && (
            <path d={geo.line} fill="none" stroke="var(--series-negative)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#neg-${uid})`} />
          )}

          {/* zero baseline */}
          <line x1={PAD.l} x2={W - PAD.r} y1={geo.zeroY} y2={geo.zeroY} stroke="var(--axis)" strokeWidth="1.5" />

          {/* trip annotations — labelled selectively, never a value per point */}
          {geo.pts.map((p) =>
            p.m.trip ? (
              <g key={p.m.key}>
                <line x1={p.x} x2={p.x} y1={PAD.t - 8} y2={p.y} stroke="var(--accent-400)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={p.x} cy={p.y} r="5" fill={p.m.bal < 0 ? 'var(--series-negative)' : 'var(--series)'} stroke="var(--surface)" strokeWidth="2" />
                <text x={p.x} y={PAD.t - 14} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-2)">
                  {p.m.trip.name}
                </text>
              </g>
            ) : null,
          )}

          {/* end marker */}
          <circle
            cx={geo.pts[geo.pts.length - 1].x}
            cy={geo.pts[geo.pts.length - 1].y}
            r="4"
            fill="var(--series)"
            stroke="var(--surface)"
            strokeWidth="2"
          />

          {/* x labels */}
          {geo.pts.map((p) => (
            <text key={p.m.key} x={p.x} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--text-3)">
              {p.m.label}
            </text>
          ))}

          {/* crosshair */}
          {active && (
            <g pointerEvents="none">
              <line x1={active.x} x2={active.x} y1={PAD.t - 8} y2={H - PAD.b} stroke="var(--border-strong)" strokeWidth="1" />
              <circle cx={active.x} cy={active.y} r="5" fill="var(--surface)" stroke={active.m.bal < 0 ? 'var(--series-negative)' : 'var(--series)'} strokeWidth="2.5" />
            </g>
          )}

          {/* hit targets — wider than the marks */}
          {geo.pts.map((p, i) => (
            <rect
              key={p.m.key}
              x={p.x - geo.plotW / (months.length - 1) / 2}
              y={PAD.t - 12}
              width={geo.plotW / (months.length - 1)}
              height={H - PAD.t - PAD.b + 12}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            />
          ))}
        </svg>

        {active && (
          <div
            className="chart-tip"
            style={{ left: `${(active.x / W) * 100}%`, top: `${((active.y - 14) / H) * 100}%` }}
          >
            <div className="m">{active.m.label}</div>
            <div className="v" style={{ color: active.m.bal < 0 ? 'var(--critical-text)' : 'var(--text)' }}>
              {fmt(active.m.bal)}
            </div>
            {active.m.trip && (
              <div className="v subtle" style={{ marginTop: 2 }}>
                {active.m.trip.name} −{fmt(tripCost(active.m.trip.id))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ChartToolbar({ asTable, onToggle }: { asTable: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s2)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
        <span style={{ width: 14, height: 2, borderRadius: 2, background: 'var(--series)' }} />
        Month-end balance
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onToggle} style={{ marginLeft: 'auto' }}>
        <Icon name={asTable ? 'chart' : 'table'} size={13} />
        {asTable ? 'Chart' : 'Table'}
      </button>
    </div>
  );
}
