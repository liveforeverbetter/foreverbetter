import React from 'react';

/**
 * Meridian Badge — compact status/label pill. Semantic tones map to the
 * performance palette; `soft` uses a tinted background, `solid` a filled chip.
 */
export function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  dot = false,
  icon = null,
  style,
  ...rest
}) {
  const tones = {
    neutral: { fg: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.07)', solidBg: 'var(--ink-600)', solidFg: 'var(--text-primary)' },
    brand:   { fg: 'var(--mint-400)', bg: 'rgba(18,217,130,0.14)', solidBg: 'var(--brand)', solidFg: 'var(--text-inverse)' },
    success: { fg: 'var(--green-400)', bg: 'var(--status-success-bg)', solidBg: 'var(--green-500)', solidFg: 'var(--text-inverse)' },
    warning: { fg: 'var(--amber-400)', bg: 'var(--status-warning-bg)', solidBg: 'var(--amber-500)', solidFg: 'var(--text-inverse)' },
    danger:  { fg: 'var(--red-400)', bg: 'var(--status-danger-bg)', solidBg: 'var(--red-500)', solidFg: '#fff' },
    info:    { fg: 'var(--strain-400)', bg: 'var(--status-info-bg)', solidBg: 'var(--strain-500)', solidFg: 'var(--text-inverse)' },
    sleep:   { fg: 'var(--sleep-400)', bg: 'rgba(138,155,255,0.14)', solidBg: 'var(--sleep-500)', solidFg: '#fff' },
  };
  const t = tones[tone] || tones.neutral;
  const solid = variant === 'solid';
  const dims = size === 'sm' ? { h: 20, fs: 11, px: 8 } : { h: 24, fs: 12, px: 10 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: dims.h, padding: `0 ${dims.px}px`,
      background: solid ? t.solidBg : t.bg,
      color: solid ? t.solidFg : t.fg,
      fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: dims.fs,
      letterSpacing: '0.02em', lineHeight: 1,
      borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
      ...style,
    }} {...rest}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: solid ? t.solidFg : t.fg }} />}
      {icon}
      {children}
    </span>
  );
}
