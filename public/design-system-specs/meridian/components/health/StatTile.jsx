import React from 'react';

/** Meridian StatTile — compact labeled metric with a big number and optional delta/spark. */
export function StatTile({ icon, iconTone = 'neutral', label, value, unit, delta, deltaTone = 'flat', secondary, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const toneBg = { neutral: 'var(--ink-700)', recovery: 'rgba(52,224,138,0.16)', strain: 'rgba(59,182,245,0.16)', sleep: 'rgba(138,155,255,0.16)', stress: 'rgba(255,210,63,0.16)', brand: 'rgba(18,217,130,0.16)' };
  const toneFg = { neutral: 'var(--text-secondary)', recovery: 'var(--green-400)', strain: 'var(--strain-400)', sleep: 'var(--sleep-400)', stress: 'var(--amber-400)', brand: 'var(--mint-400)' };
  const dCol = { up: 'var(--green-400)', down: 'var(--red-400)', flat: 'var(--text-tertiary)' }[deltaTone];
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', flexDirection: 'column', gap: 12, padding: 16,
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
      cursor: onClick ? 'pointer' : 'default',
      animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards',
      transition: 'border-color var(--dur-base) var(--ease-out)',
      ...(hover && onClick ? { borderColor: 'var(--border-default)' } : {}),
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: toneBg[iconTone], color: toneFg[iconTone], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>}
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</span>
        </span>
        {delta && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: dCol, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{deltaTone === 'up' ? '▲' : deltaTone === 'down' ? '▼' : ''}{delta}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {unit && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-tertiary)' }}>{unit}</span>}
        {secondary && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{secondary}</span>}
      </div>
    </div>
  );
}
