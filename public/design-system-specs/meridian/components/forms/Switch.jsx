import React from 'react';

/** Meridian Switch — binary toggle. On-state fills mint; thumb slides with spring ease. */
export function Switch({ checked = false, disabled = false, size = 'md', label, onChange, style }) {
  const dims = size === 'sm' ? { w: 36, h: 20, t: 14 } : { w: 46, h: 26, t: 20 };
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: dims.w, height: dims.h, flexShrink: 0, borderRadius: 'var(--radius-pill)',
          background: checked ? 'var(--brand)' : 'var(--ink-600)',
          padding: 3, display: 'flex', alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          transition: 'background var(--dur-base) var(--ease-out)',
        }}
      >
        <span style={{
          width: dims.t, height: dims.t, borderRadius: '50%',
          background: checked ? 'var(--text-inverse)' : 'var(--ink-100)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          transition: 'transform var(--dur-base) var(--ease-spring)',
        }} />
      </span>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}
