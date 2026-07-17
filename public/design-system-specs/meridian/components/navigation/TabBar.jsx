import React from 'react';

/**
 * Meridian TabBar — mobile bottom navigation. Icon + label items with a mint
 * active state, plus an optional floating brand orb action on the trailing edge.
 */
export function TabBar({ items = [], value, onChange, orb, style }) {
  return (
    <nav style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      height: 'var(--tabbar-h)', padding: '0 8px 12px',
      background: 'var(--surface-sunken)',
      borderTop: '1px solid var(--border-subtle)',
      ...style,
    }}>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around', alignItems: 'center' }}>
        {items.map(it => {
          const active = it.value === value;
          return (
            <button key={it.value} type="button" onClick={() => onChange && onChange(it.value)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
              color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: 'color var(--dur-fast) var(--ease-out)',
            }}>
              <Glyph name={it.icon} active={active} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.01em' }}>{it.label}</span>
            </button>
          );
        })}
      </div>
      {orb && (
        <button type="button" onClick={orb.onClick} aria-label={orb.label || 'Assistant'} style={{
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          marginLeft: 6, marginBottom: 2,
          background: 'radial-gradient(circle at 35% 30%, #2a3550, #0c1220)',
          boxShadow: '0 0 0 1px rgba(108,123,255,0.5), 0 0 22px rgba(108,123,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#cfe0ff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
        }}>{orb.glyph || 'M'}</button>
      )}
    </nav>
  );
}

function Glyph({ name, active }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: active ? 2.2 : 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></>,
    overview: <><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/><path d="M3 16.5l9 5 9-5"/></>,
    plan: <><path d="M5 21V4"/><path d="M5 4h11l-2.2 4 2.2 4H5"/></>,
    genetics: <><path d="M8 3c0 4.5 8 6 8 9s-8 4.5-8 9"/><path d="M16 3c0 4.5-8 6-8 9s8 4.5 8 9"/><path d="M9.5 7h5M9.5 17h5M8.6 12h6.8"/></>,
    biomarkers: <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z"/>,
    wearables: <><rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9.2 7l.8-4h4l.8 4M9.2 17l.8 4h4l.8-4"/></>,
    health: <path d="M20.8 8.6a5 5 0 0 0-8.8-3.2A5 5 0 0 0 3.2 8.6c0 5 8.8 11 8.8 11s8.8-6 8.8-11Z"/>,
    community: <><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M4 20c0-3 2.3-5 5-5s5 2 5 5"/><path d="M15.5 20c.2-2 1.2-3.4 3-3.6"/></>,
    more: <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></>,
    trends: <path d="M4 15l4-5 4 3 5-7 3 3"/>,
  };
  return <svg {...common}>{paths[name] || paths.home}</svg>;
}
