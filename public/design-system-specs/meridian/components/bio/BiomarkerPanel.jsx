import React from 'react';

/**
 * Meridian BiomarkerPanel — a grouped lab panel card (e.g. Metabolic, Lipids,
 * Inflammation). Header shows the panel name, a collected date, and an at-a-glance
 * count of how many markers are in range. Compose BiomarkerRow children inside.
 */
export function BiomarkerPanel({ name, collected, inRange, total, children, action, style }) {
  const allGood = inRange != null && total != null && inRange === total;
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-card)', animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{name}</div>
          {collected && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>Collected {collected}</div>}
        </div>
        {inRange != null && total != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: allGood ? 'var(--green-400)' : 'var(--amber-400)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: allGood ? 'var(--green-400)' : 'var(--amber-400)' }} />
            {inRange}/{total} in range
          </span>
        )}
      </div>
      <div>{children}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
