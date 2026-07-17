import React from 'react';

/** Meridian Drawer — edge-anchored sheet (right on desktop, bottom on mobile). */
export function Drawer({ open = true, side = 'right', title, children, footer, onClose, size = 380, style }) {
  if (!open) return null;
  const bottom = side === 'bottom';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--surface-scrim)', animation: 'mrd-fade-in var(--dur-base) var(--ease-out)' }} />
      <div role="dialog" style={{
        position: 'absolute',
        ...(bottom
          ? { left: 0, right: 0, bottom: 0, maxHeight: '85vh', borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0' }
          : { top: 0, bottom: 0, right: 0, width: size, borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)' }),
        background: 'var(--surface-overlay)', borderLeft: bottom ? 'none' : '1px solid var(--border-default)',
        borderTop: bottom ? '1px solid var(--border-default)' : 'none',
        boxShadow: 'var(--shadow-overlay)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: `${bottom ? 'mrd-slide-up' : 'mrd-slide-right'} var(--dur-slow) var(--ease-out)`,
        ...style,
      }}>
        {bottom && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '12px auto 4px' }} />}
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h2>
            {onClose && <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: 22 }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid var(--border-subtle)' }}>{footer}</div>}
      </div>
    </div>
  );
}
