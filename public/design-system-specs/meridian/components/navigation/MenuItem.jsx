import React from 'react';

/** Meridian MenuItem — a row for dropdowns, context menus & popovers. */
export function MenuItem({ icon, label, shortcut, trailing, selected = false, danger = false, disabled = false, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const fg = danger ? 'var(--red-400)' : disabled ? 'var(--text-disabled)' : 'var(--text-primary)';
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        height: 38, padding: '0 10px', border: 'none', borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: hover && !disabled ? (danger ? 'var(--status-danger-bg)' : 'var(--surface-card-hover)') : 'transparent',
        color: fg, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, textAlign: 'left',
        transition: 'background var(--dur-fast) var(--ease-out)',
        ...style,
      }}>
      {icon && <span style={{ display: 'flex', color: danger ? 'var(--red-400)' : 'var(--text-secondary)' }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{shortcut}</span>}
      {selected && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      {trailing}
    </button>
  );
}
