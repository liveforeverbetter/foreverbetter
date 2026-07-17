import React from 'react';

/** Meridian Modal — centered dialog on a scrim. Presentational; control `open` yourself. */
export function Modal({ open = true, title, subtitle, children, footer, onClose, width = 420, style }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--surface-scrim)', backdropFilter: 'blur(4px)', animation: 'mrd-fade-in var(--dur-base) var(--ease-out)' }} />
      <div role="dialog" aria-modal="true" style={{
        position: 'relative', width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
        background: 'var(--surface-overlay)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-overlay)', padding: 24,
        animation: 'mrd-scale-in var(--dur-slow) var(--ease-out)',
        ...style,
      }}>
        {(title || onClose) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: subtitle ? 4 : 16 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h2>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2, marginTop: 2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        )}
        {subtitle && <p style={{ margin: '0 0 18px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{subtitle}</p>}
        <div>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>{footer}</div>}
      </div>
    </div>
  );
}
