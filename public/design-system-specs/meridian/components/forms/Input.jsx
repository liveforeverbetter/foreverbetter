import React from 'react';

/** Meridian text input. Dark inset field with focus ring, optional leading icon, hint & error. */
export function Input({
  label, hint, error, value, defaultValue, placeholder, type = 'text',
  iconLeft, iconRight, size = 'md', disabled = false, onChange, style, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = { sm: 36, md: 44, lg: 52 }[size] || 44;
  const fieldId = React.useId ? React.useId() : undefined;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', ...style }}>
      {label && <label htmlFor={fieldId} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: h, padding: '0 14px',
        background: 'var(--surface-input)',
        border: `1px solid ${error ? 'var(--red-500)' : focus ? 'var(--brand)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: focus && !error ? '0 0 0 3px var(--focus-ring)' : 'none',
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
        opacity: disabled ? 0.5 : 1,
      }}>
        {iconLeft && <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>{iconLeft}</span>}
        <input
          id={fieldId} type={type} value={value} defaultValue={defaultValue}
          placeholder={placeholder} disabled={disabled} onChange={onChange}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
          }}
          {...rest}
        />
        {iconRight && <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>{iconRight}</span>}
      </div>
      {(hint || error) && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: error ? 'var(--red-400)' : 'var(--text-tertiary)' }}>{error || hint}</span>}
    </div>
  );
}
