import React from 'react';

/**
 * Meridian ActivityRow — a logged/planned activity chip with a colored time badge,
 * label and time range (My Day / Today's Activities).
 */
export function ActivityRow({ icon = 'moon', channel = 'sleep', duration, label, start, end, meta, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const colors = { sleep: 'var(--metric-sleep)', strain: 'var(--metric-strain)', recovery: 'var(--metric-recovery)', stress: 'var(--metric-stress)' };
  const bg = { sleep: 'rgba(138,155,255,0.16)', strain: 'rgba(59,182,245,0.16)', recovery: 'rgba(52,224,138,0.16)', stress: 'rgba(255,210,63,0.16)' }[channel];
  const c = colors[channel] || colors.sleep;
  const glyphs = {
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/>,
    activity: <path d="M4 12h3l2.5-6 4 12 2.5-6H21"/>,
    heart: <path d="M20.8 8.6a5 5 0 0 0-8.8-3.2A5 5 0 0 0 3.2 8.6c0 5 8.8 11 8.8 11s8.8-6 8.8-11Z"/>,
    run: <><circle cx="13" cy="5" r="2"/><path d="M8 21l3-5-2-3 4-2 2 3h3"/></>,
  };
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
      background: hover && onClick ? 'var(--surface-card-hover)' : 'var(--surface-card-raised)',
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
      cursor: onClick ? 'pointer' : 'default', transition: 'background var(--dur-fast) var(--ease-out)', ...style,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 'var(--radius-sm)', background: bg, color: c, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{glyphs[icon] || glyphs.moon}</svg>
        {duration}
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', flex: 1 }}>{label}</span>
      <span style={{ textAlign: 'right', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
        {(start || end) && <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{start}{end && ` – ${end}`}</div>}
        {meta && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{meta}</div>}
      </span>
    </div>
  );
}
