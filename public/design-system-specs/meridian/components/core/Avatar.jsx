import React from 'react';

/** Meridian Avatar — circular user/member portrait with monogram fallback and status ring. */
export function Avatar({ src, name = '', size = 40, tone = 'brand', ring = false, style }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const tones = {
    brand: 'linear-gradient(135deg,#12D982,#0E9DE8)',
    warm: 'linear-gradient(135deg,#FF8A4C,#FF6FB0)',
    violet: 'linear-gradient(135deg,#A06BFF,#6C7BFF)',
    slate: 'var(--ink-600)',
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      padding: ring ? 2 : 0,
      background: ring ? 'var(--grad-brand)' : 'transparent',
      ...style,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: src ? 'var(--ink-700)' : tones[tone],
        color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700,
        fontSize: size * 0.38, letterSpacing: '0.01em',
        border: ring ? '2px solid var(--surface-page)' : 'none',
      }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </div>
    </div>
  );
}
