import React from 'react';

/** Meridian Select — styled wrapper over a native select for a11y + keyboard support. */
export function Select({ label, hint, value, defaultValue, onChange, options = [], placeholder, size = 'md', disabled = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const h = { sm: 36, md: 44, lg: 52 }[size] || 44;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', ...style }}>
      {label && <label style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{
        position: 'relative', height: h,
        background: 'var(--surface-input)',
        border: `1px solid ${focus ? 'var(--brand)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: focus ? '0 0 0 3px var(--focus-ring)' : 'none',
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
        opacity: disabled ? 0.5 : 1,
      }}>
        <select
          value={value} defaultValue={defaultValue} onChange={onChange} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: '100%', height: '100%', padding: '0 40px 0 14px', appearance: 'none',
            background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer',
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
          }}
          {...rest}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map(o => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return <option key={val} value={val} style={{ background: 'var(--ink-800)' }}>{lab}</option>;
          })}
        </select>
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)', display: 'flex' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {hint && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</span>}
    </div>
  );
}
