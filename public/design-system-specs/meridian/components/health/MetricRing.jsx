import React from 'react';

const channels = {
  recovery: 'var(--metric-recovery)',
  strain: 'var(--metric-strain)',
  sleep: 'var(--metric-sleep)',
  stress: 'var(--metric-stress)',
  brand: 'var(--brand)',
};
const glows = {
  recovery: 'drop-shadow(0 0 6px rgba(52,224,138,0.55))',
  strain: 'drop-shadow(0 0 6px rgba(59,182,245,0.55))',
  sleep: 'drop-shadow(0 0 6px rgba(138,155,255,0.55))',
  stress: 'drop-shadow(0 0 6px rgba(255,210,63,0.55))',
  brand: 'drop-shadow(0 0 6px rgba(18,217,130,0.55))',
};

/**
 * Meridian MetricRing — the signature circular progress gauge. A thick,
 * round-capped arc on a faint track, colored per health channel, with a
 * bold center readout and label. This is the core visual of the system.
 */
export function MetricRing({
  value = 0, max = 100, channel = 'recovery', size = 120, thickness = 10,
  label, display, unit, sublabel, sweep = 300, glow = true, children, style,
}) {
  size = Number(size) || 120; thickness = Number(thickness) || 10; value = Number(value); max = Number(max) || 100;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circ;
  const pct = Math.max(0, Math.min(1, value / max));
  const startAngle = 90 + (360 - sweep) / 2; // center the gap at bottom
  const color = channels[channel] || channels.recovery;

  // Animate the arc filling from 0 on mount.
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...style }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: `rotate(${startAngle}deg)`, overflow: 'visible' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--metric-track)" strokeWidth={thickness}
            strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={thickness}
            strokeLinecap="round" strokeDasharray={`${arcLen * shown} ${circ}`}
            style={{ filter: glow ? glows[channel] : 'none', transition: 'stroke-dasharray var(--dur-ring) var(--ease-out)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {children || (
            <>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.26, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {display != null ? display : value}{unit && <span style={{ fontSize: size * 0.14, fontWeight: 600 }}>{unit}</span>}
              </span>
              {sublabel && <span style={{ fontFamily: 'var(--font-sans)', fontSize: size * 0.1, fontWeight: 600, color: 'var(--text-tertiary)' }}>{sublabel}</span>}
            </>
          )}
        </div>
      </div>
      {label && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
