import React from 'react';

/** Meridian ListItem — tappable row: leading icon/media, title + subtitle, trailing value/chevron. */
export function ListItem({ icon, iconTone = 'neutral', title, subtitle, trailing, chevron = false, onClick, divider = false, style }) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    neutral: 'var(--ink-600)', brand: 'rgba(18,217,130,0.16)', recovery: 'rgba(52,224,138,0.16)',
    strain: 'rgba(59,182,245,0.16)', sleep: 'rgba(138,155,255,0.16)', warning: 'rgba(255,210,63,0.16)',
  };
  const toneFg = {
    neutral: 'var(--text-secondary)', brand: 'var(--mint-400)', recovery: 'var(--green-400)',
    strain: 'var(--strain-400)', sleep: 'var(--sleep-400)', warning: 'var(--amber-400)',
  };
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px', width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: divider ? '1px solid var(--divider)' : 'none',
        background: hover && onClick ? 'rgba(255,255,255,0.02)' : 'transparent',
        borderRadius: 'var(--radius-sm)',
        transition: 'background var(--dur-fast) var(--ease-out)',
        ...style,
      }}
    >
      {icon && (
        <span style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: tones[iconTone], color: toneFg[iconTone], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {subtitle && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)' }}>{subtitle}</span>}
      </div>
      {trailing && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>{trailing}</span>}
      {chevron && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>}
    </div>
  );
}
