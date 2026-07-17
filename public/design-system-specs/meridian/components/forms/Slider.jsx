import React from 'react';

/**
 * Meridian Slider — labeled range with a tick-mark rail (the "pace of aging" style).
 * Controlled via value/onChange. Ticks render a measured gauge feel.
 */
export function Slider({ value = 0, min = 0, max = 100, step = 1, ticks = 0, leftLabel, rightLabel, valueLabel, tone = 'brand', onChange, style }) {
  const pct = ((value - min) / (max - min)) * 100;
  const colors = { brand: 'var(--brand)', recovery: 'var(--metric-recovery)', strain: 'var(--metric-strain)', sleep: 'var(--metric-sleep)' };
  const c = colors[tone] || colors.brand;
  return (
    <div style={{ width: '100%', ...style }}>
      {(valueLabel != null) && (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{valueLabel}</span>
        </div>
      )}
      {ticks > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 22, marginBottom: 6, position: 'relative' }}>
          {Array.from({ length: ticks }).map((_, i) => {
            const near = Math.abs((i / (ticks - 1)) * 100 - pct) < (100 / ticks) / 2;
            return <span key={i} style={{ width: 2, height: near ? 22 : 12, borderRadius: 1, background: near ? c : 'var(--border-strong)' }} />;
          })}
        </div>
      )}
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--metric-track)' }} />
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 4, borderRadius: 2, background: c }} />
        <div style={{ position: 'absolute', left: `calc(${pct}% - 9px)`, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: `0 0 0 3px ${c}44, 0 1px 3px rgba(0,0,0,0.5)` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange && onChange(Number(e.target.value))}
          style={{ position: 'absolute', left: 0, right: 0, width: '100%', height: 24, opacity: 0, cursor: 'pointer', margin: 0 }} />
      </div>
      {(leftLabel || rightLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{leftLabel}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
