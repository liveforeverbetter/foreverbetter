import React from 'react';
import { MetricRing } from './MetricRing.jsx';

/** Meridian MetricCard — a Card wrapping a MetricRing with a trend delta and chevron. */
export function MetricCard({ channel = 'recovery', value, max = 100, display, unit, label, delta, deltaTone, note, onClick, glow = true, style }) {
  const [hover, setHover] = React.useState(false);
  const glowMap = { recovery: 'var(--glow-recovery)', strain: 'var(--glow-strain)', sleep: 'var(--glow-sleep)', brand: 'var(--glow-brand)', stress: '0 0 28px rgba(255,210,63,0.35)' };
  const dTone = { up: 'var(--green-400)', down: 'var(--red-400)', flat: 'var(--text-tertiary)' }[deltaTone || 'flat'];
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: 20, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', cursor: onClick ? 'pointer' : 'default',
      boxShadow: glow ? glowMap[channel] : 'var(--shadow-card)',
      animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards',
      transition: 'transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
      ...(hover && onClick ? { transform: 'translateY(-2px)', borderColor: 'var(--border-default)' } : {}),
      ...style,
    }}>
      <MetricRing channel={channel} value={value} max={max} display={display} unit={unit} label={label} glow={glow} size={116} />
      {(delta || note) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 13 }}>
          {delta && <span style={{ color: dTone, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {deltaTone === 'up' ? '▲' : deltaTone === 'down' ? '▼' : ''}{delta}
          </span>}
          {note && <span style={{ color: 'var(--text-tertiary)' }}>{note}</span>}
        </div>
      )}
    </div>
  );
}
