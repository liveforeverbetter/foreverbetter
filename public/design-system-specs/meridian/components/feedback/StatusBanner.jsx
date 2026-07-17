import React from 'react';

/** Meridian StatusBanner — full-width inline notice. Insight/alert strip on the dashboard. */
export function StatusBanner({ tone = 'info', title, children, icon, action, dismissible = false, onClose, style }) {
  const tones = {
    info: { bg: 'var(--status-info-bg)', fg: 'var(--strain-400)', bd: 'rgba(59,182,245,0.25)' },
    success: { bg: 'var(--status-success-bg)', fg: 'var(--green-400)', bd: 'rgba(52,224,138,0.25)' },
    warning: { bg: 'var(--status-warning-bg)', fg: 'var(--amber-400)', bd: 'rgba(255,210,63,0.25)' },
    danger: { bg: 'var(--status-danger-bg)', fg: 'var(--red-400)', bd: 'rgba(255,90,110,0.25)' },
    neutral: { bg: 'var(--surface-card-raised)', fg: 'var(--text-secondary)', bd: 'var(--border-subtle)' },
  };
  const t = tones[tone] || tones.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
      background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 'var(--radius-md)', ...style,
    }}>
      {icon && <span style={{ color: t.fg, display: 'flex', marginTop: 1, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: children ? 3 : 0 }}>{title}</div>}
        {children && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{children}</div>}
        {action && <div style={{ marginTop: 12 }}>{action}</div>}
      </div>
      {dismissible && <button type="button" onClick={onClose} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
    </div>
  );
}
