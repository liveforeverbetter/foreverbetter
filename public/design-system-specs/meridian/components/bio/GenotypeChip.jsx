import React from 'react';

/**
 * Meridian GenotypeChip — displays a gene's allele pair (genotype) as a compact
 * monospace-style chip, tinted by effect (protective / neutral / risk).
 */
export function GenotypeChip({ genotype, effect = 'neutral', size = 'md', style }) {
  const map = {
    protective: { fg: 'var(--green-400)', bg: 'rgba(52,224,138,0.14)' },
    neutral: { fg: 'var(--ink-100)', bg: 'var(--ink-700)' },
    risk: { fg: 'var(--amber-400)', bg: 'rgba(255,210,63,0.14)' },
    highRisk: { fg: 'var(--red-400)', bg: 'rgba(255,90,110,0.14)' },
  };
  const e = map[effect] || map.neutral;
  const dims = size === 'sm' ? { h: 22, fs: 12, px: 8 } : { h: 28, fs: 14, px: 11 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      height: dims.h, padding: `0 ${dims.px}px`, background: e.bg, color: e.fg,
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: dims.fs,
      letterSpacing: '0.06em', borderRadius: 'var(--radius-sm)',
      fontVariantNumeric: 'tabular-nums', ...style,
    }}>{genotype}</span>
  );
}
