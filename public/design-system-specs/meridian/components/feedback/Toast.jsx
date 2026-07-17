import React from 'react';

const toneMap = {
  success: { fg: 'var(--green-400)', icon: 'check' },
  warning: { fg: 'var(--amber-400)', icon: 'alert' },
  danger: { fg: 'var(--red-400)', icon: 'alert' },
  info: { fg: 'var(--strain-400)', icon: 'info' },
  neutral: { fg: 'var(--text-secondary)', icon: 'info' },
};

/** Meridian Toast — brief, non-blocking feedback card. */
export function Toast({ tone = 'neutral', title, message, action, onClose, style }) {
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, width: 360, maxWidth: '100%',
      padding: '14px 16px', background: 'var(--surface-overlay)',
      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-raised)', animation: 'mrd-toast-in var(--dur-base) var(--ease-out)', ...style,
    }}>
      <span style={{ color: t.fg, display: 'flex', marginTop: 1 }}><StatusGlyph kind={t.icon} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: message ? 2 : 0 }}>{title}</div>}
        {message && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{message}</div>}
      </div>
      {action}
      {onClose && <button type="button" onClick={onClose} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
    </div>
  );
}

export function StatusGlyph({ kind = 'info', size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'check') return <svg {...p}><circle cx="12" cy="12" r="9"/><polyline points="8.5 12.5 11 15 15.5 9.5"/></svg>;
  if (kind === 'alert') return <svg {...p}><path d="M12 3 2 20h20L12 3Z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.2" r="0.6" fill="currentColor"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/></svg>;
}
