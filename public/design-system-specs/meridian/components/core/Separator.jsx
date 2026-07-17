import React from 'react';

/** Meridian Separator — hairline divider. Horizontal or vertical, optional label. */
export function Separator({ orientation = 'horizontal', label, inset = 0, style }) {
  if (orientation === 'vertical') {
    return <div role="separator" style={{ width: 1, alignSelf: 'stretch', background: 'var(--divider)', margin: `${inset}px 0`, ...style }} />;
  }
  if (label) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: `${inset}px 0`, ...style }}>
        <div style={{ height: 1, flex: 1, background: 'var(--divider)' }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
        <div style={{ height: 1, flex: 1, background: 'var(--divider)' }} />
      </div>
    );
  }
  return <div role="separator" style={{ height: 1, width: '100%', background: 'var(--divider)', margin: `${inset}px 0`, ...style }} />;
}
