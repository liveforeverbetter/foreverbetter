import React from 'react';

/**
 * Meridian InsightCard — coaching insight / daily-outlook row. Leading glyph tile,
 * title, body copy, and a trailing chevron. Optional accent hairline on the left.
 */
export function InsightCard({ icon, iconTone = 'brand', title, children, trailing, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const bg = { brand: 'rgba(18,217,130,0.14)', recovery: 'rgba(52,224,138,0.16)', strain: 'rgba(59,182,245,0.16)', sleep: 'rgba(138,155,255,0.16)', stress: 'rgba(255,210,63,0.16)', neutral: 'var(--ink-700)' };
  const fg = { brand: 'var(--mint-400)', recovery: 'var(--green-400)', strain: 'var(--strain-400)', sleep: 'var(--sleep-400)', stress: 'var(--amber-400)', neutral: 'var(--text-secondary)' };
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      position: 'relative', display: 'flex', alignItems: children ? 'flex-start' : 'center', gap: 14,
      padding: '16px 16px', background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
      animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards',
      transition: 'border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
      ...(hover && onClick ? { borderColor: 'var(--border-default)', background: 'var(--surface-card-raised)', transform: 'translateY(-2px)' } : {}),
      ...style,
    }}>
      {icon && <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: bg[iconTone], color: fg[iconTone], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: children ? 5 : 0 }}>{title}</div>
        {children && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</div>}
      </div>
      {trailing !== undefined ? trailing : (onClick && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: children ? 2 : 0 }}><polyline points="9 18 15 12 9 6"/></svg>)}
    </div>
  );
}
