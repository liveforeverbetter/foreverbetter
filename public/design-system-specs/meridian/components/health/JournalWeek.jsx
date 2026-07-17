import React from 'react';

/**
 * Meridian JournalWeek — the day-of-week completion strip. Each day is a labeled
 * status dot: complete (mint check), missed (empty), today (ring), or upcoming.
 */
export function JournalWeek({ days = [], style }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, ...style }}>
      {days.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: d.state === 'today' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{d.label}</span>
          <DayDot state={d.state} />
        </div>
      ))}
    </div>
  );
}

function DayDot({ state = 'upcoming' }) {
  const base = { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  if (state === 'complete') return (
    <span style={{ ...base, background: 'var(--brand)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  );
  if (state === 'missed') return <span style={{ ...base, background: 'transparent', border: '2px solid var(--ink-600)' }} />;
  if (state === 'today') return <span style={{ ...base, background: 'var(--surface-card-raised)', border: '2px solid var(--brand)', boxShadow: 'var(--glow-brand)' }} />;
  if (state === 'partial') return (
    <span style={{ ...base, background: 'transparent', border: '2px solid var(--amber-400)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber-400)' }} />
    </span>
  );
  return <span style={{ ...base, background: 'var(--surface-inset)', border: '2px solid var(--border-subtle)' }} />;
}
