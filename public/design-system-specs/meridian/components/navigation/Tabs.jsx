import React from 'react';

/** Meridian Tabs — underline or segmented tab switcher. */
export function Tabs({ items = [], value, onChange, variant = 'underline', style }) {
  if (variant === 'segmented') {
    return (
      <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'var(--surface-inset)', borderRadius: 'var(--radius-md)', ...style }}>
        {items.map(it => {
          const active = it.value === value;
          return (
            <button key={it.value} type="button" onClick={() => onChange && onChange(it.value)} style={{
              padding: '7px 16px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: active ? 'var(--surface-card-raised)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
              transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
            }}>{it.label}</button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-subtle)', ...style }}>
      {items.map(it => {
        const active = it.value === value;
        return (
          <button key={it.value} type="button" onClick={() => onChange && onChange(it.value)} style={{
            position: 'relative', padding: '0 0 12px', border: 'none', background: 'none', cursor: 'pointer',
            color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            transition: 'color var(--dur-fast) var(--ease-out)',
          }}>
            {it.label}
            {active && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: 'var(--brand)' }} />}
          </button>
        );
      })}
    </div>
  );
}
