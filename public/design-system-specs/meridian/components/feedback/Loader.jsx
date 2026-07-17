import React from 'react';

/** Meridian Spinner — indeterminate circular loader. */
export function Spinner({ size = 24, color = 'var(--brand)', track = 'var(--metric-track)', thickness }) {
  const t = thickness || Math.max(2, Math.round(size / 10));
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      border: `${t}px solid ${track}`, borderTopColor: color,
      animation: 'mrd-spin 0.7s linear infinite',
    }} />
  );
}

/** Meridian Skeleton — shimmering placeholder block for loading states. */
export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)', circle = false, style }) {
  return (
    <span style={{
      display: 'block', width: circle ? height : width, height,
      borderRadius: circle ? '50%' : radius,
      background: 'linear-gradient(90deg, var(--ink-800) 25%, var(--ink-700) 37%, var(--ink-800) 63%)',
      backgroundSize: '200% 100%', animation: 'mrd-shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

/** Meridian Loader — default indeterminate loader (alias of Spinner). */
export function Loader(props) {
  return <Spinner {...props} />;
}
