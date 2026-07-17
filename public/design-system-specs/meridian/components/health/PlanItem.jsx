import React from 'react';
import { MetricRing } from './MetricRing.jsx';

/**
 * Meridian PlanItem — a gamified goal row: label + progress shown either as a
 * small count ring (e.g. 2/7) or an inline fraction. Completed goals turn mint.
 */
export function PlanItem({ label, current = 0, target = 1, channel = 'brand', variant = 'ring', done, style }) {
  const complete = done != null ? done : current >= target;
  const chan = complete ? 'brand' : channel;
  const color = { brand: 'var(--mint-400)', recovery: 'var(--green-400)', strain: 'var(--strain-400)', sleep: 'var(--sleep-400)' }[chan] || 'var(--mint-400)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', ...style }}>
      <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: complete ? color : 'var(--text-primary)' }}>{label}</span>
      {variant === 'ring' ? (
        <MetricRing channel={chan} value={current} max={target} size={40} thickness={4} sweep={360} glow={false}
          display={`${current}/${target}`} style={{ gap: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{current}/{target}</span>
        </MetricRing>
      ) : (
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color, fontVariantNumeric: 'tabular-nums' }}>{current}/{target}</span>
      )}
    </div>
  );
}
