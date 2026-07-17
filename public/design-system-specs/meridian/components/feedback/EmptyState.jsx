import React from 'react';

/** Meridian EmptyState — icon plate, title, description and an optional action. */
export function EmptyState({ icon, title, description, action, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '40px 24px', animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards', ...style }}>
      {icon && (
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-card-raised)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', marginBottom: 6 }}>{icon}</div>
      )}
      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5, maxWidth: 320 }}>{description}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
