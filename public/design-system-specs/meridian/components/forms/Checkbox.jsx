import React from 'react';

/** Meridian Checkbox — square control with mint fill + check when selected. */
export function Checkbox({ checked = false, indeterminate = false, disabled = false, label, description, onChange, style }) {
  const on = checked || indeterminate;
  return (
    <label style={{ display: 'inline-flex', alignItems: description ? 'flex-start' : 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 20, height: 20, flexShrink: 0, marginTop: description ? 1 : 0,
          borderRadius: 'var(--radius-xs)',
          background: on ? 'var(--brand)' : 'var(--surface-input)',
          border: `1px solid ${on ? 'var(--brand)' : 'var(--border-strong)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        {indeterminate
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          : checked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </span>
      {(label || description) && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{label}</span>}
          {description && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.35 }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
