import React from 'react';

/**
 * Meridian RiskMeter — a polygenic / genetic risk indicator. A segmented gauge
 * (reduced → typical → increased) with the active band highlighted, plus a value
 * label. Used for genetic predisposition and biomarker-derived risk scores.
 */
export function RiskMeter({ level = 'typical', label, caption, segments, style }) {
  const bands = segments || [
    { key: 'reduced', label: 'Reduced', tone: 'var(--green-400)' },
    { key: 'typical', label: 'Typical', tone: 'var(--strain-400)' },
    { key: 'increased', label: 'Increased', tone: 'var(--amber-400)' },
    { key: 'high', label: 'High', tone: 'var(--red-400)' },
  ];
  const activeTone = (bands.find(b => b.key === level) || bands[1]).tone;
  return (
    <div style={{ width: '100%', ...style }}>
      {(label || caption) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>}
          {caption && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: activeTone }}>{caption}</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {bands.map(b => {
          const on = b.key === level;
          return (
            <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ height: 6, borderRadius: 'var(--radius-pill)', background: on ? b.tone : 'var(--metric-track)', boxShadow: on ? `0 0 12px ${b.tone}66` : 'none' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: on ? 700 : 500, letterSpacing: '0.02em', color: on ? b.tone : 'var(--text-tertiary)', textAlign: 'center' }}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
