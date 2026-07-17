import React from 'react';

/** Meridian Tooltip — hover popover. Wraps a trigger; shows label on hover/focus. */
export function Tooltip({ label, side = 'top', children, style }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  };
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" style={{
          position: 'absolute', zIndex: 200, whiteSpace: 'nowrap', pointerEvents: 'none',
          background: 'var(--ink-700)', color: 'var(--text-primary)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          padding: '6px 10px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
          boxShadow: 'var(--shadow-raised)', animation: 'mrd-fade-in var(--dur-fast) var(--ease-out)', ...pos[side], ...style,
        }}>{label}</span>
      )}
    </span>
  );
}
