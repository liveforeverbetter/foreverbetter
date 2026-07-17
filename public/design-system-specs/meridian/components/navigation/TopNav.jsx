import React from 'react';
import { Avatar } from '../core/Avatar.jsx';

/**
 * Meridian TopNav (mobile) — leading avatar, centered date stepper, trailing
 * battery/status readout. The app's primary top chrome.
 */
export function TopNav({ user = {}, date = 'TODAY', battery, onPrev, onNext, onAvatar, style }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 'var(--topnav-h)', padding: '0 18px', background: 'var(--surface-page)',
      ...style,
    }}>
      <button type="button" onClick={onAvatar} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <Avatar name={user.name || 'You'} tone={user.tone || 'warm'} size={36} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-card-raised)', borderRadius: 'var(--radius-pill)', padding: '6px 8px' }}>
        <Stepper dir="left" onClick={onPrev} />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', color: 'var(--text-primary)', padding: '0 6px' }}>{date}</span>
        <Stepper dir="right" onClick={onNext} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
        {battery != null && <>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{battery}%</span>
          <span style={{ width: 22, height: 12, border: '1.5px solid var(--text-secondary)', borderRadius: 3, padding: 1.5, display: 'inline-flex' }}>
            <span style={{ width: `${battery}%`, background: battery > 20 ? 'var(--brand)' : 'var(--red-400)', borderRadius: 1 }} />
          </span>
        </>}
      </div>
    </header>
  );
}

function Stepper({ dir, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={dir} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
      </svg>
    </button>
  );
}
