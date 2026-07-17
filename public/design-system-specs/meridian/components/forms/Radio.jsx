import React from 'react';

/** Meridian Radio — single-select circular control. Use inside a RadioGroup or standalone. */
export function Radio({ checked = false, disabled = false, label, description, name, value, onChange, style }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: description ? 'flex-start' : 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(value)}
        style={{
          width: 20, height: 20, flexShrink: 0, borderRadius: '50%', marginTop: description ? 1 : 0,
          background: 'var(--surface-input)',
          border: `1px solid ${checked ? 'var(--brand)' : 'var(--border-strong)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand)' }} />}
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

/** Vertical group of radios bound to one value. */
export function RadioGroup({ value, onChange, options = [], name = 'mrd-radio', gap = 12, style }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const desc = typeof o === 'string' ? undefined : o.description;
        return <Radio key={val} name={name} value={val} label={lab} description={desc} checked={value === val} onChange={onChange} />;
      })}
    </div>
  );
}
