import React from 'react';
import { RangeBar } from './RangeBar.jsx';

/**
 * Meridian BiomarkerRow — a single lab result: name, measured value + unit, an
 * in/out-of-range status pill, an optional trend delta, and a compact reference
 * RangeBar. Expands the blood/biomarker side of the data model.
 */
export function BiomarkerRow({
  name, value, unit, status = 'optimal', delta, deltaTone = 'flat',
  min, max, optimalLow, optimalHigh, showRange = true, onClick, style,
}) {
  const [hover, setHover] = React.useState(false);
  const statusMap = {
    optimal: { fg: 'var(--green-400)', bg: 'var(--status-success-bg)', label: 'In range' },
    high: { fg: 'var(--amber-400)', bg: 'var(--status-warning-bg)', label: 'High' },
    low: { fg: 'var(--strain-400)', bg: 'var(--status-info-bg)', label: 'Low' },
    critical: { fg: 'var(--red-400)', bg: 'var(--status-danger-bg)', label: 'Out of range' },
  };
  const s = statusMap[status] || statusMap.optimal;
  const dCol = { up: 'var(--green-400)', down: 'var(--red-400)', flat: 'var(--text-tertiary)' }[deltaTone];
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      padding: '14px 4px', borderBottom: '1px solid var(--divider)',
      cursor: onClick ? 'pointer' : 'default',
      background: hover && onClick ? 'rgba(255,255,255,0.02)' : 'transparent',
      transition: 'background var(--dur-fast) var(--ease-out)', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
        {delta && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: dCol, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{deltaTone === 'up' ? '▲' : deltaTone === 'down' ? '▼' : ''}{delta}</span>}
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          {unit && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{unit}</span>}
        </span>
        <span style={{ minWidth: 78, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: s.fg, background: s.bg, borderRadius: 'var(--radius-pill)', padding: '4px 10px' }}>{s.label}</span>
      </div>
      {showRange && min != null && max != null && (
        <div style={{ marginTop: 12 }}>
          <RangeBar value={typeof value === 'number' ? value : parseFloat(value)} min={min} max={max} optimalLow={optimalLow} optimalHigh={optimalHigh} height={6} />
        </div>
      )}
    </div>
  );
}
