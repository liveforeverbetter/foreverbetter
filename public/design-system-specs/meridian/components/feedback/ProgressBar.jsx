import React from 'react';

/** Meridian ProgressBar — linear determinate progress (plan completion, goals). */
export function ProgressBar({ value = 0, max = 100, tone = 'brand', height = 6, label, valueLabel, showValue = false, style }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  const tones = {
    brand: 'var(--brand)', recovery: 'var(--metric-recovery)', strain: 'var(--metric-strain)',
    sleep: 'var(--metric-sleep)', warning: 'var(--amber-400)', danger: 'var(--red-400)',
  };
  const c = tones[tone] || tones.brand;
  return (
    <div style={{ width: '100%', ...style }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>}
          {showValue && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{valueLabel || `${Math.round(pct)}%`}</span>}
        </div>
      )}
      <div style={{ width: '100%', height, background: 'var(--metric-track)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <div style={{ width: `${shown}%`, height: '100%', background: c, borderRadius: 'var(--radius-pill)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
    </div>
  );
}
