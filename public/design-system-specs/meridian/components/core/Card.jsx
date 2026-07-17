import React from 'react';

/**
 * Meridian Card — the base surface for all dashboard content. Dark elevated
 * plate with a hairline border. `interactive` adds hover lift; `glow` casts a
 * colored ambient halo for live-metric emphasis.
 */
export function Card({
  children,
  padding = 'md',
  raised = false,
  interactive = false,
  glow = null, // 'recovery' | 'strain' | 'sleep' | 'brand'
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const pads = { none: 0, sm: 16, md: 'var(--card-pad)', lg: 'var(--card-pad-lg)' };
  const glows = {
    recovery: 'var(--glow-recovery)', strain: 'var(--glow-strain)',
    sleep: 'var(--glow-sleep)', brand: 'var(--glow-brand)',
  };
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: raised ? 'var(--surface-card-raised)' : 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: pads[padding],
        boxShadow: glow ? glows[glow] : 'var(--shadow-card)',
        animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards',
        transition: 'transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
        cursor: interactive || onClick ? 'pointer' : 'default',
        ...(interactive && hover ? { transform: 'translateY(-2px)', borderColor: 'var(--border-default)', background: 'var(--surface-card-raised)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Optional header row for a Card: eyebrow label + right-aligned action/chevron. */
export function CardHeader({ label, action, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, ...style }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</span>
      {action}
    </div>
  );
}
