import React from 'react';

/**
 * Meridian HealthspanOrb — the hero longevity visual. A glowing particle sphere
 * (bright rim, dark core) with a big center readout and delta caption. Color
 * shifts by tone (green = younger/good, amber = watch, red = older).
 */
export function HealthspanOrb({ value, label = 'BIO AGE', caption, tone = 'good', size = 300, animate = true, style }) {
  const sz = Number(size) || 300;
  const tones = {
    good: { rim: '52,224,138', text: 'var(--green-400)' },
    watch: { rim: '255,210,63', text: 'var(--amber-400)' },
    poor: { rim: '255,90,110', text: 'var(--red-400)' },
    strain: { rim: '59,182,245', text: 'var(--strain-400)' },
  };
  const t = tones[tone] || tones.good;
  const dots = React.useMemo(() => {
    const arr = [];
    let seed = 7;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 46; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = 0.62 + rand() * 0.36; // ring band
      arr.push({
        x: 50 + Math.cos(ang) * rad * 50,
        y: 50 + Math.sin(ang) * rad * 50,
        s: 1.5 + rand() * 4,
        o: 0.3 + rand() * 0.6,
        dur: 3.5 + rand() * 3.5,
        delay: rand() * 4,
      });
    }
    return arr;
  }, []);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 20, ...style }}>
      <div style={{
        position: 'relative', width: sz, height: sz, borderRadius: '50%',
        background: `radial-gradient(circle at 50% 48%, rgba(${t.rim},0) 34%, rgba(${t.rim},0.22) 52%, rgba(${t.rim},0.6) 70%, rgba(${t.rim},0.05) 86%, transparent 92%)`,
        boxShadow: `0 0 60px rgba(${t.rim},0.35), inset 0 0 60px rgba(${t.rim},0.15)`,
        animation: animate ? 'mrd-orb-drift 6s var(--ease-in-out) infinite' : 'none',
      }}>
        {dots.map((d, i) => (
          <span key={i} style={{
            position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s,
            borderRadius: '50%', background: `rgba(${t.rim},${d.o})`,
            boxShadow: `0 0 ${d.s * 1.5}px rgba(${t.rim},${d.o})`, transform: 'translate(-50%,-50%)',
            '--mrd-dot-o': d.o,
            animation: animate ? `mrd-dot-breathe ${d.dur}s var(--ease-in-out) ${d.delay}s infinite` : 'none',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: sz * 0.2, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: sz * 0.05, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-secondary)' }}>{label}</span>
          {caption && <span style={{ fontFamily: 'var(--font-sans)', fontSize: sz * 0.052, fontWeight: 600, color: t.text }}>{caption}</span>}
        </div>
      </div>
    </div>
  );
}
